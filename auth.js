// ==========================================
// FIREBASE AUTHENTICATION
// AI CONTENT AGENT
// ==========================================

import {
    initializeApp,
    getApp,
    getApps
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";

import {
    getAuth,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signInWithCustomToken,
    sendPasswordResetEmail,
    GoogleAuthProvider,
    signInWithPopup,
    signOut
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";

import {
    getFirestore,
    doc,
    getDoc,
    setDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";


// ==========================================
// FIREBASE CONFIG
// ==========================================

const firebaseConfig = {
    apiKey: "AIzaSyAF9-LEij0O7caT5I74f2UtfGDdc78JGqQ",
    authDomain: "ai-content-agent-a9820.firebaseapp.com",
    projectId: "ai-content-agent-a9820",
    storageBucket: "ai-content-agent-a9820.firebasestorage.app",
    messagingSenderId: "833284009437",
    appId: "1:833284009437:web:91859542fb1f87ccdb9a34"
};


// ==========================================
// USE EXISTING DEFAULT FIREBASE APP
// ==========================================

const app = getApps().length
    ? getApp()
    : initializeApp(firebaseConfig);


// ==========================================
// FIREBASE SERVICES
// ==========================================

const auth = getAuth(app);
const db = getFirestore(app);


// ==========================================
// DOM ELEMENTS
// ==========================================

const authScreen =
    document.getElementById("authScreen");

const appContent =
    document.getElementById("appContent");

const authForm =
    document.getElementById("authForm");

const authEmail =
    document.getElementById("authEmail");

const authPassword =
    document.getElementById("authPassword");

const authTitle =
    document.getElementById("authTitle");

const authSubtitle =
    document.getElementById("authSubtitle");

const authButton =
    document.getElementById("authButton");

const authToggle =
    document.getElementById("authToggle");

const authMessage =
    document.getElementById("authMessage");

const logoutBtn =
    document.getElementById("logoutBtn");

const profile =
    document.querySelector(".profile");


// ==========================================
// AUTH MODE
// ==========================================

let isLoginMode = true;


// ==========================================
// AUTH MESSAGE
// ==========================================

function showAuthMessage(
    message,
    type = "error"
) {

    if (!authMessage) {
        return;
    }

    authMessage.textContent =
        message;

    authMessage.style.display =
        "block";

    authMessage.style.color =
        type === "success"
            ? "#188038"
            : "#d93025";
}


function clearAuthMessage() {

    if (!authMessage) {
        return;
    }

    authMessage.textContent =
        "";

    authMessage.style.display =
        "none";
}


// ==========================================
// FORGOT PASSWORD UI
// ==========================================

function createForgotPasswordLink() {

    if (!authPassword || !authButton) {
        return;
    }

    let forgotPassword =
        document.getElementById("forgotPassword");

    if (!forgotPassword) {

        forgotPassword =
            document.createElement("button");

        forgotPassword.type =
            "button";

        forgotPassword.id =
            "forgotPassword";

        forgotPassword.textContent =
            "Forgot Password?";

        // Keep the design simple and consistent
        forgotPassword.style.display =
            "block";

        forgotPassword.style.width =
            "100%";

        forgotPassword.style.marginTop =
            "8px";

        forgotPassword.style.marginBottom =
            "8px";

        forgotPassword.style.padding =
            "4px";

        forgotPassword.style.border =
            "none";

        forgotPassword.style.background =
            "transparent";

        forgotPassword.style.color =
            "#2563eb";

        forgotPassword.style.fontSize =
            "13px";

        forgotPassword.style.fontWeight =
            "600";

        forgotPassword.style.cursor =
            "pointer";

        forgotPassword.style.textAlign =
            "right";

        authButton.parentNode.insertBefore(
            forgotPassword,
            authButton
        );


        forgotPassword.addEventListener(
            "click",
            async () => {

                clearAuthMessage();

                const email =
                    authEmail
                        ? authEmail.value.trim()
                        : "";

                if (!email) {

                    showAuthMessage(
                        "Please enter your email first."
                    );

                    if (authEmail) {
                        authEmail.focus();
                    }

                    return;
                }


                // Basic email validation
                if (
                    !email.includes("@") ||
                    !email.includes(".")
                ) {

                    showAuthMessage(
                        "Please enter a valid email address."
                    );

                    if (authEmail) {
                        authEmail.focus();
                    }

                    return;
                }


                forgotPassword.disabled =
                    true;

                forgotPassword.textContent =
                    "Sending reset email...";


                try {

                    await sendPasswordResetEmail(
                        auth,
                        email
                    );

                    showAuthMessage(
                        "Password reset email sent. Please check your inbox and spam folder.",
                        "success"
                    );

                } catch (error) {

                    console.error(
                        "Password Reset Error:",
                        error
                    );

                    let message =
                        "Unable to send password reset email. Please try again.";

                    switch (error.code) {

                        case "auth/invalid-email":

                            message =
                                "Please enter a valid email address.";

                            break;


                        case "auth/user-not-found":

                            message =
                                "No account found with this email.";

                            break;


                        case "auth/too-many-requests":

                            message =
                                "Too many requests. Please try again later.";

                            break;


                        case "auth/network-request-failed":

                            message =
                                "Network error. Please check your internet connection.";

                            break;


                        case "auth/operation-not-allowed":

                            message =
                                "Password reset is currently unavailable.";

                            break;


                        default:

                            message =
                                error.message ||
                                message;

                    }

                    showAuthMessage(
                        message
                    );

                } finally {

                    forgotPassword.disabled =
                        false;

                    forgotPassword.textContent =
                        "Forgot Password?";

                }

            }
        );

    }

    // Show only in Login mode
    forgotPassword.style.display =
        isLoginMode
            ? "block"
            : "none";
}


// ==========================================
// LOGIN / REGISTER MODE
// ==========================================

function updateAuthMode() {

    clearAuthMessage();


    if (isLoginMode) {

        if (authTitle) {

            authTitle.textContent =
                "Welcome Back";

        }


        if (authSubtitle) {

            authSubtitle.textContent =
                "Login to continue creating smarter content with AI.";

        }


        if (authButton) {

            authButton.textContent =
                "🔐 Login";

        }


        if (authToggle) {

            authToggle.innerHTML =
                `
                Don't have an account?

                <button
                    type="button"
                    id="switchAuthMode"
                >
                    Sign up with Email
                </button>
                `;

        }

    } else {

        if (authTitle) {

            authTitle.textContent =
                "Sign Up";

        }


        if (authSubtitle) {

            authSubtitle.textContent =
                "Create a free account and start using AI Content Agent.";

        }


        if (authButton) {

            authButton.textContent =
                "Sign Up";

        }


        if (authToggle) {

            authToggle.innerHTML =
                `
                Already have an account?

                <button
                    type="button"
                    id="switchAuthMode"
                >
                    Login
                </button>
                `;

        }

    }


    // Create / update Forgot Password
    createForgotPasswordLink();


    const switchButton =
        document.getElementById(
            "switchAuthMode"
        );


    if (switchButton) {

        switchButton.addEventListener(
            "click",
            () => {

                isLoginMode =
                    !isLoginMode;

                resetRegistrationPhase();
                updateAuthMode();

            }
        );

    }

}


updateAuthMode();


// ==========================================
// ENSURE USER DOCUMENT
// ==========================================

async function ensureUserDocument(user) {

    if (!user) {
        return;
    }


    const userRef =
        doc(
            db,
            "users",
            user.uid
        );


    try {

        const email =
            user.email || "";


        const name =
            user.displayName ||
            (
                email
                    ? email.split("@")[0]
                    : "User"
            );


        const userSnapshot =
            await getDoc(userRef);


        const userData = {

            uid:
                user.uid,

            email:
                email,

            name:
                name,

            role:
                "user",

            plan:
                "free",

            status:
                "active",

            lastLoginAt:
                serverTimestamp()

        };


        // ==================================
        // NEW USER
        // ==================================

        if (!userSnapshot.exists()) {

            userData.createdAt =
                serverTimestamp();


            await setDoc(
                userRef,
                userData
            );


            console.log(
                "Firestore user document CREATED:",
                userData
            );


            return;

        }


        // ==================================
        // EXISTING USER
        // ==================================

        const existingData =
            userSnapshot.data() || {};


        // Preserve existing role

        if (existingData.role) {

            userData.role =
                existingData.role;

        }


        // Preserve existing plan

        if (existingData.plan) {

            userData.plan =
                existingData.plan;

        }


        // Preserve existing status

        if (existingData.status) {

            userData.status =
                existingData.status;

        }


        // Preserve createdAt

        if (existingData.createdAt) {

            userData.createdAt =
                existingData.createdAt;

        } else {

            userData.createdAt =
                serverTimestamp();

        }


        // Update complete document

        await setDoc(
            userRef,
            userData
        );


        console.log(
            "Firestore user document UPDATED:",
            userData
        );


    } catch (error) {

        console.error(
            "Firestore User Document Error:",
            error
        );

    }

}


// ==========================================
const authChoiceScreen = document.getElementById("authChoiceScreen");
const googleSignInButton = document.getElementById("googleSignInButton");
const continueWithEmailButton = document.getElementById("continueWithEmailButton");
const emailBackButton = document.getElementById("emailBackButton");
const authChoiceMessage = document.getElementById("authChoiceMessage");

if (continueWithEmailButton) {
    continueWithEmailButton.addEventListener("click", () => {
        authChoiceScreen.style.display = "none";
        authForm.style.display = "block";
        emailBackButton.style.display = "inline-block";
        authChoiceMessage.style.display = "none";
        clearAuthMessage();
        authEmail.focus();
    });
}

if (emailBackButton) {
    emailBackButton.addEventListener("click", () => {
        authForm.style.display = "none";
        emailBackButton.style.display = "none";
        authChoiceScreen.style.display = "block";
        clearAuthMessage();
    });
}

if (googleSignInButton) {
    googleSignInButton.addEventListener("click", async () => {
        authChoiceMessage.textContent = "";
        authChoiceMessage.style.display = "none";
        googleSignInButton.disabled = true;
        googleSignInButton.textContent = "Connecting to Google...";

        try {
            const provider = new GoogleAuthProvider();
            provider.setCustomParameters({ prompt: "select_account" });

            const credential = await signInWithPopup(auth, provider);
            await ensureUserDocument(credential.user);
        } catch (error) {
            console.error("Google sign-in error:", error);

            const messages = {
                "auth/popup-closed-by-user": "Google sign-in was cancelled. Please try again.",
                "auth/popup-blocked": "Your browser blocked the Google sign-in popup. Allow popups and retry.",
                "auth/unauthorized-domain": "This website domain is not authorized in Firebase Authentication.",
                "auth/account-exists-with-different-credential": "An account already exists with this email. Sign in using your existing method."
            };

            authChoiceMessage.textContent =
                messages[error.code] || "Google sign-in failed. Please try again.";
            authChoiceMessage.style.display = "block";
        } finally {
            googleSignInButton.disabled = false;
            googleSignInButton.textContent = "Continue with Google";
        }
    });
}
// ==========================================
// REGISTRATION FIELDS + OTP HELPERS
// ==========================================

let registrationPhase = "details";
let verifiedRegistrationToken = "";

function makeAuthField(id, labelText, type, placeholder, autoComplete) {
    const wrapper = document.createElement("div");
    wrapper.className = "auth-field";
    wrapper.id = id + "Field";

    const label = document.createElement("label");
    label.htmlFor = id;
    label.textContent = labelText;

    const input = document.createElement("input");
    input.type = type;
    input.id = id;
    input.placeholder = placeholder;
    input.autocomplete = autoComplete || "off";

    wrapper.append(label, input);
    return { wrapper, input };
}

const fullNameControl = {
    wrapper: document.getElementById("authFullNameField"),
    input: document.getElementById("authFullName")
};

const confirmPasswordControl = makeAuthField(
    "authConfirmPassword",
    "Confirm Password",
    "password",
    "Re-enter your password",
    "new-password"
);

const otpControl = makeAuthField(
    "authRegistrationOtp",
    "Email Verification Code",
    "text",
    "Enter 6-digit code",
    "one-time-code"
);

otpControl.input.inputMode = "numeric";
otpControl.input.maxLength = 6;
otpControl.input.pattern = "[0-9]{6}";

const emailField = authEmail
    ? authEmail.closest(".auth-field")
    : null;

const passwordField = authPassword
    ? authPassword.closest(".auth-field")
    : null;


if (passwordField) {
    passwordField.after(confirmPasswordControl.wrapper);
    confirmPasswordControl.wrapper.after(otpControl.wrapper);
}

function resetRegistrationPhase() {
    registrationPhase = "details";
    verifiedRegistrationToken = "";

    fullNameControl.wrapper.style.display =
        isLoginMode ? "none" : "block";

    confirmPasswordControl.wrapper.style.display =
        isLoginMode ? "none" : "block";

    otpControl.wrapper.style.display = "none";

    fullNameControl.input.required = !isLoginMode;
    confirmPasswordControl.input.required = !isLoginMode;
    otpControl.input.required = false;

    if (authPassword) {
        authPassword.minLength = isLoginMode ? 6 : 8;
        authPassword.autocomplete =
            isLoginMode ? "current-password" : "new-password";
    }

    if (authButton) {
        authButton.textContent =
            isLoginMode ? "Login" : "Sign Up";
    }
}

// The site is hosted on Firebase Hosting, but the OTP API lives on the Render
// backend. Use Render everywhere except when testing locally.
const AUTH_API_BASE_URL =
    ["localhost", "127.0.0.1"].includes(window.location.hostname)
        ? ""
        : "https://ai-content-agent-3hb3.onrender.com";

async function callAuthApi(endpoint, payload) {
    const response = await fetch(AUTH_API_BASE_URL + endpoint, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(
            result.message ||
            result.error ||
            "Request failed. Please try again."
        );
    }

    return result;
}

resetRegistrationPhase();
// LOGIN / REGISTER FORM
// ==========================================

if (authForm) {
    authForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        clearAuthMessage();

        const email = authEmail.value.trim().toLowerCase();
        const password = authPassword.value;

        if (!email) {
            showAuthMessage("Please enter your email.");
            return;
        }

        if (!password) {
            showAuthMessage("Please enter your password.");
            return;
        }

        if (isLoginMode) {
            if (password.length < 6) {
                showAuthMessage("Please enter a valid password.");
                return;
            }
        } else {
            if (password.length < 8) {
                showAuthMessage("Password must be at least 8 characters.");
                return;
            }

            if (registrationPhase === "details") {
                const fullName = fullNameControl.input.value.trim();
                const confirmPassword = confirmPasswordControl.input.value;

                if (!fullName) {
                    showAuthMessage("Please enter your full name.");
                    fullNameControl.input.focus();
                    return;
                }

                if (fullName.length < 2 || fullName.length > 100) {
                    showAuthMessage("Full name must be between 2 and 100 characters.");
                    return;
                }

                if (password !== confirmPassword) {
                    showAuthMessage("Passwords do not match.");
                    confirmPasswordControl.input.focus();
                    return;
                }
            } else {
                const otp = otpControl.input.value.trim();

                if (!/^[0-9]{6}$/.test(otp)) {
                    showAuthMessage("Please enter the 6-digit verification code.");
                    otpControl.input.focus();
                    return;
                }
            }
        }

        if (authButton) {
            authButton.disabled = true;
            authButton.dataset.originalText = authButton.textContent;
            authButton.textContent = isLoginMode
                ? "Logging in..."
                : registrationPhase === "details"
                    ? "Sending verification code..."
                    : "Verifying code...";
        }

        try {
            // Existing users: email + password only. No OTP on login.
            if (isLoginMode) {
                const credential = await signInWithEmailAndPassword(
                    auth,
                    email,
                    password
                );

                await ensureUserDocument(credential.user);
                authForm.reset();
                return;
            }

            // Registration step 1: send email OTP.
            if (registrationPhase === "details") {
                await callAuthApi("/api/auth/send-otp", {
                    name: fullNameControl.input.value.trim(),
                    email
                });

                registrationPhase = "otp";
                otpControl.wrapper.style.display = "block";
                otpControl.input.required = true;
                otpControl.input.value = "";

                fullNameControl.input.readOnly = true;
                authEmail.readOnly = true;
                authPassword.readOnly = true;
                confirmPasswordControl.input.readOnly = true;

                if (authButton) {
                    authButton.textContent = "Verify OTP";
                }

                showAuthMessage(
                    "Verification code sent to your email. It expires in 5 minutes.",
                    "success"
                );

                otpControl.input.focus();
                return;
            }

            // Registration step 2: verify OTP.
            if (!verifiedRegistrationToken) {
                const verification = await callAuthApi(
                    "/api/auth/verify-otp",
                    {
                        email,
                        otp: otpControl.input.value.trim()
                    }
                );

                verifiedRegistrationToken =
                    verification.registrationToken ||
                    verification.token ||
                    "";

                if (!verifiedRegistrationToken) {
                    throw new Error(
                        "OTP verification response did not contain a registration token."
                    );
                }
            }

            // Registration step 3: create Firebase account after OTP verification.
            const completed = await callAuthApi(
                "/api/auth/complete-registration",
                {
                    name: fullNameControl.input.value.trim(),
                    email,
                    password,
                    registrationToken: verifiedRegistrationToken
                }
            );

            if (!completed.customToken) {
                throw new Error(
                    "Registration response did not contain a Firebase sign-in token."
                );
            }

            const credential = await signInWithCustomToken(
                auth,
                completed.customToken
            );

            await ensureUserDocument(credential.user);

            authForm.reset();
            registrationPhase = "details";
            verifiedRegistrationToken = "";

        } catch (error) {
            console.error("Authentication error:", error);

            const message = error.message ||
                "Something went wrong. Please try again.";

            showAuthMessage(message);

        } finally {
            if (authButton) {
                authButton.disabled = false;

                if (isLoginMode) {
                    authButton.textContent = "Login";
                } else if (registrationPhase === "otp") {
                    authButton.textContent = "Verify OTP";
                } else {
                    authButton.textContent = "Sign Up";
                }
            }
        }
    });
}


// ==========================================
// LOGOUT
// ==========================================

if (logoutBtn) {

    logoutBtn.addEventListener(
        "click",
        async () => {

            try {

                await signOut(
                    auth
                );

            } catch (error) {

                console.error(
                    "Logout Error:",
                    error
                );

            }

        }
    );

}


// ==========================================
// AUTH STATE
// ==========================================

onAuthStateChanged(
    auth,
    async (user) => {

        if (user) {

            // ==============================
            // HIDE LOGIN
            // ==============================

            if (authScreen) {

                authScreen.style.display =
                    "none";

            }


            // ==============================
            // SHOW APP
            // ==============================

            if (appContent) {

                appContent.style.display =
                    "block";

            }


            // ==============================
            // PROFILE
            // ==============================

            if (profile) {

                profile.textContent =
                    user.email
                        ? user.email
                            .charAt(0)
                            .toUpperCase()
                        : "AI";


                profile.title =
                    user.email || "";

            }


            // ==============================
            // LOGOUT BUTTON
            // ==============================

            if (logoutBtn) {

                logoutBtn.style.display =
                    "inline-flex";

            }


            // ==============================
            // FIRESTORE USER
            // ==============================

            await ensureUserDocument(
                user
            );


            console.log(
                "User logged in:",
                user.email
            );


        } else {

            // ==============================
            // SHOW LOGIN
            // ==============================

            if (authScreen) {

                authScreen.style.display =
                    "flex";

            }


            // ==============================
            // HIDE APP
            // ==============================

            if (appContent) {

                appContent.style.display =
                    "none";

            }


            // ==============================
            // HIDE LOGOUT
            // ==============================

            if (logoutBtn) {

                logoutBtn.style.display =
                    "none";

            }


            console.log(
                "No user logged in."
            );

        }

    }
);