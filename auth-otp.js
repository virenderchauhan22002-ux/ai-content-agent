const express = require("express");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { getApps, initializeApp, cert } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const { Resend } = require("resend");

const router = express.Router();

// ===============================
// CONFIGURATION
// ===============================

const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

if (!serviceAccountPath || !fs.existsSync(serviceAccountPath)) {
    throw new Error("Firebase service account file is missing.");
}

const serviceAccount = JSON.parse(
    fs.readFileSync(serviceAccountPath, "utf8")
);

if (getApps().length === 0) {
    initializeApp({
        credential: cert(serviceAccount)
    });
}

const firebaseAuth = getAuth();
if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL) {
    throw new Error("Resend configuration is missing.");
}

const resend = new Resend(process.env.RESEND_API_KEY);

const OTP_SECRET =
    process.env.OTP_HASH_SECRET ||
    crypto.randomBytes(32).toString("hex");

const OTP_EXPIRY_MS = 5 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;
const MAX_OTP_ATTEMPTS = 5;
const REGISTRATION_TOKEN_EXPIRY_MS = 5 * 60 * 1000;

// In-memory challenges: suitable for local testing.
// Production should use a persistent, shared store.
const pendingOtps = new Map();
const verifiedRegistrations = new Map();
const sendLimits = new Map();

// ===============================
// HELPERS
// ===============================

function normalizeEmail(email) {
    return String(email || "").trim().toLowerCase();
}

function hashOtp(otp) {
    return crypto
        .createHmac("sha256", OTP_SECRET)
        .update(otp)
        .digest("hex");
}

function safeCompare(a, b) {
    const first = Buffer.from(a, "hex");
    const second = Buffer.from(b, "hex");

    return first.length === second.length &&
        crypto.timingSafeEqual(first, second);
}

function validEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function cleanExpiredEntries() {
    const now = Date.now();

    for (const [email, data] of pendingOtps) {
        if (data.expiresAt <= now) {
            pendingOtps.delete(email);
        }
    }

    for (const [token, data] of verifiedRegistrations) {
        if (data.expiresAt <= now) {
            verifiedRegistrations.delete(token);
        }
    }

    for (const [key, data] of sendLimits) {
        if (data.resetAt <= now) {
            sendLimits.delete(key);
        }
    }
}

function getClientIp(req) {
    // Do not trust arbitrary X-Forwarded-For headers.
    return req.socket.remoteAddress || "unknown";
}

// ===============================
// SEND REGISTRATION OTP
// POST /api/auth/send-otp
// ===============================

router.post("/send-otp", async (req, res) => {
    try {
        cleanExpiredEntries();

        const fullName = String(req.body.fullName || req.body.name || "").trim();
        const email = normalizeEmail(req.body.email);

        if (fullName.length < 2 || fullName.length > 80) {
            return res.status(400).json({
                success: false,
                message: "Please enter a valid full name."
            });
        }

        if (!validEmail(email) || email.length > 254) {
            return res.status(400).json({
                success: false,
                message: "Please enter a valid email address."
            });
        }

        const ip = getClientIp(req);
        const limitKey = `${ip}:${email}`;
        const now = Date.now();

        let limit = sendLimits.get(limitKey);

        if (!limit || limit.resetAt <= now) {
            limit = {
                count: 0,
                resetAt: now + 15 * 60 * 1000
            };
        }

        if (limit.count >= 3) {
            return res.status(429).json({
                success: false,
                message: "Too many OTP requests. Try again later."
            });
        }

        const previous = pendingOtps.get(email);

        if (previous && previous.resendAfter > now) {
            return res.status(429).json({
                success: false,
                message: "Please wait before requesting another OTP."
            });
        }

        // Do not send a registration OTP to an existing account.
        try {
            await firebaseAuth.getUserByEmail(email);

            return res.status(409).json({
                success: false,
                message: "An account already exists with this email. Please log in."
            });
        } catch (error) {
            if (error.code !== "auth/user-not-found") {
                throw error;
            }
        }

        const otp = crypto
            .randomInt(100000, 1000000)
            .toString();

        const result = await resend.emails.send({
            from: process.env.RESEND_FROM_EMAIL,
            to: [email],
            subject: "Your AI Content Agent verification code",
            html: `
                <div style="font-family:Arial,sans-serif;max-width:500px;margin:auto">
                    <h2>Verify your email</h2>
                    <p>Hello ${fullName.replace(/[&<>"']/g, "")},</p>
                    <p>Your email verification code is:</p>
                    <h1 style="letter-spacing:8px">${otp}</h1>
                    <p>This code expires in 5 minutes.</p>
                    <p>If you did not request this code, you can ignore this email.</p>
                </div>
            `
        });

        if (result.error) {
            console.error("Resend delivery error:", result.error.name || "Email delivery failed");

            return res.status(502).json({
                success: false,
                message: "Unable to send verification email. Please try again."
            });
        }

        pendingOtps.set(email, {
            fullName,
            otpHash: hashOtp(otp),
            expiresAt: now + OTP_EXPIRY_MS,
            resendAfter: now + RESEND_COOLDOWN_MS,
            attempts: 0
        });

        limit.count++;
        sendLimits.set(limitKey, limit);

        return res.json({
            success: true,
            message: "Verification code sent to your email."
        });

    } catch (error) {
        console.error("Send OTP error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to process your request right now."
        });
    }
});

// ===============================
// VERIFY REGISTRATION OTP
// POST /api/auth/verify-otp
// ===============================

router.post("/verify-otp", (req, res) => {
    cleanExpiredEntries();

    const email = normalizeEmail(req.body.email);
    const otp = String(req.body.otp || "").trim();

    if (!validEmail(email) || !/^\d{6}$/.test(otp)) {
        return res.status(400).json({
            success: false,
            message: "Invalid email or verification code."
        });
    }

    const challenge = pendingOtps.get(email);

    if (!challenge || challenge.expiresAt <= Date.now()) {
        pendingOtps.delete(email);

        return res.status(400).json({
            success: false,
            message: "Code expired. Please request a new code."
        });
    }

    if (challenge.attempts >= MAX_OTP_ATTEMPTS) {
        pendingOtps.delete(email);

        return res.status(429).json({
            success: false,
            message: "Too many incorrect attempts. Request a new code."
        });
    }

    challenge.attempts++;

    if (!safeCompare(hashOtp(otp), challenge.otpHash)) {
        return res.status(400).json({
            success: false,
            message: "Incorrect verification code."
        });
    }

    pendingOtps.delete(email);

    const registrationToken = crypto
        .randomBytes(32)
        .toString("hex");

    verifiedRegistrations.set(registrationToken, {
        email,
        fullName: challenge.fullName,
        expiresAt: Date.now() + REGISTRATION_TOKEN_EXPIRY_MS
    });

    return res.json({
        success: true,
        message: "Email verified successfully.",
        registrationToken
    });
});

// ===============================
// COMPLETE REGISTRATION
// POST /api/auth/complete-registration
// ===============================

router.post("/complete-registration", async (req, res) => {
    cleanExpiredEntries();

    const registrationToken = String(
        req.body.registrationToken || ""
    );

    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password || "");

    if (!/^[a-f0-9]{64}$/.test(registrationToken)) {
        return res.status(400).json({
            success: false,
            message: "Invalid or expired registration verification."
        });
    }

    const registration = verifiedRegistrations.get(registrationToken);

    if (!registration ||
        registration.expiresAt <= Date.now() ||
        registration.email !== email) {

        return res.status(400).json({
            success: false,
            message: "Registration verification expired. Please verify your email again."
        });
    }

    if (password.length < 8 || password.length > 128) {
        return res.status(400).json({
            success: false,
            message: "Password must be between 8 and 128 characters."
        });
    }

    // Consume the one-time token before account creation.
    verifiedRegistrations.delete(registrationToken);

    try {
        const user = await firebaseAuth.createUser({
            email: registration.email,
            password,
            displayName: registration.fullName,
            emailVerified: true
        });

        const customToken = await firebaseAuth.createCustomToken(user.uid);

        return res.status(201).json({
            success: true,
            message: "Registration completed successfully.",
            customToken,
            uid: user.uid
        });

    } catch (error) {
        console.error("Registration error:", error.code || "Account creation failed");

        if (error.code === "auth/email-already-exists") {
            return res.status(409).json({
                success: false,
                message: "An account already exists with this email. Please log in."
            });
        }

        if (error.code === "auth/invalid-password") {
            return res.status(400).json({
                success: false,
                message: "The password does not meet Firebase requirements."
            });
        }

        return res.status(500).json({
            success: false,
            message: "Unable to complete registration right now."
        });
    }
});

module.exports = router;