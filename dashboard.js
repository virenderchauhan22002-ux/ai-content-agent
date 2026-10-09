// ============================================================
// AI CONTENT AGENT
// DASHBOARD / PROFILE / SETTINGS / ADMIN PANEL
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
// APP VERSION
// ============================================================

const APP_VERSION = "1.0.0";

let app = null;
let auth = null;
let db = null;

let currentUser = null;
let dashboardCreated = false;
let isAdmin = false;


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

            background:
                rgba(0, 0, 0, 0.55);
        }

        #acaDashboardPanel {

            width: min(1000px, 100%);

            max-height: 90vh;

            background: #ffffff;

            border-radius: 18px;

            overflow: hidden;

            display: flex;

            box-shadow:
                0 25px 70px rgba(0,0,0,.30);
        }

        #acaDashboardSidebar {

            width: 210px;

            flex-shrink: 0;

            background: #f7f8ff;

            border-right:
                1px solid #e5e6ef;

            padding: 18px;

            box-sizing: border-box;
        }

        #acaDashboardSidebar h3 {

            margin:
                0 0 16px;

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

        .acaAdminNav {

            margin-top: 12px;

            background:
                linear-gradient(
                    135deg,
                    #eef0ff,
                    #f4edff
                );

            color: #5546c7;
            font-weight: 700;
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

            margin:
                0 0 18px;

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

            border:
                1px solid #e5e6ef;

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

            background:
                linear-gradient(
                    135deg,
                    #4f6cff,
                    #716cff
                );

            color: white;

            font-size: 25px;
            font-weight: 700;

            margin-bottom: 16px;
        }

        .acaDashboardLabel {

            display: block;

            margin:
                13px 0 6px;

            color: #343545;

            font-size: 13px;
            font-weight: 600;
        }

        .acaDashboardInput {

            width: 100%;

            box-sizing: border-box;

            padding: 11px 12px;

            border:
                1px solid #dfe0e8;

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

            border-bottom:
                1px solid #e6e7ee;
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

            border:
                1px solid #ffd4d1;

            border-radius: 12px;

            padding: 16px;
        }


        /* ====================================================
           ADMIN
        ==================================================== */

        .acaAdminHeader {

            display: flex;

            justify-content: space-between;
            align-items: center;

            gap: 15px;

            margin-bottom: 18px;
        }

        .acaAdminBadge {

            display: inline-block;

            padding: 6px 10px;

            border-radius: 999px;

            background: #eeeaff;

            color: #5546c7;

            font-size: 11px;
            font-weight: 700;
        }

        .acaAdminGrid {

            display: grid;

            grid-template-columns:
                repeat(4, minmax(0, 1fr));

            gap: 12px;

            margin-bottom: 18px;
        }

        .acaAdminStat {

            background: #ffffff;

            border:
                1px solid #e4e5ee;

            border-radius: 14px;

            padding: 15px;
        }

        .acaAdminStatLabel {

            font-size: 12px;

            color: #777987;

            margin-bottom: 8px;
        }

        .acaAdminStatValue {

            font-size: 24px;

            font-weight: 700;

            color: #191a28;
        }

        .acaAdminTableWrap {

            overflow-x: auto;

            border:
                1px solid #e5e6ef;

            border-radius: 12px;

            background: white;
        }

        .acaAdminTable {

            width: 100%;

            border-collapse: collapse;

            min-width: 600px;
        }

        .acaAdminTable th {

            background: #f7f8ff;

            color: #555766;

            font-size: 12px;

            text-align: left;

            padding: 11px;
        }

        .acaAdminTable td {

            color: #343545;

            font-size: 12px;

            padding: 11px;

            border-top:
                1px solid #eeeeF3;
        }

        .acaAdminStatus {

            display: inline-block;

            padding: 5px 8px;

            border-radius: 999px;

            font-size: 11px;

            font-weight: 700;
        }

        .acaAdminStatus.on {

            background: #e7f6ec;
            color: #188038;
        }

        .acaAdminStatus.off {

            background: #fce8e6;
            color: #c5221f;
        }

        .acaAdminSmallButton {

            border: none;

            border-radius: 8px;

            padding: 7px 10px;

            background: #5964ed;

            color: white;

            cursor: pointer;

            font-size: 11px;

            font-weight: 600;
        }

        .acaAdminCheckbox {

            width: 18px;
            height: 18px;

            cursor: pointer;
        }

        .acaAdminTwoColumn {

            display: grid;

            grid-template-columns:
                repeat(2, minmax(0, 1fr));

            gap: 15px;
        }

        .acaAdminSectionTitle {

            font-size: 15px;

            color: #202130;

            font-weight: 700;

            margin-bottom: 12px;
        }

        .acaAdminInfo {

            font-size: 12px;

            color: #737582;

            line-height: 1.6;
        }

        .acaAdminMessage {

            padding: 10px 12px;

            border-radius: 10px;

            background: #f0f1ff;

            color: #4546a0;

            font-size: 12px;

            margin-bottom: 12px;
        }

        @media (max-width: 800px) {

            .acaAdminGrid {
                grid-template-columns:
                    repeat(2, minmax(0, 1fr));
            }

            .acaAdminTwoColumn {
                grid-template-columns: 1fr;
            }

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

                border-bottom:
                    1px solid #e5e6ef;
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

            .acaAdminNav {
                margin-top: 0;
            }

            #acaDashboardContent {
                padding: 20px;
            }

            .acaDashboardSection {
                padding-right: 5px;
            }

            .acaAdminGrid {
                grid-template-columns: 1fr 1fr;
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

                <button
                    type="button"
                    id="acaAdminNav"
                    class="acaDashboardNav acaAdminNav"
                    data-section="admin"
                    style="display:none;"
                >
                    👑 Admin Panel
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


                <!-- ==================================================
                     PROFILE
                     ================================================== -->

                <section
                    id="acaSectionProfile"
                    class="acaDashboardSection active"
                >

                    <h2>Profile</h2>

                    <div class="acaDashboardCard">

                        <div id="acaProfileAvatar">
                            AI
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
                                    App Version
                                </div>

                                <div class="acaSettingDescription">
                                    Current version
                                </div>

                            </div>

                            <strong>
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
                            <strong>
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


                <!-- ==================================================
                     ADMIN PANEL
                     ================================================== -->

                <section
                    id="acaSectionAdmin"
                    class="acaDashboardSection"
                >

                    <div class="acaAdminHeader">

                        <div>

                            <h2 style="margin-bottom:6px;">
                                Admin Panel
                            </h2>

                            <span class="acaAdminBadge">
                                ADMIN ACCESS
                            </span>

                        </div>

                        <button
                            type="button"
                            id="acaAdminRefresh"
                            class="acaAdminSmallButton"
                        >
                            Refresh
                        </button>

                    </div>


                    <!-- ADMIN OVERVIEW -->

                    <div class="acaDashboardCard">

                        <div class="acaAdminSectionTitle">
                            📊 Overview
                        </div>

                        <div
                            id="acaAdminOverviewMessage"
                            class="acaAdminMessage"
                        >
                            Loading dashboard statistics...
                        </div>

                        <div class="acaAdminGrid">

                            <div class="acaAdminStat">

                                <div class="acaAdminStatLabel">
                                    Total Users
                                </div>

                                <div
                                    id="acaAdminTotalUsers"
                                    class="acaAdminStatValue"
                                >
                                    -
                                </div>

                            </div>


                            <div class="acaAdminStat">

                                <div class="acaAdminStatLabel">
                                    Content History
                                </div>

                                <div
                                    id="acaAdminTotalContent"
                                    class="acaAdminStatValue"
                                >
                                    -
                                </div>

                            </div>


                            <div class="acaAdminStat">

                                <div class="acaAdminStatLabel">
                                    AI Chats
                                </div>

                                <div
                                    id="acaAdminTotalChats"
                                    class="acaAdminStatValue"
                                >
                                    -
                                </div>

                            </div>


                            <div class="acaAdminStat">

                                <div class="acaAdminStatLabel">
                                    Image Usage
                                </div>

                                <div
                                    id="acaAdminTotalImages"
                                    class="acaAdminStatValue"
                                >
                                    -
                                </div>

                            </div>

                        </div>

                    </div>


                    <!-- USERS -->

                    <div class="acaDashboardCard">

                        <div class="acaAdminSectionTitle">
                            👥 Users Management
                        </div>

                        <div
                            id="acaAdminUsersMessage"
                            class="acaAdminInfo"
                            style="margin-bottom:12px;"
                        >
                            Loading users...
                        </div>

                        <div class="acaAdminTableWrap">

                            <table class="acaAdminTable">

                                <thead>

                                    <tr>

                                        <th>
                                            Name
                                        </th>

                                        <th>
                                            Email
                                        </th>

                                        <th>
                                            UID
                                        </th>

                                        <th>
                                            Role
                                        </th>

                                    </tr>

                                </thead>

                                <tbody
                                    id="acaAdminUsersTable"
                                >

                                </tbody>

                            </table>

                        </div>

                    </div>


                    <!-- CONTENT ACTIVITY -->

                    <div class="acaDashboardCard">

                        <div class="acaAdminSectionTitle">
                            📝 Content Activity
                        </div>

                        <div class="acaAdminTwoColumn">

                            <div>

                                <div class="acaAdminInfo">
                                    Total generated content records
                                </div>

                                <strong
                                    id="acaAdminContentCount"
                                >
                                    -
                                </strong>

                            </div>

                            <div>

                                <div class="acaAdminInfo">
                                    Users with content history
                                </div>

                                <strong
                                    id="acaAdminContentUsers"
                                >
                                    -
                                </strong>

                            </div>

                        </div>

                    </div>


                    <!-- CHAT ACTIVITY -->

                    <div class="acaDashboardCard">

                        <div class="acaAdminSectionTitle">
                            💬 AI Chat Activity
                        </div>

                        <div class="acaAdminTwoColumn">

                            <div>

                                <div class="acaAdminInfo">
                                    Total chat records
                                </div>

                                <strong
                                    id="acaAdminChatCount"
                                >
                                    -
                                </strong>

                            </div>

                            <div>

                                <div class="acaAdminInfo">
                                    Users using AI Chat
                                </div>

                                <strong
                                    id="acaAdminChatUsers"
                                >
                                    -
                                </strong>

                            </div>

                        </div>

                    </div>


                    <!-- IMAGE USAGE -->

                    <div class="acaDashboardCard">

                        <div class="acaAdminSectionTitle">
                            🖼️ Image Usage
                        </div>

                        <div class="acaAdminTwoColumn">

                            <div>

                                <div class="acaAdminInfo">
                                    Image generation activity
                                </div>

                                <strong
                                    id="acaAdminImageUsage"
                                >
                                    -
                                </strong>

                            </div>

                            <div>

                                <div class="acaAdminInfo">
                                    Current image feature status
                                </div>

                                <strong>
                                    Available
                                </strong>

                            </div>

                        </div>

                    </div>


                    <!-- ADS -->

                    <div class="acaDashboardCard">

                        <div class="acaAdminSectionTitle">
                            📢 Ads Management
                        </div>

                        <div class="acaAdminInfo">
                            Ads are managed here. Ads are NOT displayed
                            inside the admin panel.
                        </div>


                        <div class="acaSettingRow">

                            <div>

                                <div class="acaSettingTitle">
                                    Ads Enabled
                                </div>

                                <div class="acaSettingDescription">
                                    Show ads to eligible free users
                                </div>

                            </div>

                            <input
                                type="checkbox"
                                id="acaAdsEnabled"
                                class="acaAdminCheckbox"
                            >

                        </div>


                        <label class="acaDashboardLabel">
                            Ad Frequency
                        </label>

                        <select
                            id="acaAdFrequency"
                            class="acaDashboardInput"
                        >

                            <option value="low">
                                Low
                            </option>

                            <option value="medium">
                                Medium
                            </option>

                            <option value="high">
                                High
                            </option>

                        </select>


                        <label class="acaDashboardLabel">
                            Ad Duration
                        </label>

                        <select
                            id="acaAdDuration"
                            class="acaDashboardInput"
                        >

                            <option value="10">
                                10 seconds
                            </option>

                        </select>


                        <label class="acaDashboardLabel">
                            Placement
                        </label>

                        <select
                            id="acaAdPlacement"
                            class="acaDashboardInput"
                        >

                            <option value="between-actions">
                                Between Actions
                            </option>

                            <option value="before-result">
                                Before Result
                            </option>

                            <option value="after-result">
                                After Result
                            </option>

                        </select>


                        <label class="acaDashboardLabel">
                            Ad Network
                        </label>

                        <select
                            id="acaAdNetwork"
                            class="acaDashboardInput"
                        >

                            <option value="none">
                                Not Connected
                            </option>

                            <option value="future">
                                Future Ad Network
                            </option>

                        </select>


                        <button
                            type="button"
                            id="acaSaveAds"
                            class="acaDashboardButton"
                        >
                            Save Ad Settings
                        </button>

                    </div>


                    <!-- ANNOUNCEMENTS -->

                    <div class="acaDashboardCard">

                        <div class="acaAdminSectionTitle">
                            📣 Announcements
                        </div>

                        <div class="acaSettingRow">

                            <div>

                                <div class="acaSettingTitle">
                                    Announcement Enabled
                                </div>

                                <div class="acaSettingDescription">
                                    Show announcement to users
                                </div>

                            </div>

                            <input
                                type="checkbox"
                                id="acaAnnouncementEnabled"
                                class="acaAdminCheckbox"
                            >

                        </div>


                        <label class="acaDashboardLabel">
                            Title
                        </label>

                        <input
                            id="acaAnnouncementTitle"
                            class="acaDashboardInput"
                            type="text"
                            placeholder="Announcement title"
                        >


                        <label class="acaDashboardLabel">
                            Message
                        </label>

                        <textarea
                            id="acaAnnouncementMessage"
                            class="acaDashboardInput"
                            style="min-height:110px;resize:vertical;"
                            placeholder="Announcement message..."
                        ></textarea>


                        <button
                            type="button"
                            id="acaSaveAnnouncement"
                            class="acaDashboardButton"
                        >
                            Save Announcement
                        </button>

                    </div>


                    <!-- PLANS -->

                    <div class="acaDashboardCard">

                        <div class="acaAdminSectionTitle">
                            💰 Plans & Limits
                        </div>

                        <div class="acaAdminInfo">
                            Free plan controls for the current V1.
                            Paid plan structure is prepared for future use.
                        </div>


                        <label class="acaDashboardLabel">
                            Free Content Limit
                        </label>

                        <input
                            id="acaFreeContentLimit"
                            class="acaDashboardInput"
                            type="number"
                            min="0"
                        >


                        <label class="acaDashboardLabel">
                            Free AI Chat Limit
                        </label>

                        <input
                            id="acaFreeChatLimit"
                            class="acaDashboardInput"
                            type="number"
                            min="0"
                        >


                        <label class="acaDashboardLabel">
                            Free Image Limit
                        </label>

                        <input
                            id="acaFreeImageLimit"
                            class="acaDashboardInput"
                            type="number"
                            min="0"
                        >


                        <div class="acaSettingRow">

                            <div>

                                <div class="acaSettingTitle">
                                    Paid Plan No-Ads
                                </div>

                                <div class="acaSettingDescription">
                                    Future paid users can receive an ad-free experience
                                </div>

                            </div>

                            <input
                                type="checkbox"
                                id="acaPaidNoAds"
                                class="acaAdminCheckbox"
                            >

                        </div>


                        <button
                            type="button"
                            id="acaSavePlans"
                            class="acaDashboardButton"
                        >
                            Save Plan Settings
                        </button>

                    </div>


                    <!-- APP SETTINGS -->

                    <div class="acaDashboardCard">

                        <div class="acaAdminSectionTitle">
                            ⚙️ App Settings
                        </div>


                        <label class="acaDashboardLabel">
                            App Version
                        </label>

                        <input
                            class="acaDashboardInput"
                            type="text"
                            value="${APP_VERSION}"
                            readonly
                        >


                        <div class="acaSettingRow">

                            <div>

                                <div class="acaSettingTitle">
                                    Maintenance Mode
                                </div>

                                <div class="acaSettingDescription">
                                    Future option to temporarily restrict the app
                                </div>

                            </div>

                            <input
                                type="checkbox"
                                id="acaMaintenanceMode"
                                class="acaAdminCheckbox"
                            >

                        </div>


                        <button
                            type="button"
                            id="acaSaveAppSettings"
                            class="acaDashboardButton"
                        >
                            Save App Settings
                        </button>

                    </div>


                    <!-- SECURITY -->

                    <div class="acaDashboardCard">

                        <div class="acaAdminSectionTitle">
                            🔐 Admin Security
                        </div>

                        <div class="acaAdminInfo">

                            Admin access is controlled through the
                            <strong>admins</strong> collection.

                            <br><br>

                            Only an account whose UID exists in
                            <strong>admins/{uid}</strong> with
                            <strong>role = admin</strong> can access
                            this panel.

                        </div>

                        <div
                            style="
                                margin-top:12px;
                                font-size:12px;
                                color:#555766;
                            "
                        >
                            Current admin UID:
                        </div>

                        <div
                            style="
                                margin-top:5px;
                                word-break:break-all;
                                font-size:12px;
                                font-weight:600;
                            "
                            id="acaAdminCurrentUid"
                        >
                            -
                        </div>

                    </div>

                </section>

            </main>

        </div>

    `;

    document.body.appendChild(overlay);


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

                    if (
                        section === "admin" &&
                        !isAdmin
                    ) {

                        return;

                    }

                    showSection(section);

                    if (
                        section === "admin"
                    ) {

                        loadAdminPanel();

                    }

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


    // ========================================================
    // ADMIN BUTTONS
    // ========================================================

    document
        .getElementById(
            "acaAdminRefresh"
        )
        .addEventListener(
            "click",
            loadAdminPanel
        );


    document
        .getElementById(
            "acaSaveAds"
        )
        .addEventListener(
            "click",
            saveAdsSettings
        );


    document
        .getElementById(
            "acaSaveAnnouncement"
        )
        .addEventListener(
            "click",
            saveAnnouncement
        );


    document
        .getElementById(
            "acaSavePlans"
        )
        .addEventListener(
            "click",
            savePlanSettings
        );


    document
        .getElementById(
            "acaSaveAppSettings"
        )
        .addEventListener(
            "click",
            saveAppSettings
        );

}


// ============================================================
// OPEN DASHBOARD
// ============================================================

function openDashboard() {

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

    loadProfile();

    checkAdminAccess();

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
            "acaSectionDelete",

        admin:
            "acaSectionAdmin"

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
// LOAD PROFILE
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
// ADMIN SECURITY CHECK
// ============================================================

async function checkAdminAccess() {

    isAdmin = false;


    const adminNav =
        document.getElementById(
            "acaAdminNav"
        );


    if (adminNav) {

        adminNav.style.display =
            "none";

    }


    if (
        !currentUser ||
        !db
    ) {
        return false;
    }


    try {

        const adminRef =
            doc(
                db,
                "admins",
                currentUser.uid
            );


        const snapshot =
            await getDoc(
                adminRef
            );


        if (
            snapshot.exists()
        ) {

            const data =
                snapshot.data();


            if (
                data &&
                data.role === "admin"
            ) {

                isAdmin = true;


                if (adminNav) {

                    adminNav.style.display =
                        "block";

                }


                const uidElement =
                    document.getElementById(
                        "acaAdminCurrentUid"
                    );


                if (uidElement) {

                    uidElement.textContent =
                        currentUser.uid;

                }


                return true;

            }

        }

    } catch (error) {

        console.warn(
            "Admin access check failed:",
            error
        );

    }


    return false;

}


// ============================================================
// ADMIN PANEL
// ============================================================

async function loadAdminPanel() {

    if (!currentUser || !db) {
        return;
    }


    const allowed =
        await checkAdminAccess();


    if (!allowed) {

        alert(
            "Admin access denied."
        );

        showSection("profile");

        return;

    }


    const message =
        document.getElementById(
            "acaAdminOverviewMessage"
        );


    if (message) {

        message.textContent =
            "Loading admin data...";

    }


    try {

        const usersSnapshot =
            await getDocs(
                collection(
                    db,
                    "users"
                )
            );


        let totalUsers =
            usersSnapshot.size;

        let totalContent =
            0;

        let totalChats =
            0;

        let contentUsers =
            0;

        let chatUsers =
            0;

        const users = [];


        for (
            const userDoc of usersSnapshot.docs
        ) {

            const userData =
                userDoc.data() || {};


            const contentSnapshot =
                await getDocs(
                    collection(
                        db,
                        "users",
                        userDoc.id,
                        "contentHistory"
                    )
                );


            const chatSnapshot =
                await getDocs(
                    collection(
                        db,
                        "users",
                        userDoc.id,
                        "chatHistory"
                    )
                );


            if (
                contentSnapshot.size > 0
            ) {

                contentUsers++;

            }


            if (
                chatSnapshot.size > 0
            ) {

                chatUsers++;

            }


            totalContent +=
                contentSnapshot.size;

            totalChats +=
                chatSnapshot.size;


            let role =
                "user";


            try {

                const adminSnapshot =
                    await getDoc(
                        doc(
                            db,
                            "admins",
                            userDoc.id
                        )
                    );


                if (
                    adminSnapshot.exists() &&
                    adminSnapshot.data().role === "admin"
                ) {

                    role = "admin";

                }

            } catch (error) {

                // Ignore role read error.
            }


            users.push({

                uid:
                    userDoc.id,

                name:
                    userData.name ||
                    "—",

                email:
                    userData.email ||
                    "—",

                role:
                    role

            });

        }


        setText(
            "acaAdminTotalUsers",
            totalUsers
        );

        setText(
            "acaAdminTotalContent",
            totalContent
        );

        setText(
            "acaAdminTotalChats",
            totalChats
        );

        setText(
            "acaAdminTotalImages",
            "N/A"
        );


        setText(
            "acaAdminContentCount",
            totalContent
        );

        setText(
            "acaAdminContentUsers",
            contentUsers
        );

        setText(
            "acaAdminChatCount",
            totalChats
        );

        setText(
            "acaAdminChatUsers",
            chatUsers
        );

        setText(
            "acaAdminImageUsage",
            "Tracked after image analytics is enabled"
        );


        renderUsersTable(users);


        if (message) {

            message.textContent =
                "Admin dashboard loaded successfully.";

        }


        await loadAdminSettings();

    } catch (error) {

        console.error(
            "Admin panel error:",
            error
        );


        if (message) {

            message.textContent =
                "Unable to load admin data: " +
                error.message;

        }

    }

}


// ============================================================
// ADMIN USERS TABLE
// ============================================================

function renderUsersTable(users) {

    const table =
        document.getElementById(
            "acaAdminUsersTable"
        );


    if (!table) {
        return;
    }


    table.innerHTML = "";


    if (!users.length) {

        table.innerHTML =
            `
                <tr>
                    <td colspan="4">
                        No users found.
                    </td>
                </tr>
            `;

        return;

    }


    users.forEach(user => {

        const row =
            document.createElement("tr");


        row.innerHTML = `

            <td>
                ${escapeHtml(user.name)}
            </td>

            <td>
                ${escapeHtml(user.email)}
            </td>

            <td
                style="
                    max-width:180px;
                    word-break:break-all;
                "
            >
                ${escapeHtml(user.uid)}
            </td>

            <td>

                <span
                    class="acaAdminStatus ${
                        user.role === "admin"
                            ? "on"
                            : "off"
                    }"
                >
                    ${escapeHtml(user.role)}
                </span>

            </td>

        `;


        table.appendChild(row);

    });

}


// ============================================================
// LOAD ADMIN SETTINGS
// ============================================================

async function loadAdminSettings() {

    if (
        !isAdmin ||
        !db
    ) {
        return;
    }


    try {

        const adsSnapshot =
            await getDoc(
                doc(
                    db,
                    "adminSettings",
                    "ads"
                )
            );


        if (
            adsSnapshot.exists()
        ) {

            const data =
                adsSnapshot.data();


            setChecked(
                "acaAdsEnabled",
                data.enabled !== false
            );

            setValue(
                "acaAdFrequency",
                data.frequency || "medium"
            );

            setValue(
                "acaAdDuration",
                data.duration || "10"
            );

            setValue(
                "acaAdPlacement",
                data.placement || "between-actions"
            );

            setValue(
                "acaAdNetwork",
                data.network || "none"
            );

        } else {

            setChecked(
                "acaAdsEnabled",
                true
            );

            setValue(
                "acaAdFrequency",
                "medium"
            );

            setValue(
                "acaAdDuration",
                "10"
            );

            setValue(
                "acaAdPlacement",
                "between-actions"
            );

            setValue(
                "acaAdNetwork",
                "none"
            );

        }


        const announcementSnapshot =
            await getDoc(
                doc(
                    db,
                    "adminSettings",
                    "announcement"
                )
            );


        if (
            announcementSnapshot.exists()
        ) {

            const data =
                announcementSnapshot.data();


            setChecked(
                "acaAnnouncementEnabled",
                data.enabled === true
            );

            setValue(
                "acaAnnouncementTitle",
                data.title || ""
            );

            setValue(
                "acaAnnouncementMessage",
                data.message || ""
            );

        }


        const plansSnapshot =
            await getDoc(
                doc(
                    db,
                    "adminSettings",
                    "plans"
                )
            );


        if (
            plansSnapshot.exists()
        ) {

            const data =
                plansSnapshot.data();


            setValue(
                "acaFreeContentLimit",
                data.freeContentLimit ?? 10
            );

            setValue(
                "acaFreeChatLimit",
                data.freeChatLimit ?? 10
            );

            setValue(
                "acaFreeImageLimit",
                data.freeImageLimit ?? 3
            );

            setChecked(
                "acaPaidNoAds",
                data.paidNoAds === true
            );

        } else {

            setValue(
                "acaFreeContentLimit",
                10
            );

            setValue(
                "acaFreeChatLimit",
                10
            );

            setValue(
                "acaFreeImageLimit",
                3
            );

            setChecked(
                "acaPaidNoAds",
                true
            );

        }


        const appSnapshot =
            await getDoc(
                doc(
                    db,
                    "adminSettings",
                    "app"
                )
            );


        if (
            appSnapshot.exists()
        ) {

            const data =
                appSnapshot.data();


            setChecked(
                "acaMaintenanceMode",
                data.maintenanceMode === true
            );

        } else {

            setChecked(
                "acaMaintenanceMode",
                false
            );

        }

    } catch (error) {

        console.error(
            "Admin settings load error:",
            error
        );

    }

}


// ============================================================
// SAVE ADS
// ============================================================

async function saveAdsSettings() {

    if (!await verifyAdmin()) {
        return;
    }


    try {

        await setDoc(
            doc(
                db,
                "adminSettings",
                "ads"
            ),
            {
                enabled:
                    getChecked("acaAdsEnabled"),

                frequency:
                    getValue("acaAdFrequency"),

                duration:
                    getValue("acaAdDuration"),

                placement:
                    getValue("acaAdPlacement"),

                network:
                    getValue("acaAdNetwork"),

                updatedAt:
                    new Date(),

                updatedBy:
                    currentUser.uid
            },
            {
                merge: true
            }
        );


        alert(
            "Ad settings saved successfully."
        );

    } catch (error) {

        console.error(
            "Ads save error:",
            error
        );


        alert(
            "Unable to save ad settings:\n" +
            error.message
        );

    }

}


// ============================================================
// SAVE ANNOUNCEMENT
// ============================================================

async function saveAnnouncement() {

    if (!await verifyAdmin()) {
        return;
    }


    try {

        await setDoc(
            doc(
                db,
                "adminSettings",
                "announcement"
            ),
            {
                enabled:
                    getChecked(
                        "acaAnnouncementEnabled"
                    ),

                title:
                    getValue(
                        "acaAnnouncementTitle"
                    ).trim(),

                message:
                    getValue(
                        "acaAnnouncementMessage"
                    ).trim(),

                updatedAt:
                    new Date(),

                updatedBy:
                    currentUser.uid
            },
            {
                merge: true
            }
        );


        alert(
            "Announcement saved successfully."
        );

    } catch (error) {

        console.error(
            "Announcement save error:",
            error
        );


        alert(
            "Unable to save announcement:\n" +
            error.message
        );

    }

}


// ============================================================
// SAVE PLANS
// ============================================================

async function savePlanSettings() {

    if (!await verifyAdmin()) {
        return;
    }


    const contentLimit =
        Number(
            getValue(
                "acaFreeContentLimit"
            )
        );


    const chatLimit =
        Number(
            getValue(
                "acaFreeChatLimit"
            )
        );


    const imageLimit =
        Number(
            getValue(
                "acaFreeImageLimit"
            )
        );


    if (
        Number.isNaN(contentLimit) ||
        Number.isNaN(chatLimit) ||
        Number.isNaN(imageLimit)
    ) {

        alert(
            "Please enter valid plan limits."
        );

        return;

    }


    try {

        await setDoc(
            doc(
                db,
                "adminSettings",
                "plans"
            ),
            {
                freeContentLimit:
                    contentLimit,

                freeChatLimit:
                    chatLimit,

                freeImageLimit:
                    imageLimit,

                paidNoAds:
                    getChecked(
                        "acaPaidNoAds"
                    ),

                updatedAt:
                    new Date(),

                updatedBy:
                    currentUser.uid
            },
            {
                merge: true
            }
        );


        alert(
            "Plan settings saved successfully."
        );

    } catch (error) {

        console.error(
            "Plans save error:",
            error
        );


        alert(
            "Unable to save plan settings:\n" +
            error.message
        );

    }

}


// ============================================================
// SAVE APP SETTINGS
// ============================================================

async function saveAppSettings() {

    if (!await verifyAdmin()) {
        return;
    }


    try {

        await setDoc(
            doc(
                db,
                "adminSettings",
                "app"
            ),
            {
                appVersion:
                    APP_VERSION,

                maintenanceMode:
                    getChecked(
                        "acaMaintenanceMode"
                    ),

                updatedAt:
                    new Date(),

                updatedBy:
                    currentUser.uid
            },
            {
                merge: true
            }
        );


        alert(
            "App settings saved successfully."
        );

    } catch (error) {

        console.error(
            "App settings save error:",
            error
        );


        alert(
            "Unable to save app settings:\n" +
            error.message
        );

    }

}


// ============================================================
// VERIFY ADMIN
// ============================================================

async function verifyAdmin() {

    const allowed =
        await checkAdminAccess();


    if (!allowed) {

        alert(
            "Admin access denied."
        );

        return false;

    }


    return true;

}


// ============================================================
// HELPERS
// ============================================================

function setText(
    id,
    value
) {

    const element =
        document.getElementById(id);


    if (element) {

        element.textContent =
            String(value);

    }

}


function setValue(
    id,
    value
) {

    const element =
        document.getElementById(id);


    if (element) {

        element.value =
            value;

    }

}


function setChecked(
    id,
    value
) {

    const element =
        document.getElementById(id);


    if (element) {

        element.checked =
            Boolean(value);

    }

}


function getValue(id) {

    const element =
        document.getElementById(id);


    if (!element) {
        return "";
    }


    return element.value;

}


function getChecked(id) {

    const element =
        document.getElementById(id);


    if (!element) {
        return false;
    }


    return element.checked;

}


function escapeHtml(value) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

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


                    if (
                        dashboardCreated
                    ) {

                        loadProfile();

                        loadSettings();

                        await checkAdminAccess();

                    }

                } else {

                    isAdmin = false;

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