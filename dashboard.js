```javascript
// ============================================================
// AI CONTENT AGENT
// DASHBOARD / PROFILE / SETTINGS / CUSTOMER PORTAL
// FINAL PREMIUM 3D UI
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
// FINAL PREMIUM 3D STYLES
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
            transition:
                transform .2s ease,
                box-shadow .2s ease;
        }

        .profile:hover {
            transform: translateY(-2px);
        }


        /* =====================================================
           OVERLAY
           ===================================================== */

        #acaDashboardOverlay {
            position: fixed;
            inset: 0;
            z-index: 99999;
            display: none;
            align-items: center;
            justify-content: center;
            padding: 14px;
            box-sizing: border-box;

            background:
                radial-gradient(
                    circle at 20% 10%,
                    rgba(59,130,246,.18),
                    transparent 35%
                ),
                radial-gradient(
                    circle at 90% 90%,
                    rgba(99,102,241,.18),
                    transparent 40%
                ),
                rgba(7,15,35,.68);

            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
        }


        /* =====================================================
           MAIN PANEL
           ===================================================== */

        #acaDashboardPanel {
            width: min(1060px, 100%);
            max-height: 91vh;

            background:
                linear-gradient(
                    145deg,
                    #ffffff 0%,
                    #f8fbff 45%,
                    #eef5ff 100%
                );

            border: 1px solid rgba(255,255,255,.85);

            border-radius: 26px;

            overflow: hidden;

            display: flex;

            box-shadow:
                0 35px 90px rgba(0,0,0,.30),
                0 12px 30px rgba(37,99,235,.15),
                inset 0 1px 0 rgba(255,255,255,.95);

            position: relative;
        }


        /* =====================================================
           SIDEBAR
           ===================================================== */

        #acaDashboardSidebar {
            width: 225px;
            flex-shrink: 0;

            background:
                linear-gradient(
                    160deg,
                    #f9fcff 0%,
                    #eef5ff 100%
                );

            border-right: 1px solid #dbe7f7;

            padding: 20px 14px;

            box-sizing: border-box;

            overflow-y: auto;

            box-shadow:
                5px 0 18px rgba(37,99,235,.05);
        }


        #acaDashboardSidebar h3 {
            margin: 3px 8px 20px;

            font-size: 18px;

            color: #13213d;

            font-weight: 800;

            letter-spacing: -.3px;
        }


        .acaDashboardNav {
            width: 100%;

            display: flex;
            align-items: center;
            gap: 9px;

            border: 1px solid transparent;

            background: transparent;

            color: #65738b;

            text-align: left;

            padding: 12px;

            border-radius: 13px;

            margin-bottom: 6px;

            cursor: pointer;

            font-size: 13px;
            font-weight: 600;

            transition: all .2s ease;

            box-sizing: border-box;
        }


        .acaDashboardNav:hover {
            color: #2563eb;

            background:
                linear-gradient(
                    135deg,
                    #ffffff,
                    #eef5ff
                );

            border-color: #dbeafe;

            transform: translateX(2px);

            box-shadow:
                0 5px 14px rgba(37,99,235,.08);
        }


        .acaDashboardNav.active {
            color: #ffffff;

            background:
                linear-gradient(
                    135deg,
                    #2563eb,
                    #4f46e5
                );

            border-color: #3b82f6;

            font-weight: 700;

            box-shadow:
                0 8px 20px rgba(37,99,235,.25),
                inset 0 1px 0 rgba(255,255,255,.25);

            transform: translateY(-1px);
        }


        /* =====================================================
           CONTENT
           ===================================================== */

        #acaDashboardContent {
            position: relative;

            flex: 1;

            min-width: 0;

            overflow-y: auto;

            padding: 30px;

            box-sizing: border-box;
        }


        #acaDashboardClose {
            position: absolute;

            top: 17px;
            right: 17px;

            width: 38px;
            height: 38px;

            border: 1px solid #dbe5f2;

            border-radius: 50%;

            background:
                linear-gradient(
                    145deg,
                    #ffffff,
                    #edf4fc
                );

            color: #52627a;

            cursor: pointer;

            font-size: 17px;

            z-index: 2;

            box-shadow:
                0 5px 14px rgba(30,64,175,.10);

            transition: all .2s ease;
        }


        #acaDashboardClose:hover {
            color: #dc2626;

            transform:
                rotate(90deg)
                scale(1.05);

            box-shadow:
                0 7px 18px rgba(220,38,38,.15);
        }


        /* =====================================================
           SECTIONS
           ===================================================== */

        .acaDashboardSection {
            display: none;

            padding-top: 4px;
            padding-right: 38px;
        }


        .acaDashboardSection.active {
            display: block;
            animation: acaSectionIn .22s ease;
        }


        @keyframes acaSectionIn {

            from {
                opacity: 0;
                transform: translateY(6px);
            }

            to {
                opacity: 1;
                transform: translateY(0);
            }

        }


        .acaDashboardSection h2 {
            margin: 0 0 20px;

            color: #12213d;

            font-size: 25px;

            font-weight: 800;

            letter-spacing: -.5px;
        }


        .acaDashboardSection p {
            color: #65738b;

            font-size: 14px;

            line-height: 1.65;
        }


        /* =====================================================
           CARDS
           ===================================================== */

        .acaDashboardCard {

            background:
                linear-gradient(
                    145deg,
                    #ffffff,
                    #f4f8ff
                );

            border: 1px solid #dce7f5;

            border-radius: 18px;

            padding: 20px;

            margin-bottom: 16px;

            box-shadow:
                0 12px 30px rgba(30,64,175,.07),
                inset 0 1px 0 rgba(255,255,255,.95);

            transition:
                transform .2s ease,
                box-shadow .2s ease;
        }


        .acaDashboardCard:hover {

            box-shadow:
                0 16px 35px rgba(30,64,175,.10),
                inset 0 1px 0 rgba(255,255,255,.95);

        }


        /* =====================================================
           PROFILE AVATAR
           ===================================================== */

        #acaProfileAvatar {

            width: 68px;
            height: 68px;

            border-radius: 20px;

            display: flex;

            align-items: center;
            justify-content: center;

            background:
                linear-gradient(
                    145deg,
                    #2563eb,
                    #4f46e5
                );

            color: white;

            font-size: 25px;

            font-weight: 800;

            margin-bottom: 16px;

            box-shadow:
                0 12px 25px rgba(37,99,235,.25),
                inset 0 1px 0 rgba(255,255,255,.30);

            border: 1px solid rgba(255,255,255,.35);
        }


        /* =====================================================
           PLAN BADGE
           ===================================================== */

        .acaPlanBadge {

            display: inline-flex;

            align-items: center;

            justify-content: center;

            padding: 7px 12px;

            border-radius: 999px;

            font-size: 11px;

            font-weight: 800;

            text-transform: uppercase;

            letter-spacing: .4px;

            box-shadow:
                0 4px 10px rgba(0,0,0,.05);
        }


        .acaPlanBadge.free {

            background:
                linear-gradient(
                    135deg,
                    #eef2f7,
                    #dce4ee
                );

            color: #475569;
        }


        .acaPlanBadge.paid {

            background:
                linear-gradient(
                    135deg,
                    #dcfce7,
                    #bbf7d0
                );

            color: #15803d;
        }


        /* =====================================================
           LABELS
           ===================================================== */

        .acaDashboardLabel {

            display: block;

            margin: 14px 0 7px;

            color: #263653;

            font-size: 12px;

            font-weight: 700;

            letter-spacing: .2px;
        }


        /* =====================================================
           INPUTS
           ===================================================== */

        .acaDashboardInput {

            width: 100%;

            box-sizing: border-box;

            padding: 12px 13px;

            border: 1px solid #d8e2ef;

            border-radius: 12px;

            background:
                linear-gradient(
                    145deg,
                    #ffffff,
                    #f8fbff
                );

            color: #17243d;

            font-family: inherit;

            font-size: 13px;

            outline: none;

            box-shadow:
                inset 0 2px 5px rgba(30,64,175,.035),
                0 2px 5px rgba(30,64,175,.025);

            transition:
                border-color .2s ease,
                box-shadow .2s ease;
        }


        .acaDashboardInput:focus {

            border-color: #5b8def;

            box-shadow:
                0 0 0 3px rgba(59,130,246,.10),
                inset 0 2px 5px rgba(30,64,175,.035);
        }


        /* =====================================================
           BUTTONS
           ===================================================== */

        .acaDashboardButton {

            border: 1px solid transparent;

            border-radius: 12px;

            padding: 12px 17px;

            margin-top: 15px;

            background:
                linear-gradient(
                    135deg,
                    #2563eb,
                    #4f46e5
                );

            color: white;

            font-size: 13px;

            font-weight: 700;

            cursor: pointer;

            box-shadow:
                0 8px 18px rgba(37,99,235,.20),
                inset 0 1px 0 rgba(255,255,255,.25);

            transition: all .2s ease;
        }


        .acaDashboardButton:hover {

            transform: translateY(-2px);

            box-shadow:
                0 11px 23px rgba(37,99,235,.25),
                inset 0 1px 0 rgba(255,255,255,.25);
        }


        .acaDashboardButton:active {
            transform: translateY(0);
        }


        .acaDashboardButton.secondary {

            background:
                linear-gradient(
                    135deg,
                    #64748b,
                    #475569
                );

            box-shadow:
                0 7px 16px rgba(71,85,105,.16);
        }


        .acaDashboardButton.danger {

            background:
                linear-gradient(
                    135deg,
                    #ef4444,
                    #dc2626
                );

            box-shadow:
                0 8px 18px rgba(220,38,38,.18);
        }


        /* =====================================================
           PROFILE LOGOUT
           ===================================================== */

        #acaProfileLogout {

            width: 100%;

            margin-top: 20px;

            padding: 13px 16px;

            border-radius: 13px;

            border: 1px solid #fecaca;

            background:
                linear-gradient(
                    145deg,
                    #fffafa,
                    #fff1f2
                );

            color: #dc2626;

            font-size: 13px;

            font-weight: 800;

            cursor: pointer;

            box-shadow:
                0 7px 18px rgba(220,38,38,.07);

            transition: all .2s ease;
        }


        #acaProfileLogout:hover {

            background:
                linear-gradient(
                    135deg,
                    #fee2e2,
                    #fecaca
                );

            transform: translateY(-2px);

            box-shadow:
                0 10px 22px rgba(220,38,38,.12);
        }


        /* =====================================================
           SETTINGS ROW
           ===================================================== */

        .acaSettingRow {

            display: flex;

            align-items: center;

            justify-content: space-between;

            gap: 15px;

            padding: 16px 2px;

            border-bottom: 1px solid #e4ebf4;
        }


        .acaSettingRow:last-child {
            border-bottom: none;
        }


        .acaSettingTitle {

            color: #243451;

            font-size: 14px;

            font-weight: 700;
        }


        .acaSettingDescription {

            margin-top: 4px;

            color: #7a879b;

            font-size: 12px;

            line-height: 1.4;
        }


        /* =====================================================
           CONNECT PANEL
           ===================================================== */

        .acaSettingAction {

            flex-shrink: 0;

            min-width: 82px;

            padding: 9px 12px;

            border-radius: 10px;

            border: 1px solid #d7e3f4;

            background:
                linear-gradient(
                    145deg,
                    #ffffff,
                    #eef5ff
                );

            color: #2563eb;

            font-size: 12px;

            font-weight: 700;

            cursor: pointer;

            box-shadow:
                0 5px 12px rgba(37,99,235,.07);

            transition: all .2s ease;
        }


        .acaSettingAction:hover {

            transform: translateY(-1px);

            border-color: #93c5fd;

            box-shadow:
                0 7px 16px rgba(37,99,235,.11);
        }


        .acaUtilityPanel {

            margin-top: 13px;

            padding: 15px;

            border-radius: 14px;

            border: 1px solid #dbe7f7;

            background:
                linear-gradient(
                    145deg,
                    #f9fcff,
                    #edf5ff
                );

            box-shadow:
                inset 0 1px 0 #ffffff,
                0 7px 16px rgba(37,99,235,.05);
        }


        .acaUtilityTitle {

            font-size: 13px;

            font-weight: 800;

            color: #243451;

            margin-bottom: 5px;
        }


        .acaUtilityText {

            font-size: 12px;

            color: #718096;

            line-height: 1.55;
        }


        .acaConnectionStatus {

            display: inline-flex;

            align-items: center;

            gap: 7px;

            margin-top: 10px;

            padding: 7px 10px;

            border-radius: 999px;

            background: #ecfdf5;

            color: #15803d;

            font-size: 11px;

            font-weight: 800;
        }


        .acaConnectionDot {

            width: 7px;
            height: 7px;

            border-radius: 50%;

            background: #22c55e;

            box-shadow:
                0 0 0 4px rgba(34,197,94,.10);
        }


        /* =====================================================
           DANGER BOX
           ===================================================== */

        .acaDangerBox {

            background:
                linear-gradient(
                    145deg,
                    #fffafa,
                    #fff1f2
                );

            border: 1px solid #fecaca;

            border-radius: 16px;

            padding: 18px;

            box-shadow:
                0 10px 24px rgba(220,38,38,.06);
        }


        /* =====================================================
           BANNERS
           ===================================================== */

        #acaCustomerAnnouncement {

            display: none;

            background:
                linear-gradient(
                    135deg,
                    #eef5ff,
                    #e0e7ff
                );

            border: 1px solid #c7d2fe;

            border-radius: 14px;

            padding: 14px 18px;

            margin-bottom: 18px;

            color: #3730a3;

            box-shadow:
                0 8px 18px rgba(79,70,229,.07);
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


        #acaMaintenanceBanner {

            display: none;

            background:
                linear-gradient(
                    135deg,
                    #fffbeb,
                    #fef3c7
                );

            border: 1px solid #fde68a;

            border-radius: 14px;

            padding: 14px 18px;

            margin-bottom: 18px;

            color: #92400e;

            font-size: 13px;

            font-weight: 700;

            line-height: 1.5;
        }


        /* =====================================================
           RESPONSIVE
           ===================================================== */

        @media (max-width: 700px) {

            #acaDashboardOverlay {
                padding: 8px;
            }


            #acaDashboardPanel {

                width: 100%;

                max-height: 95vh;

                flex-direction: column;

                border-radius: 20px;
            }


            #acaDashboardSidebar {

                width: 100%;

                display: flex;

                gap: 5px;

                overflow-x: auto;

                padding: 9px;

                border-right: none;

                border-bottom: 1px solid #dbe7f7;

                box-shadow:
                    0 4px 12px rgba(37,99,235,.05);
            }


            #acaDashboardSidebar h3 {
                display: none;
            }


            .acaDashboardNav {

                width: auto;

                min-width: max-content;

                white-space: nowrap;

                margin: 0;

                padding: 10px 12px;
            }


            #acaDashboardContent {

                padding: 22px 18px;
            }


            .acaDashboardSection {

                padding-right: 3px;
            }


            .acaDashboardSection h2 {

                font-size: 22px;

                padding-right: 35px;
            }


            .acaSettingRow {
                align-items: flex-start;
            }


            .acaSettingAction {
                min-width: 72px;
            }

        }


        @media (max-width: 450px) {

            #acaDashboardContent {
                padding: 18px 14px;
            }


            .acaDashboardCard {
                padding: 16px;
            }


            .acaDashboardSection h2 {
                font-size: 20px;
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


                <div id="acaMaintenanceBanner">
                    ⚠️ Scheduled Maintenance: Some features of the application may be temporarily limited.
                </div>


                <div id="acaCustomerAnnouncement">

                    <strong
                        id="acaCustomerAnnouncementTitle"
                    ></strong>

                    <p
                        id="acaCustomerAnnouncementMessage"
                    ></p>

                </div>


                <!-- ==================================================
                     PROFILE
                     ================================================== -->

                <section
                    id="acaSectionProfile"
                    class="acaDashboardSection active"
                >

                    <h2>
                        Profile
                    </h2>


                    <div class="acaDashboardCard">

                        <div
                            style="
                                display:flex;
                                justify-content:space-between;
                                align-items:flex-start;
                                gap:15px;
                            "
                        >

                            <div
                                id="acaProfileAvatar"
                            >
                                AI
                            </div>


                            <span
                                id="acaPlanBadgeContainer"
                                class="acaPlanBadge free"
                            >
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


                        <button
                            type="button"
                            id="acaProfileLogout"
                        >
                            🚪 Logout
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

                    <h2>
                        Settings
                    </h2>


                    <div class="acaDashboardCard">

                        <!-- NOTIFICATIONS -->

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


                        <!-- COMPACT MODE -->

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


                        <!-- LANGUAGE -->

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
                                style="width:auto;min-width:120px;"
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


                        <!-- CONNECT -->

                        <div class="acaSettingRow">

                            <div>

                                <div class="acaSettingTitle">
                                    🔗 Connect
                                </div>

                                <div class="acaSettingDescription">
                                    View connected application services
                                </div>

                            </div>


                            <button
                                type="button"
                                class="acaSettingAction"
                                id="acaConnectButton"
                            >
                                Connected
                            </button>

                        </div>


                        <!-- CONNECT INFORMATION -->

                        <div
                            id="acaConnectPanel"
                            class="acaUtilityPanel"
                            style="display:none;"
                        >

                            <div class="acaUtilityTitle">
                                🔗 Connected Services
                            </div>

                            <div class="acaUtilityText">
                                Your account is securely connected
                                with the application's authentication
                                and cloud services.
                            </div>

                            <div
                                class="acaConnectionStatus"
                            >

                                <span
                                    class="acaConnectionDot"
                                ></span>

                                Account Connected

                            </div>

                        </div>


                        <!-- PASSWORD -->

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


                        <!-- USAGE -->

                        <div class="acaSettingRow">

                            <div>

                                <div class="acaSettingTitle">
                                    Account Usage Limits
                                </div>

                                <div
                                    class="acaSettingDescription"
                                    id="acaAccountLimitsDisplay"
                                >
                                    Content: - | Chat: - | Images: -
                                </div>

                            </div>

                        </div>


                        <!-- VERSION -->

                        <div class="acaSettingRow">

                            <div>

                                <div class="acaSettingTitle">
                                    App Version
                                </div>

                                <div class="acaSettingDescription">
                                    Current version
                                </div>

                            </div>


                            <strong
                                id="acaSettingsAppVersion"
                                style="color:#2563eb;"
                            >
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

                    <h2>
                        Privacy Policy
                    </h2>


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

                    <h2>
                        Terms & Conditions
                    </h2>


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

                    <h2>
                        About
                    </h2>


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
                            <strong
                                id="acaAboutAppVersion"
                            >
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

                    <h2>
                        Support
                    </h2>


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
                            style="
                                min-height:120px;
                                resize:vertical;
                            "
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

                    <h2>
                        Delete Account
                    </h2>


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
    // EXISTING PROFILE ICON
    // ========================================================

    const profile =
        document.querySelector(".profile");


    if (profile) {

        profile.style.cursor = "pointer";

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
        .getElementById("acaDashboardClose")
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
    // PROFILE SAVE
    // ========================================================

    document
        .getElementById("acaSaveProfile")
        .addEventListener(
            "click",
            saveProfile
        );


    // ========================================================
    // PROFILE LOGOUT
    // Uses existing auth.js logout logic.
    // ========================================================

    document
        .getElementById("acaProfileLogout")
        .addEventListener(
            "click",
            () => {

                const existingLogout =
                    document.getElementById(
                        "logoutBtn"
                    );


                if (existingLogout) {

                    existingLogout.click();

                } else {

                    console.warn(
                        "Existing Firebase logout button not found."
                    );

                }

            }
        );


    // ========================================================
    // PASSWORD
    // ========================================================

    document
        .getElementById("acaResetPassword")
        .addEventListener(
            "click",
            resetPassword
        );


    // ========================================================
    // SUPPORT
    // ========================================================

    document
        .getElementById("acaSendSupport")
        .addEventListener(
            "click",
            sendSupport
        );


    // ========================================================
    // DELETE
    // ========================================================

    document
        .getElementById("acaDeleteAccount")
        .addEventListener(
            "click",
            deleteAccount
        );


    // ========================================================
    // CONNECT
    // ========================================================

    const connectButton =
        document.getElementById(
            "acaConnectButton"
        );


    const connectPanel =
        document.getElementById(
            "acaConnectPanel"
        );


    if (
        connectButton &&
        connectPanel
    ) {

        connectButton.addEventListener(
            "click",
            () => {

                const isOpen =
                    connectPanel.style.display !== "none";


                connectPanel.style.display =
                    isOpen
                        ? "none"
                        : "block";


                connectButton.textContent =
                    isOpen
                        ? "Connected"
                        : "Hide";

            }
        );

    }


    // ========================================================
    // SETTINGS
    // ========================================================

    document
        .getElementById("acaNotifications")
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
        .getElementById("acaCompactMode")
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
        .getElementById("acaLanguage")
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
// READ ADMIN-CONTROLLED SETTINGS
// ============================================================

async function fetchPublicSettings() {

    if (!db) {
        return;
    }


    try {

        const adsSnap =
            await getDoc(
                doc(
                    db,
                    "adminSettings",
                    "ads"
                )
            );


        if (adsSnap.exists()) {

            const data =
                adsSnap.data();


            activeAppSettings.ads = {

                enabled:
                    data.enabled !== false,

                frequency:
                    data.frequency || "medium",

                duration:
                    data.duration || "10",

                placement:
                    data.placement ||
                    "between-actions",

                network:
                    data.network || "none"

            };

        }


        const announcementSnap =
            await getDoc(
                doc(
                    db,
                    "adminSettings",
                    "announcement"
                )
            );


        if (announcementSnap.exists()) {

            const data =
                announcementSnap.data();


            activeAppSettings.announcement = {

                enabled:
                    data.enabled === true,

                title:
                    data.title || "",

                message:
                    data.message || ""

            };

        }


        const plansSnap =
            await getDoc(
                doc(
                    db,
                    "adminSettings",
                    "plans"
                )
            );


        if (plansSnap.exists()) {

            const data =
                plansSnap.data();


            activeAppSettings.plans = {

                freeContentLimit:
                    data.freeContentLimit ?? 10,

                freeChatLimit:
                    data.freeChatLimit ?? 10,

                freeImageLimit:
                    data.freeImageLimit ?? 3,

                paidNoAds:
                    data.paidNoAds === true

            };

        }


        const appSnap =
            await getDoc(
                doc(
                    db,
                    "adminSettings",
                    "app"
                )
            );


        if (appSnap.exists()) {

            const data =
                appSnap.data();


            activeAppSettings.app = {

                appVersion:
                    data.appVersion ||
                    APP_VERSION,

                maintenanceMode:
                    data.maintenanceMode === true

            };

        }


        applyPublicSettingsToUI();


    } catch (error) {

        console.warn(
            "Public settings sync error:",
            error
        );

    }

}


// ============================================================
// APPLY PUBLIC SETTINGS
// ============================================================

function applyPublicSettingsToUI() {

    const banner =
        document.getElementById(
            "acaCustomerAnnouncement"
        );


    const titleEl =
        document.getElementById(
            "acaCustomerAnnouncementTitle"
        );


    const msgEl =
        document.getElementById(
            "acaCustomerAnnouncementMessage"
        );


    if (
        banner &&
        titleEl &&
        msgEl
    ) {

        if (
            activeAppSettings.announcement.enabled &&
            activeAppSettings.announcement.message
        ) {

            titleEl.textContent =
                activeAppSettings
                    .announcement
                    .title ||
                "Announcement";


            msgEl.textContent =
                activeAppSettings
                    .announcement
                    .message;


            banner.style.display =
                "block";

        } else {

            banner.style.display =
                "none";

        }

    }


    const maintBanner =
        document.getElementById(
            "acaMaintenanceBanner"
        );


    if (maintBanner) {

        maintBanner.style.display =
            activeAppSettings.app
                .maintenanceMode
                ? "block"
                : "none";

    }


    const currentVersion =
        activeAppSettings.app.appVersion ||
        APP_VERSION;


    const aboutVer =
        document.getElementById(
            "acaAboutAppVersion"
        );


    const settingsVer =
        document.getElementById(
            "acaSettingsAppVersion"
        );


    if (aboutVer) {
        aboutVer.textContent = currentVersion;
    }


    if (settingsVer) {
        settingsVer.textContent = currentVersion;
    }


    const limitsDisplay =
        document.getElementById(
            "acaAccountLimitsDisplay"
        );


    if (limitsDisplay) {

        if (userPlan.isPaid) {

            limitsDisplay.textContent =
                "Unlimited Content & Chat (Paid Plan)";

        } else {

            limitsDisplay.textContent =
                `Content: ${activeAppSettings.plans.freeContentLimit} | Chat: ${activeAppSettings.plans.freeChatLimit} | Images: ${activeAppSettings.plans.freeImageLimit}`;

        }

    }


    const badge =
        document.getElementById(
            "acaPlanBadgeContainer"
        );


    const planInput =
        document.getElementById(
            "acaProfilePlan"
        );


    if (badge) {

        badge.className =
            `acaPlanBadge ${
                userPlan.isPaid
                    ? "paid"
                    : "free"
            }`;


        badge.textContent =
            userPlan.isPaid
                ? "Paid Plan"
                : "Free Plan";

    }


    if (planInput) {

        planInput.value =
            userPlan.isPaid
                ? "Paid Plan"
                : "Free Plan";

    }

}


// ============================================================
// CUSTOMER-FACING AD & LIMIT RESOLUTION
// ============================================================

function shouldShowAd() {

    if (
        !activeAppSettings.ads.enabled
    ) {

        return false;

    }


    if (
        userPlan.isPaid &&
        activeAppSettings.plans.paidNoAds
    ) {

        return false;

    }


    return true;

}


function getAdConfig() {

    return {

        enabled:
            shouldShowAd(),

        duration:
            Number(
                activeAppSettings
                    .ads
                    .duration
            ) || 10,

        placement:
            activeAppSettings.ads.placement,

        frequency:
            activeAppSettings.ads.frequency,

        network:
            activeAppSettings.ads.network

    };

}


function getActiveLimits() {

    return {

        isPaid:
            userPlan.isPaid,

        contentLimit:
            userPlan.isPaid
                ? Infinity
                : activeAppSettings
                    .plans
                    .freeContentLimit,

        chatLimit:
            userPlan.isPaid
                ? Infinity
                : activeAppSettings
                    .plans
                    .freeChatLimit,

        imageLimit:
            userPlan.isPaid
                ? Infinity
                : activeAppSettings
                    .plans
                    .freeImageLimit

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


    overlay.style.display = "flex";


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


            userPlan.isPaid =
                Boolean(
                    data?.isPaid === true ||
                    data?.plan === "paid"
                );


            userPlan.planType =
                userPlan.isPaid
                    ? "paid"
                    : "free";

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
                displayName:
                    name
            }
        );


        await setDoc(
            doc(
                db,
                "users",
                currentUser.uid
            ),
            {
                name:
                    name,

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
