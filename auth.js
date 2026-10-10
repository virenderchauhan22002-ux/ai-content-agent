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
    createUserWithEmailAndPassword,
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
    apiKey:"AIzaSyAF9-LEij0O7caT5I74f2UtfGDdc78JGqQ",
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
                    Create Account
                </button>
                `;

        }

    } else {

        if (authTitle) {

            authTitle.textContent =
                "Create Your Account";

        }


        if (authSubtitle) {

            authSubtitle.textContent =
                "Create a free account and start using AI Content Agent.";

        }


        if (authButton) {

            authButton.textContent =
                "🚀 Create Account";

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
// LOGIN / REGISTER FORM
// ==========================================

if (authForm) {

    authForm.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();

            clearAuthMessage();


            const email =
                authEmail.value.trim();


            const password =
                authPassword.value;


            // ==============================
            // VALIDATION
            // ==============================

            if (!email) {

                showAuthMessage(
                    "Please enter your email."
                );

                return;

            }


            if (!password) {

                showAuthMessage(
                    "Please enter your password."
                );

                return;

            }


            if (password.length < 6) {

                showAuthMessage(
                    "Password must be at least 6 characters."
                );

                return;

            }


            // ==============================
            // BUTTON LOADING
            // ==============================

            if (authButton) {

                authButton.disabled =
                    true;

                authButton.dataset.originalText =
                    authButton.textContent;

                authButton.textContent =
                    isLoginMode
                        ? "Logging in..."
                        : "Creating account...";

            }


            try {

                // ==========================
                // LOGIN
                // ==========================

                if (isLoginMode) {

                    const credential =
                        await signInWithEmailAndPassword(
                            auth,
                            email,
                            password
                        );


                    await ensureUserDocument(
                        credential.user
                    );

                }


                // ==========================
                // REGISTER
                // ==========================

                else {

                    const credential =
                        await createUserWithEmailAndPassword(
                            auth,
                            email,
                            password
                        );


                    await ensureUserDocument(
                        credential.user
                    );

                }


                if (authForm) {

                    authForm.reset();

                }


            } catch (error) {

                console.error(
                    "Firebase Auth Error:",
                    error
                );


                let message =
                    "Something went wrong. Please try again.";


                switch (error.code) {

                    case "auth/invalid-email":

                        message =
                            "Please enter a valid email address.";

                        break;


                    case "auth/user-not-found":

                        message =
                            "No account found with this email.";

                        break;


                    case "auth/wrong-password":

                    case "auth/invalid-credential":

                        message =
                            "Incorrect email or password.";

                        break;


                    case "auth/email-already-in-use":

                        message =
                            "An account already exists with this email.";

                        break;


                    case "auth/weak-password":

                        message =
                            "Password should be at least 6 characters.";

                        break;


                    case "auth/too-many-requests":

                        message =
                            "Too many attempts. Please try again later.";

                        break;


                    case "auth/network-request-failed":

                        message =
                            "Network error. Please check your internet connection.";

                        break;


                    case "auth/api-key-not-valid":

                    case "auth/api-key-not-valid.-please-pass-a-valid-api-key.":

                        message =
                            "Firebase configuration/API key is invalid.";

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

                if (authButton) {

                    authButton.disabled =
                        false;


                    authButton.textContent =
                        authButton.dataset.originalText ||
                        (
                            isLoginMode
                                ? "🔐 Login"
                                : "🚀 Create Account"
                        );

                }

            }

        }
    );

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