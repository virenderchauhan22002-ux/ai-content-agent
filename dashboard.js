// ============================================================
// AI CONTENT AGENT
// DASHBOARD / PROFILE / SETTINGS / CUSTOMER PORTAL
// ============================================================

import {
    getApps,
    getApp
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";

import {
    getAuth,
    onAuthStateChanged,
    updateProfile,
    sendPasswordResetEmail,
    deleteUser
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";

import {
    getFirestore,
    doc,
    getDoc,
    setDoc,
    deleteDoc,
    collection,
    getDocs,
    writeBatch
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";


// ============================================================
// APP VERSION & DEFAULT STATE
// ============================================================

const APP_VERSION = "1.0.0";

let app = null;
let auth = null;
let db = null;

let currentUser = null;
let dashboardCreated = false;

// Customer-Side Read-Only Settings Store
let activeAppSettings = {
    ads: {
        enabled: true,
        frequency: "medium",
        duration: "10",
        placement: "between-actions",
        network: "none"
    },
    announcement: {
        enabled: false,
        title: "",
        message: ""
    },
    plans: {
        freeContentLimit: 10,
        freeChatLimit: 10,
        freeImageLimit: 3,
        paidNoAds: true
    },
    app: {
        appVersion: APP_VERSION,
        maintenanceMode: false
    }
};

let userPlan = {
    isPaid: false,
    planType: "free"
};


// ============================================================
// WAIT FOR FIREBASE
// ============================================================

function waitForFirebase() {

    return new Promise((resolve, reject) => {

        let attempts = 0;

        const check = () => {

            if (getApps().length > 0) {

                try {

                    app = getApp();

                    auth = getAuth(app);

                    db = getFirestore(app);

                    resolve();

                    return;

                } catch (error) {

                    reject(error);

                    return;

                }

            }

            attempts++;

            if (attempts >= 200) {

                reject(
                    new Error(
                        "Firebase app was not initialized."
                    )
                );

                return;

            }

            setTimeout(check, 50);

        };

        check();

    });

}


// ============================================================
// STYLES
// ============================================================

function addStyles() {

    if (
        document.getElementById(
            "aiContentDashboardStyles"
        )
    ) {
        return;
    }

    const style =
        document.createElement("style");

    style.id =
        "aiContentDashboardStyles";

    style.textContent = `

        .profile {
            cursor: pointer !important;
            user-select: none;
        }

        #acaDashboardOverlay {
            position: fixed;
            inset: 0;
            z-index: 99999;
            display: none;
            align-items: center;
            justify-content: center;
            padding: 15px;
            box-sizing: border-box;
            background: rgba(0, 0, 0, 0.55);
        }

        #acaDashboardPanel {
            width: min(1000px, 100%);
            max-height: 90vh;
            background: #ffffff;
            border-radius: 18px;
            overflow: hidden;
            display: flex;
            box-shadow: 0 25px 70px rgba(0,0,0,.30);
        }

        #acaDashboardSidebar {
            width: 210px;
            flex-shrink: 0;
            background: #f7f8ff;
            border-right: 1px solid #e5e6ef;
            padding: 18px;
            box-sizing: border-box;
            overflow-y: auto;
        }

        #acaDashboardSidebar h3 {
            margin: 0 0 16px;
            font-size: 18px;
            color: #181927;
        }

        .acaDashboardNav {
            width: 100%;
            display: block;
            border: none;
            background: transparent;
            color: #5f6170;
            text-align: left;
            padding: 10px 11px;
            border-radius: 9px;
            margin-bottom: 5px;
            cursor: pointer;
            font-size: 13px;
        }

        .acaDashboardNav:hover {
            background: #e9eaff;
            color: #5556df;
        }

        .acaDashboardNav.active {
            background: #e2e3ff;
            color: #5556df;
            font-weight: 600;
        }

        #acaDashboardContent {
            position: relative;
            flex: 1;
            min-width: 0;
            overflow-y: auto;
            padding: 25px;
            box-sizing: border-box;
        }

        #acaDashboardClose {
            position: absolute;
            top: 14px;
            right: 14px;
            width: 34px;
            height: 34px;
            border: none;
            border-radius: 50%;
            background: #f0f1f6;
            color: #555766;
            cursor: pointer;
            font-size: 17px;
            z-index: 2;
        }

        .acaDashboardSection {
            display: none;
            padding-top: 5px;
            padding-right: 35px;
        }

        .acaDashboardSection.active {
            display: block;
        }

        .acaDashboardSection h2 {
            margin: 0 0 18px;
            color: #181927;
            font-size: 22px;
        }

        .acaDashboardSection p {
            color: #666875;
            font-size: 14px;
            line-height: 1.6;
        }

        .acaDashboardCard {
            background: #fafaff;
            border: 1px solid #e5e6ef;
            border-radius: 14px;
            padding: 18px;
            margin-bottom: 15px;
        }

        #acaProfileAvatar {
            width: 64px;
            height: 64px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, #4f6cff, #716cff);
            color: white;
            font-size: 25px;
            font-weight: 700;
            margin-bottom: 16px;
        }

        .acaDashboardLabel {
            display: block;
            margin: 13px 0 6px;
            color: #343545;
            font-size: 13px;
            font-weight: 600;
        }

        .acaDashboardInput {
            width: 100%;
            box-sizing: border-box;
            padding: 11px 12px;
            border: 1px solid #dfe0e8;
            border-radius: 10px;
            background: white;
            color: #181927;
            font-family: inherit;
            font-size: 13px;
            outline: none;
        }

        .acaDashboardInput:focus {
            border-color: #5964ed;
        }

        .acaDashboardButton {
            border: none;
            border-radius: 10px;
            padding: 11px 16px;
            margin-top: 15px;
            background: #5964ed;
            color: white;
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
        }

        .acaDashboardButton:hover {
            opacity: .92;
        }

        .acaDashboardButton.secondary {
            background: #70717f;
        }

        .acaDashboardButton.danger {
            background: #d93025;
        }

        .acaDashboardButton.success {
            background: #188038;
        }

        .acaSettingRow {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 15px;
            padding: 15px 0;
            border-bottom: 1px solid #e6e7ee;
        }

        .acaSettingRow:last-child {
            border-bottom: none;
        }

        .acaSettingTitle {
            color: #292a39;
            font-size: 14px;
            font-weight: 600;
        }

        .acaSettingDescription {
            margin-top: 4px;
            color: #777987;
            font-size: 12px;
        }

        .acaDangerBox {
            background: #fff5f5;
            border: 1px solid #ffd4d1;
            border-radius: 12px;
            padding: 16px;
        }

        /* Announcement Banner */
        #acaCustomerAnnouncement {
            display: none;
            background: #eef2ff;
            border: 1px solid #c7d2fe;
            border-radius: 12px;
            padding: 14px 18px;
            margin-bottom: 18px;
            color: #3730a3;
        }

        #acaCustomerAnnouncement strong {
            display: block;
            font-size: 15px;
            margin-bottom: 4px;
            color: #1e1b4b;
        }

        #acaCustomerAnnouncement p {
            margin: 0;
            font-size: 13px;
            color: #3730a3;
            line-height: 1.5;
        }

        /* Maintenance Banner */
        #acaMaintenanceBanner {
            display: none;
            background: #fffbeb;
            border: 1px solid #fde68a;
            border-radius: 12px;
            padding: 14px 18px;
            margin-bottom: 18px;
            color: #92400e;
            font-size: 13px;
            font-weight: 600;
            line-height: 1.5;
        }

        /* Customer Plan Badge */
        .acaPlanBadge {
            display: inline-block;
            padding: 4px 10px;
            border-radius: 999px;
            font-size: 12px;
            font-weight: 700;
            text-transform: uppercase;
        }

        .acaPlanBadge.free {
            background: #e2e8f0;
            color: #475569;
        }

        .acaPlanBadge.paid {
            background: #dcfce7;
            color: #15803d;
        }

        @media (max-width: 700px) {
            #acaDashboardOverlay {
                padding: 10px;
            }

            #acaDashboardPanel {
                width: 100%;
                max-height: 94vh;
                flex-direction: column;
                border-radius: 15px;
            }

            #acaDashboardSidebar {
                width: 100%;
                display: flex;
                gap: 5px;
                overflow-x: auto;
                padding: 9px;
                border-right: none;
                border-bottom: 1px solid #e5e6ef;
            }

            #acaDashboardSidebar h3 {
                display: none;
            }

            .acaDashboardNav {
                width: auto;
                min-width: max-content;
                white-space: nowrap;
                margin: 0;
            }

            #acaDashboardContent {
                padding: 20px;
            }

            .acaDashboardSection {
                padding-right: 5px;
            }
        }
    `;

    document.head.appendChild(style);
}


// ============================================================
// CREATE DASHBOARD
// ============================================================

function createDashboard() {

    if (dashboardCreated) {
        return;
    }

    if (!document.body) {
        return;
    }

    dashboardCreated = true;

    addStyles();

    const overlay =
        document.createElement("div");

    overlay.id =
        "acaDashboardOverlay";

    overlay.innerHTML = `

        <div id="acaDashboardPanel">

            <aside id="acaDashboardSidebar">

                <h3>
                    My Account
                </h3>

                <button
                    type="button"
                    class="acaDashboardNav active"
                    data-section="profile"
                >
                    👤 Profile
                </button>

                <button
                    type="button"
                    class="acaDashboardNav"
                    data-section="settings"
                >
                    ⚙️ Settings
                </button>

                <button
                    type="button"
                    class="acaDashboardNav"
                    data-section="privacy"
                >
                    🔒 Privacy
                </button>

                <button
                    type="button"
                    class="acaDashboardNav"
                    data-section="terms"
                >
                    📄 Terms
                </button>

                <button
                    type="button"
                    class="acaDashboardNav"
                    data-section="about"
                >
                    ℹ️ About
                </button>

                <button
                    type="button"
                    class="acaDashboardNav"
                    data-section="support"
                >
                    💬 Support
                </button>

                <button
                    type="button"
                    class="acaDashboardNav"
                    data-section="delete"
                >
                    🗑️ Delete Account
                </button>

            </aside>


            <main id="acaDashboardContent">

                <button
                    type="button"
                    id="acaDashboardClose"
                    aria-label="Close"
                >
                    ✕
                </button>

                <!-- System Notice Banners -->
                <div id="acaMaintenanceBanner">
                    ⚠️ Scheduled Maintenance: Some features of the application may be temporarily limited.
                </div>

                <div id="acaCustomerAnnouncement">
                    <strong id="acaCustomerAnnouncementTitle"></strong>
                    <p id="acaCustomerAnnouncementMessage"></p>
                </div>


                <!-- ==================================================
                     PROFILE
                     ================================================== -->

                <section
                    id="acaSectionProfile"
                    class="acaDashboardSection active"
                >

                    <h2>Profile</h2>

                    <div class="acaDashboardCard">

                        <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                            <div id="acaProfileAvatar">
                                AI
                            </div>
                            <span id="acaPlanBadgeContainer" class="acaPlanBadge free">
                                Free Plan
                            </span>
                        </div>

                        <label class="acaDashboardLabel">
                            Name
                        </label>

                        <input
                            id="acaProfileName"
                            class="acaDashboardInput"
                            type="text"
                            placeholder="Enter your name"
                        >

                        <label class="acaDashboardLabel">
                            Email
                        </label>

                        <input
                            id="acaProfileEmail"
                            class="acaDashboardInput"
                            type="email"
                            readonly
                        >

                        <label class="acaDashboardLabel">
                            User ID
                        </label>

                        <input
                            id="acaProfileUid"
                            class="acaDashboardInput"
                            type="text"
                            readonly
                        >

                        <label class="acaDashboardLabel">
                            Current Tier / Plan
                        </label>

                        <input
                            id="acaProfilePlan"
                            class="acaDashboardInput"
                            type="text"
                            value="Free Plan"
                            readonly
                        >

                        <button
                            type="button"
                            id="acaSaveProfile"
                            class="acaDashboardButton"
                        >
                            Save Profile
                        </button>

                    </div>

                </section>


                <!-- ==================================================
                     SETTINGS
                     ================================================== -->

                <section
                    id="acaSectionSettings"
                    class="acaDashboardSection"
                >

                    <h2>Settings</h2>

                    <div class="acaDashboardCard">

                        <div class="acaSettingRow">

                            <div>

                                <div class="acaSettingTitle">
                                    Notifications
                                </div>

                                <div class="acaSettingDescription">
                                    Enable app notifications
                                </div>

                            </div>

                            <input
                                type="checkbox"
                                id="acaNotifications"
                            >

                        </div>


                        <div class="acaSettingRow">

                            <div>

                                <div class="acaSettingTitle">
                                    Compact Mode
                                </div>

                                <div class="acaSettingDescription">
                                    Use a compact interface
                                </div>

                            </div>

                            <input
                                type="checkbox"
                                id="acaCompactMode"
                            >

                        </div>


                        <div class="acaSettingRow">

                            <div>

                                <div class="acaSettingTitle">
                                    Language
                                </div>

                                <div class="acaSettingDescription">
                                    Select your preferred language
                                </div>

                            </div>

                            <select
                                id="acaLanguage"
                                class="acaDashboardInput"
                                style="width:auto;"
                            >

                                <option value="English">
                                    English
                                </option>

                                <option value="Hindi">
                                    Hindi
                                </option>

                                <option value="Hinglish">
                                    Hinglish
                                </option>

                            </select>

                        </div>


                        <div class="acaSettingRow">

                            <div>

                                <div class="acaSettingTitle">
                                    Password
                                </div>

                                <div class="acaSettingDescription">
                                    Send password reset email
                                </div>

                            </div>

                            <button
                                type="button"
                                id="acaResetPassword"
                                class="acaDashboardButton secondary"
                            >
                                Reset
                            </button>

                        </div>


                        <div class="acaSettingRow">

                            <div>

                                <div class="acaSettingTitle">
                                    Account Usage Limits
                                </div>

                                <div class="acaSettingDescription" id="acaAccountLimitsDisplay">
                                    Content: - | Chat: - | Images: -
                                </div>

                            </div>

                        </div>


                        <div class="acaSettingRow">

                            <div>

                                <div class="acaSettingTitle">
                                    App Version
                                </div>

                                <div class="acaSettingDescription">
                                    Current version
                                </div>

                            </div>

                            <strong id="acaSettingsAppVersion">
                                ${APP_VERSION}
                            </strong>

                        </div>

                    </div>

                </section>


                <!-- ==================================================
                     PRIVACY
                     ================================================== -->

                <section
                    id="acaSectionPrivacy"
                    class="acaDashboardSection"
                >

                    <h2>Privacy Policy</h2>

                    <div class="acaDashboardCard">

                        <p>
                            AI Content Agent respects your privacy.
                            Your account information is used to provide
                            the features and services of the application.
                        </p>

                        <p>
                            Account information and generated content
                            may be stored securely using Firebase services.
                        </p>

                        <p>
                            We do not sell your personal information.
                        </p>

                        <p>
                            You can request deletion of your account
                            and associated application data.
                        </p>

                    </div>

                </section>


                <!-- ==================================================
                     TERMS
                     ================================================== -->

                <section
                    id="acaSectionTerms"
                    class="acaDashboardSection"
                >

                    <h2>Terms & Conditions</h2>

                    <div class="acaDashboardCard">

                        <p>
                            By using AI Content Agent, you agree to use
                            the application responsibly and legally.
                        </p>

                        <p>
                            AI-generated content should be reviewed before
                            publishing or commercial use.
                        </p>

                        <p>
                            Application features may be updated,
                            changed or improved over time.
                        </p>

                    </div>

                </section>


                <!-- ==================================================
                     ABOUT
                     ================================================== -->

                <section
                    id="acaSectionAbout"
                    class="acaDashboardSection"
                >

                    <h2>About</h2>

                    <div class="acaDashboardCard">

                        <p>
                            <strong>
                                AI Content Agent
                            </strong>
                        </p>

                        <p>
                            Create smarter content with AI.
                            Generate ideas, scripts, captions,
                            hooks and more.
                        </p>

                        <p>
                            Version:
                            <strong id="acaAboutAppVersion">
                                ${APP_VERSION}
                            </strong>
                        </p>

                    </div>

                </section>


                <!-- ==================================================
                     SUPPORT
                     ================================================== -->

                <section
                    id="acaSectionSupport"
                    class="acaDashboardSection"
                >

                    <h2>Support</h2>

                    <div class="acaDashboardCard">

                        <p>
                            Need help? Send us your question or issue.
                        </p>

                        <label class="acaDashboardLabel">
                            Subject
                        </label>

                        <input
                            id="acaSupportSubject"
                            class="acaDashboardInput"
                            type="text"
                            placeholder="Enter subject"
                        >

                        <label class="acaDashboardLabel">
                            Message
                        </label>

                        <textarea
                            id="acaSupportMessage"
                            class="acaDashboardInput"
                            style="min-height:120px;resize:vertical;"
                            placeholder="Describe your issue..."
                        ></textarea>

                        <button
                            type="button"
                            id="acaSendSupport"
                            class="acaDashboardButton"
                        >
                            Send Support Request
                        </button>

                    </div>

                </section>


                <!-- ==================================================
                     DELETE
                     ================================================== -->

                <section
                    id="acaSectionDelete"
                    class="acaDashboardSection"
                >

                    <h2>Delete Account</h2>

                    <div class="acaDangerBox">

                        <p>
                            This will permanently delete your account
                            and application data.
                        </p>

                        <p>
                            This action cannot be undone.
                        </p>

                        <button
                            type="button"
                            id="acaDeleteAccount"
                            class="acaDashboardButton danger"
                        >
                            Delete My Account
                        </button>

                    </div>

                </section>

            </main>

        </div>

    `;

    document.body.appendChild(overlay);

    applyPublicSettingsToUI();


    // ========================================================
    // EXISTING PROFILE
    // ========================================================

    const profile =
        document.querySelector(".profile");

    if (profile) {

        profile.style.cursor =
            "pointer";

        profile.title =
            "Open Profile & Settings";

        profile.setAttribute(
            "role",
            "button"
        );

        profile.setAttribute(
            "tabindex",
            "0"
        );

        profile.addEventListener(
            "click",
            openDashboard
        );

        profile.addEventListener(
            "keydown",
            event => {

                if (
                    event.key === "Enter" ||
                    event.key === " "
                ) {

                    event.preventDefault();

                    openDashboard();

                }

            }
        );

    }


    // ========================================================
    // CLOSE
    // ========================================================

    document
        .getElementById(
            "acaDashboardClose"
        )
        .addEventListener(
            "click",
            closeDashboard
        );


    overlay.addEventListener(
        "click",
        event => {

            if (
                event.target === overlay
            ) {

                closeDashboard();

            }

        }
    );


    // ========================================================
    // NAVIGATION
    // ========================================================

    document
        .querySelectorAll(
            ".acaDashboardNav"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const section =
                        button.dataset.section;

                    showSection(section);

                }
            );

        });


    // ========================================================
    // PROFILE
    // ========================================================

    document
        .getElementById(
            "acaSaveProfile"
        )
        .addEventListener(
            "click",
            saveProfile
        );


    // ========================================================
    // PASSWORD
    // ========================================================

    document
        .getElementById(
            "acaResetPassword"
        )
        .addEventListener(
            "click",
            resetPassword
        );


    // ========================================================
    // SUPPORT
    // ========================================================

    document
        .getElementById(
            "acaSendSupport"
        )
        .addEventListener(
            "click",
            sendSupport
        );


    // ========================================================
    // DELETE
    // ========================================================

    document
        .getElementById(
            "acaDeleteAccount"
        )
        .addEventListener(
            "click",
            deleteAccount
        );


    // ========================================================
    // SETTINGS
    // ========================================================

    document
        .getElementById(
            "acaNotifications"
        )
        .addEventListener(
            "change",
            event => {

                localStorage.setItem(
                    "aca_notifications",
                    event.target.checked
                );

            }
        );


    document
        .getElementById(
            "acaCompactMode"
        )
        .addEventListener(
            "change",
            event => {

                localStorage.setItem(
                    "aca_compact_mode",
                    event.target.checked
                );

            }
        );


    document
        .getElementById(
            "acaLanguage"
        )
        .addEventListener(
            "change",
            event => {

                localStorage.setItem(
                    "aca_language",
                    event.target.value
                );

            }
        );


    loadSettings();

}


// ============================================================
// READ ADMIN-CONTROLLED SETTINGS (READ-ONLY)
// ============================================================

async function fetchPublicSettings() {

    if (!db) {
        return;
    }

    try {

        // 1. Ads Settings
        const adsSnap = await getDoc(doc(db, "adminSettings", "ads"));
        if (adsSnap.exists()) {
            const data = adsSnap.data();
            activeAppSettings.ads = {
                enabled: data.enabled !== false,
                frequency: data.frequency || "medium",
                duration: data.duration || "10",
                placement: data.placement || "between-actions",
                network: data.network || "none"
            };
        }

        // 2. Announcements
        const announcementSnap = await getDoc(doc(db, "adminSettings", "announcement"));
        if (announcementSnap.exists()) {
            const data = announcementSnap.data();
            activeAppSettings.announcement = {
                enabled: data.enabled === true,
                title: data.title || "",
                message: data.message || ""
            };
        }

        // 3. Plans & Usage Limits
        const plansSnap = await getDoc(doc(db, "adminSettings", "plans"));
        if (plansSnap.exists()) {
            const data = plansSnap.data();
            activeAppSettings.plans = {
                freeContentLimit: data.freeContentLimit ?? 10,
                freeChatLimit: data.freeChatLimit ?? 10,
                freeImageLimit: data.freeImageLimit ?? 3,
                paidNoAds: data.paidNoAds === true
            };
        }

        // 4. App Settings & Version
        const appSnap = await getDoc(doc(db, "adminSettings", "app"));
        if (appSnap.exists()) {
            const data = appSnap.data();
            activeAppSettings.app = {
                appVersion: data.appVersion || APP_VERSION,
                maintenanceMode: data.maintenanceMode === true
            };
        }

        applyPublicSettingsToUI();

    } catch (error) {

        console.warn("Public settings sync error:", error);

    }

}

function applyPublicSettingsToUI() {

    // 1. Announcement Banner Update
    const banner = document.getElementById("acaCustomerAnnouncement");
    const titleEl = document.getElementById("acaCustomerAnnouncementTitle");
    const msgEl = document.getElementById("acaCustomerAnnouncementMessage");

    if (banner && titleEl && msgEl) {
        if (activeAppSettings.announcement.enabled && activeAppSettings.announcement.message) {
            titleEl.textContent = activeAppSettings.announcement.title || "Announcement";
            msgEl.textContent = activeAppSettings.announcement.message;
            banner.style.display = "block";
        } else {
            banner.style.display = "none";
        }
    }

    // 2. Maintenance Mode Banner Update
    const maintBanner = document.getElementById("acaMaintenanceBanner");
    if (maintBanner) {
        maintBanner.style.display = activeAppSettings.app.maintenanceMode ? "block" : "none";
    }

    // 3. Version Numbers Sync
    const currentVersion = activeAppSettings.app.appVersion || APP_VERSION;
    const aboutVer = document.getElementById("acaAboutAppVersion");
    const settingsVer = document.getElementById("acaSettingsAppVersion");

    if (aboutVer) aboutVer.textContent = currentVersion;
    if (settingsVer) settingsVer.textContent = currentVersion;

    // 4. Usage Limits Display
    const limitsDisplay = document.getElementById("acaAccountLimitsDisplay");
    if (limitsDisplay) {
        if (userPlan.isPaid) {
            limitsDisplay.textContent = "Unlimited Content & Chat (Paid Plan)";
        } else {
            limitsDisplay.textContent = `Content: ${activeAppSettings.plans.freeContentLimit} | Chat: ${activeAppSettings.plans.freeChatLimit} | Images: ${activeAppSettings.plans.freeImageLimit}`;
        }
    }

    // 5. Plan Badges Display
    const badge = document.getElementById("acaPlanBadgeContainer");
    const planInput = document.getElementById("acaProfilePlan");
    if (badge) {
        badge.className = `acaPlanBadge ${userPlan.isPaid ? "paid" : "free"}`;
        badge.textContent = userPlan.isPaid ? "Paid Plan" : "Free Plan";
    }
    if (planInput) {
        planInput.value = userPlan.isPaid ? "Paid Plan" : "Free Plan";
    }

}


// ============================================================
// CUSTOMER-FACING AD & LIMIT RESOLUTION
// ============================================================

function shouldShowAd() {

    // Global toggle from adminSettings/ads
    if (!activeAppSettings.ads.enabled) {
        return false;
    }

    // Paid users ad-free privilege from adminSettings/plans
    if (userPlan.isPaid && activeAppSettings.plans.paidNoAds) {
        return false;
    }

    return true;

}

function getAdConfig() {

    return {
        enabled: shouldShowAd(),
        duration: Number(activeAppSettings.ads.duration) || 10, // ~10 seconds
        placement: activeAppSettings.ads.placement,
        frequency: activeAppSettings.ads.frequency,
        network: activeAppSettings.ads.network
    };

}

function getActiveLimits() {

    return {
        isPaid: userPlan.isPaid,
        contentLimit: userPlan.isPaid ? Infinity : activeAppSettings.plans.freeContentLimit,
        chatLimit: userPlan.isPaid ? Infinity : activeAppSettings.plans.freeChatLimit,
        imageLimit: userPlan.isPaid ? Infinity : activeAppSettings.plans.freeImageLimit
    };

}


// ============================================================
// OPEN DASHBOARD
// ============================================================

async function openDashboard() {

    if (!currentUser) {

        console.warn(
            "No logged-in user."
        );

        return;

    }

    const overlay =
        document.getElementById(
            "acaDashboardOverlay"
        );

    if (!overlay) {
        return;
    }

    overlay.style.display =
        "flex";

    showSection("profile");

    await fetchPublicSettings();

    await loadProfile();

}


// ============================================================
// CLOSE
// ============================================================

function closeDashboard() {

    const overlay =
        document.getElementById(
            "acaDashboardOverlay"
        );

    if (overlay) {

        overlay.style.display =
            "none";

    }

}


// ============================================================
// NAVIGATION
// ============================================================

function showSection(section) {

    document
        .querySelectorAll(
            ".acaDashboardSection"
        )
        .forEach(item => {

            item.classList.remove(
                "active"
            );

        });


    document
        .querySelectorAll(
            ".acaDashboardNav"
        )
        .forEach(item => {

            item.classList.remove(
                "active"
            );

        });


    const sectionMap = {

        profile:
            "acaSectionProfile",

        settings:
            "acaSectionSettings",

        privacy:
            "acaSectionPrivacy",

        terms:
            "acaSectionTerms",

        about:
            "acaSectionAbout",

        support:
            "acaSectionSupport",

        delete:
            "acaSectionDelete"

    };


    const target =
        document.getElementById(
            sectionMap[section]
        );


    if (target) {

        target.classList.add(
            "active"
        );

    }


    const nav =
        document.querySelector(
            `.acaDashboardNav[data-section="${section}"]`
        );


    if (nav) {

        nav.classList.add(
            "active"
        );

    }

}


// ============================================================
// LOAD PROFILE & CUSTOMER PLAN
// ============================================================

async function loadProfile() {

    if (
        !currentUser ||
        !db
    ) {
        return;
    }


    const nameInput =
        document.getElementById(
            "acaProfileName"
        );

    const emailInput =
        document.getElementById(
            "acaProfileEmail"
        );

    const uidInput =
        document.getElementById(
            "acaProfileUid"
        );

    const avatar =
        document.getElementById(
            "acaProfileAvatar"
        );


    if (
        !nameInput ||
        !emailInput ||
        !uidInput ||
        !avatar
    ) {
        return;
    }


    let name =
        currentUser.displayName || "";


    try {

        // Read user data and plan status from users/{uid}
        const userRef =
            doc(
                db,
                "users",
                currentUser.uid
            );


        const snapshot =
            await getDoc(
                userRef
            );


        if (
            snapshot.exists()
        ) {

            const data =
                snapshot.data();


            if (
                data &&
                data.name
            ) {

                name =
                    data.name;

            }

            // Sync user tier
            userPlan.isPaid = Boolean(data?.isPaid === true || data?.plan === "paid");
            userPlan.planType = userPlan.isPaid ? "paid" : "free";

        }

    } catch (error) {

        console.warn(
            "Profile read error:",
            error
        );

    }


    nameInput.value =
        name;

    emailInput.value =
        currentUser.email || "";

    uidInput.value =
        currentUser.uid;


    avatar.textContent =
        (
            name ||
            currentUser.email ||
            "AI"
        )
        .charAt(0)
        .toUpperCase();

    applyPublicSettingsToUI();

}


// ============================================================
// SAVE PROFILE
// ============================================================

async function saveProfile() {

    if (
        !currentUser ||
        !db
    ) {
        return;
    }


    const input =
        document.getElementById(
            "acaProfileName"
        );


    if (!input) {
        return;
    }


    const name =
        input.value.trim();


    if (!name) {

        alert(
            "Please enter your name."
        );

        return;

    }


    try {

        await updateProfile(
            currentUser,
            {
                displayName: name
            }
        );


        await setDoc(
            doc(
                db,
                "users",
                currentUser.uid
            ),
            {
                name: name,
                email:
                    currentUser.email || "",
                updatedAt:
                    new Date()
            },
            {
                merge: true
            }
        );


        await loadProfile();


        alert(
            "Profile updated successfully."
        );

    } catch (error) {

        console.error(
            "Profile update error:",
            error
        );


        alert(
            "Unable to update profile:\n" +
            error.message
        );

    }

}


// ============================================================
// SETTINGS
// ============================================================

function loadSettings() {

    const notifications =
        document.getElementById(
            "acaNotifications"
        );

    const compact =
        document.getElementById(
            "acaCompactMode"
        );

    const language =
        document.getElementById(
            "acaLanguage"
        );


    if (
        !notifications ||
        !compact ||
        !language
    ) {
        return;
    }


    notifications.checked =
        localStorage.getItem(
            "aca_notifications"
        ) === "true";


    compact.checked =
        localStorage.getItem(
            "aca_compact_mode"
        ) === "true";


    language.value =
        localStorage.getItem(
            "aca_language"
        ) ||
        "English";

}


// ============================================================
// PASSWORD RESET
// ============================================================

async function resetPassword() {

    if (
        !currentUser ||
        !currentUser.email ||
        !auth
    ) {

        alert(
            "No email address found."
        );

        return;

    }


    try {

        await sendPasswordResetEmail(
            auth,
            currentUser.email
        );


        alert(
            "Password reset email sent to:\n" +
            currentUser.email
        );

    } catch (error) {

        console.error(
            "Password reset error:",
            error
        );


        alert(
            "Unable to send password reset email:\n" +
            error.message
        );

    }

}


// ============================================================
// SUPPORT
// ============================================================

function sendSupport() {

    if (!currentUser) {
        return;
    }


    const subject =
        document
            .getElementById(
                "acaSupportSubject"
            )
            .value
            .trim();


    const message =
        document
            .getElementById(
                "acaSupportMessage"
            )
            .value
            .trim();


    if (!message) {

        alert(
            "Please enter your message."
        );

        return;

    }


    const finalSubject =
        subject ||
        "AI Content Agent Support";


    const body =
        "AI Content Agent Support Request\n\n" +
        "Email: " +
        (currentUser.email || "") +
        "\n\n" +
        "User ID: " +
        currentUser.uid +
        "\n\n" +
        "Message:\n" +
        message;


    const mailto =
        "mailto:apnagrowthhub@gmail.com" +
        "?subject=" +
        encodeURIComponent(
            finalSubject
        ) +
        "&body=" +
        encodeURIComponent(
            body
        );


    window.location.href =
        mailto;

}


// ============================================================
// DELETE SUBCOLLECTION
// ============================================================

async function deleteSubcollection(
    collectionName
) {

    if (
        !currentUser ||
        !db
    ) {
        return;
    }


    const ref =
        collection(
            db,
            "users",
            currentUser.uid,
            collectionName
        );


    const snapshot =
        await getDocs(ref);


    if (snapshot.empty) {
        return;
    }


    let batch =
        writeBatch(db);

    let count = 0;


    for (
        const item of snapshot.docs
    ) {

        batch.delete(
            item.ref
        );

        count++;


        if (count >= 450) {

            await batch.commit();

            batch =
                writeBatch(db);

            count = 0;

        }

    }


    if (count > 0) {

        await batch.commit();

    }

}


// ============================================================
// DELETE ACCOUNT
// ============================================================

async function deleteAccount() {

    if (
        !currentUser ||
        !db ||
        !auth
    ) {
        return;
    }


    const confirmation =
        prompt(
            "To permanently delete your account, type DELETE"
        );


    if (
        confirmation !== "DELETE"
    ) {

        alert(
            "Account deletion cancelled."
        );

        return;

    }


    const user =
        currentUser;


    try {

        await deleteSubcollection(
            "contentHistory"
        );


        await deleteSubcollection(
            "chatHistory"
        );


        await deleteDoc(
            doc(
                db,
                "users",
                user.uid
            )
        );


        await deleteUser(
            user
        );


        alert(
            "Your account has been deleted successfully."
        );


        window.location.reload();

    } catch (error) {

        console.error(
            "Delete account error:",
            error
        );


        if (
            error.code ===
            "auth/requires-recent-login"
        ) {

            alert(
                "For security, please log in again and then try deleting your account."
            );

            return;

        }


        alert(
            "Unable to delete account:\n" +
            error.message
        );

    }

}


// ============================================================
// START
// ============================================================

async function startDashboard() {

    try {

        await waitForFirebase();


        if (
            document.readyState ===
            "loading"
        ) {

            document.addEventListener(
                "DOMContentLoaded",
                createDashboard,
                {
                    once: true
                }
            );

        } else {

            createDashboard();

        }


        onAuthStateChanged(
            auth,
            async user => {

                currentUser =
                    user || null;


                if (
                    currentUser
                ) {

                    console.log(
                        "Dashboard user:",
                        currentUser.email
                    );


                    // Sequence: fetch remote settings first, then sync profile & UI
                    await fetchPublicSettings();

                    if (
                        dashboardCreated
                    ) {

                        await loadProfile();

                        loadSettings();

                    }

                } else {

                    closeDashboard();

                }

            }
        );


        console.log(
            "AI Content Agent Dashboard loaded successfully."
        );

    } catch (error) {

        console.error(
            "Dashboard startup error:",
            error
        );

    }

}


startDashboard();