import {
    initializeApp,
    getApps,
    getApp
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";

import {
    getAuth,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signOut
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";

import {
    getFirestore,
    doc,
    getDoc,
    setDoc,
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";


/* =========================================================
   FIREBASE CONFIG
========================================================= */

const firebaseConfig = {
      apiKey: "AIzaSyAF9-LEij0O7caT5I74f2UtfGDdc78JGqQ",
        authDomain: "ai-content-agent-a9820.firebaseapp.com",
    projectId: "ai-content-agent-a9820",
    storageBucket: "ai-content-agent-a9820.firebasestorage.app",
    messagingSenderId: "833284009437",
    appId: "1:833284009437:web:91859542fb1f87ccdb9a34"
};


/* =========================================================
   FIREBASE INITIALIZATION
========================================================= */

const app =
    getApps().length > 0
        ? getApp()
        : initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getFirestore(app);


/* =========================================================
   ADMIN STATE
========================================================= */

let currentUser = null;


/* =========================================================
   HELPERS
========================================================= */

function $(id) {
    return document.getElementById(id);
}

function setText(id, value) {
    const element = $(id);

    if (element) {
        element.textContent = value;
    }
}

function setValue(id, value) {
    const element = $(id);

    if (element) {
        element.value = value;
    }
}

function getValue(id) {
    const element = $(id);

    return element ? element.value : "";
}

function setChecked(id, value) {
    const element = $(id);

    if (element) {
        element.checked = value;
    }
}

function getChecked(id) {
    const element = $(id);

    return element ? element.checked : false;
}

function setSelectValue(id, value) {
    const element = $(id);

    if (!element) {
        return;
    }

    const exists = Array.from(element.options).some(
        option =>
            option.value === value ||
            option.text === value
    );

    if (exists) {
        element.value = value;
    }
}

function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function showLoading(message) {
    const loading = $("loading");

    if (loading) {
        loading.textContent = message;
        loading.classList.remove("hidden");
    }
}

function hideLoading() {
    const loading = $("loading");

    if (loading) {
        loading.classList.add("hidden");
    }
}

function showApp() {
    const appElement = $("app");

    if (appElement) {
        appElement.classList.remove("hidden");
    }
}

function hideApp() {
    const appElement = $("app");

    if (appElement) {
        appElement.classList.add("hidden");
    }
}


/* =========================================================
   LOGIN SCREEN
========================================================= */

function createLoginScreen() {

    if ($("adminLoginScreen")) {
        return;
    }

    const login = document.createElement("div");

    login.id = "adminLoginScreen";

    login.innerHTML = `
        <div class="admin-login-box">

            <div class="admin-login-icon">
                👑
            </div>

            <h1>Admin Login</h1>

            <p>
                AI Content Agent Administration
            </p>

            <form id="adminLoginForm">

                <label>
                    Email
                    <input
                        id="adminLoginEmail"
                        type="email"
                        placeholder="Admin email"
                        autocomplete="username"
                        required
                    >
                </label>

                <label>
                    Password
                    <input
                        id="adminLoginPassword"
                        type="password"
                        placeholder="Password"
                        autocomplete="current-password"
                        required
                    >
                </label>

                <button
                    id="adminLoginBtn"
                    type="submit"
                >
                    Login
                </button>

                <div
                    id="adminLoginError"
                    class="admin-login-error"
                ></div>

            </form>

        </div>
    `;

    document.body.appendChild(login);

    const form = $("adminLoginForm");

    if (!form) {
        return;
    }

    form.addEventListener("submit", async event => {

        event.preventDefault();

        const email =
            getValue("adminLoginEmail").trim();

        const password =
            getValue("adminLoginPassword");

        const button =
            $("adminLoginBtn");

        const errorBox =
            $("adminLoginError");

        if (errorBox) {
            errorBox.textContent = "";
        }

        if (button) {
            button.disabled = true;
            button.textContent = "Logging in...";
        }

        try {

            await signInWithEmailAndPassword(
                auth,
                email,
                password
            );

        } catch (error) {

            console.error(
                "Admin login error:",
                error
            );

            let message =
                "Login failed. Please check your email and password.";

            if (
                error.code ===
                "auth/invalid-credential"
            ) {
                message =
                    "Incorrect email or password.";
            }

            if (
                error.code ===
                "auth/invalid-email"
            ) {
                message =
                    "Please enter a valid email address.";
            }

            if (
                error.code ===
                "auth/too-many-requests"
            ) {
                message =
                    "Too many login attempts. Please try again later.";
            }

            if (errorBox) {
                errorBox.textContent = message;
            }

        } finally {

            if (button) {
                button.disabled = false;
                button.textContent = "Login";
            }
        }
    });
}

function showLoginScreen() {

    createLoginScreen();

    const login =
        $("adminLoginScreen");

    if (login) {
        login.style.display = "flex";
    }

    hideApp();
    hideLoading();
}

function hideLoginScreen() {

    const login =
        $("adminLoginScreen");

    if (login) {
        login.style.display = "none";
    }
}


/* =========================================================
   ADMIN VERIFICATION
========================================================= */

async function verifyAdmin(user) {

    if (!user) {
        return false;
    }

    try {

        const adminRef = doc(
            db,
            "admins",
            user.uid
        );

        const snapshot = await getDoc(adminRef);

        if (!snapshot.exists()) {

            console.error(
                "Admin document does not exist for:",
                user.uid
            );

            return false;
        }

        const data = snapshot.data();

        console.log("ADMIN UID:", user.uid);
        console.log("ADMIN DOCUMENT:", data);
        console.log("ADMIN ROLE:", data.role);
        console.log(
            "ADMIN ROLE TYPE:",
            typeof data.role
        );

        const role = String(
            data.role ?? ""
        )
            .trim()
            .toLowerCase();

        if (role !== "admin") {

            console.error(
                "User does not have admin role.",
                {
                    uid: user.uid,
                    email: user.email,
                    document: data,
                    role: data.role
                }
            );

            return false;
        }

        console.log(
            "Admin verification successful:",
            user.email,
            user.uid
        );

        return true;

    } catch (error) {

        console.error(
            "Admin verification failed:",
            error
        );

        return false;
    }
}

/* =========================================================
   AUTH STATE
========================================================= */

onAuthStateChanged(
    auth,
    async user => {

        hideApp();

        if (!user) {

            showLoginScreen();

            return;
        }

        showLoading(
            "Checking admin access..."
        );

        const allowed =
            await verifyAdmin(user);

        if (!allowed) {

            console.error(
                "Access denied for:",
                user.email,
                user.uid
            );

            await signOut(auth);

            showLoginScreen();

            const errorBox =
                $("adminLoginError");

            if (errorBox) {
                errorBox.textContent =
                    "This account is not authorized as an admin.";
            }

            return;
        }

        currentUser = user;

        hideLoginScreen();

        setText(
            "adminEmail",
            user.email || ""
        );

        setText(
            "securityEmail",
            user.email || ""
        );

        setText(
            "securityUid",
            user.uid || ""
        );

        hideLoading();

        showApp();

        await loadAdminData();
    }
);


/* =========================================================
   LOGOUT
========================================================= */

const logoutBtn =
    $("logoutBtn");

if (logoutBtn) {

    logoutBtn.addEventListener(
        "click",
        async () => {

            try {

                await signOut(auth);

                window.location.reload();

            } catch (error) {

                console.error(
                    "Logout error:",
                    error
                );

                alert(
                    "Logout failed."
                );
            }
        }
    );
}


/* =========================================================
   REFRESH
========================================================= */

const refreshBtn =
    $("refreshBtn");

if (refreshBtn) {

    refreshBtn.addEventListener(
        "click",
        async () => {

            await loadAdminData();

        }
    );
}


/* =========================================================
   LOAD ALL ADMIN DATA
========================================================= */

async function loadAdminData() {

    try {

        await Promise.all([
            loadOverview(),
            loadUsers(),
            loadContentActivity(),
            loadChatActivity(),
            loadImageUsage(),
            loadAdsSettings(),
            loadAnnouncement(),
            loadPlans(),
            loadAppSettings()
        ]);

        setText(
            "statusText",
            "Admin verified. Dashboard data loaded."
        );

    } catch (error) {

        console.error(
            "Admin data loading error:",
            error
        );

        setText(
            "statusText",
            "Admin verified, but some dashboard data could not be loaded."
        );
    }
}


/* =========================================================
   OVERVIEW
========================================================= */

async function loadOverview() {

    try {

        const usersSnapshot =
            await getDocs(
                collection(
                    db,
                    "users"
                )
            );

        let totalUsers = 0;
        let totalContent = 0;
        let totalChats = 0;

        for (
            const userDoc of usersSnapshot.docs
        ) {

            totalUsers++;

            const uid =
                userDoc.id;

            const contentSnapshot =
                await getDocs(
                    collection(
                        db,
                        "users",
                        uid,
                        "contentHistory"
                    )
                );

            const chatSnapshot =
                await getDocs(
                    collection(
                        db,
                        "users",
                        uid,
                        "chatHistory"
                    )
                );

            totalContent +=
                contentSnapshot.size;

            totalChats +=
                chatSnapshot.size;
        }

        setText(
            "totalUsers",
            totalUsers
        );

        setText(
            "totalContent",
            totalContent
        );

        setText(
            "totalChats",
            totalChats
        );

        setText(
            "totalImages",
            "Not tracked"
        );

    } catch (error) {

        console.error(
            "Overview error:",
            error
        );
    }
}


/* =========================================================
   USERS
========================================================= */

async function loadUsers() {

    const table =
        $("usersTable");

    if (!table) {
        return;
    }

    table.innerHTML = "";

    try {

        const snapshot =
            await getDocs(
                collection(
                    db,
                    "users"
                )
            );

        for (
            const userDoc of snapshot.docs
        ) {

            const data =
                userDoc.data();

            const row =
                document.createElement("tr");

            row.innerHTML = `
                <td>
                    ${escapeHtml(
                        data.name || "—"
                    )}
                </td>

                <td>
                    ${escapeHtml(
                        data.email || "—"
                    )}
                </td>

                <td>
                    ${escapeHtml(
                        userDoc.id
                    )}
                </td>

                <td>
                    User
                </td>
            `;

            table.appendChild(row);
        }

    } catch (error) {

        console.error(
            "Users loading error:",
            error
        );

        table.innerHTML = `
            <tr>
                <td colspan="4">
                    Unable to load users.
                </td>
            </tr>
        `;
    }
}


/* =========================================================
   CONTENT ACTIVITY
========================================================= */

async function loadContentActivity() {

    let count = 0;
    let usersWithContent = 0;

    try {

        const usersSnapshot =
            await getDocs(
                collection(
                    db,
                    "users"
                )
            );

        for (
            const userDoc of usersSnapshot.docs
        ) {

            const snapshot =
                await getDocs(
                    collection(
                        db,
                        "users",
                        userDoc.id,
                        "contentHistory"
                    )
                );

            if (snapshot.size > 0) {
                usersWithContent++;
            }

            count +=
                snapshot.size;
        }

        setText(
            "contentCount",
            count
        );

        setText(
            "contentUsers",
            usersWithContent
        );

    } catch (error) {

        console.error(
            "Content activity error:",
            error
        );
    }
}


/* =========================================================
   CHAT ACTIVITY
========================================================= */

async function loadChatActivity() {

    let count = 0;
    let usersWithChats = 0;

    try {

        const usersSnapshot =
            await getDocs(
                collection(
                    db,
                    "users"
                )
            );

        for (
            const userDoc of usersSnapshot.docs
        ) {

            const snapshot =
                await getDocs(
                    collection(
                        db,
                        "users",
                        userDoc.id,
                        "chatHistory"
                    )
                );

            if (snapshot.size > 0) {
                usersWithChats++;
            }

            count +=
                snapshot.size;
        }

        setText(
            "chatCount",
            count
        );

        setText(
            "chatUsers",
            usersWithChats
        );

    } catch (error) {

        console.error(
            "Chat activity error:",
            error
        );
    }
}


/* =========================================================
   IMAGE USAGE
========================================================= */

async function loadImageUsage() {

    setText(
        "totalImages",
        "Not tracked"
    );

    setText(
        "imageUsage",
        "Not tracked"
    );
}


/* =========================================================
   ADS SETTINGS
========================================================= */

async function loadAdsSettings() {

    try {

        const snapshot =
            await getDoc(
                doc(
                    db,
                    "adminSettings",
                    "ads"
                )
            );

        if (!snapshot.exists()) {

            setChecked(
                "adsEnabled",
                false
            );

            return;
        }

        const data =
            snapshot.data();

        setChecked(
            "adsEnabled",
            data.enabled === true
        );

        setSelectValue(
            "adFrequency",
            data.frequency ||
            "Every 10 minutes"
        );

        setValue(
            "adDuration",
            "10 seconds"
        );

        setSelectValue(
            "adPlacement",
            data.placement ||
            "Dashboard"
        );

        setSelectValue(
            "adNetwork",
            data.network ||
            "Not Connected"
        );

    } catch (error) {

        console.error(
            "Ads settings error:",
            error
        );
    }
}


/* =========================================================
   SAVE ADS
========================================================= */

const saveAds =
    $("saveAds");

if (saveAds) {

    saveAds.addEventListener(
        "click",
        async () => {

            try {

                await setDoc(
                    doc(
                        db,
                        "adminSettings",
                        "ads"
                    ),
                    {
                        enabled:
                            getChecked(
                                "adsEnabled"
                            ),

                        frequency:
                            getValue(
                                "adFrequency"
                            ),

                        duration: 10,

                        placement:
                            getValue(
                                "adPlacement"
                            ),

                        network:
                            getValue(
                                "adNetwork"
                            ),

                        updatedAt:
                            new Date()
                                .toISOString()
                    },
                    {
                        merge: true
                    }
                );

                alert(
                    "Ads settings saved successfully."
                );

            } catch (error) {

                console.error(
                    "Save ads error:",
                    error
                );

                alert(
                    "Could not save ads settings."
                );
            }
        }
    );
}


/* =========================================================
   ANNOUNCEMENT
========================================================= */

async function loadAnnouncement() {

    try {

        const snapshot =
            await getDoc(
                doc(
                    db,
                    "adminSettings",
                    "announcement"
                )
            );

        if (!snapshot.exists()) {
            return;
        }

        const data =
            snapshot.data();

        setChecked(
            "announcementEnabled",
            data.enabled === true
        );

        setValue(
            "announcementText",
            data.text || ""
        );

    } catch (error) {

        console.error(
            "Announcement loading error:",
            error
        );
    }
}


/* =========================================================
   SAVE ANNOUNCEMENT
========================================================= */

const saveAnnouncement =
    $("saveAnnouncement");

if (saveAnnouncement) {

    saveAnnouncement.addEventListener(
        "click",
        async () => {

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
                                "announcementEnabled"
                            ),

                        text:
                            getValue(
                                "announcementText"
                            ),

                        updatedAt:
                            new Date()
                                .toISOString()
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
                    "Could not save announcement."
                );
            }
        }
    );
}


/* =========================================================
   PLANS & LIMITS
========================================================= */

async function loadPlans() {

    try {

        const snapshot =
            await getDoc(
                doc(
                    db,
                    "adminSettings",
                    "plans"
                )
            );

        if (!snapshot.exists()) {

            setValue(
                "freeContentLimit",
                10
            );

            setValue(
                "freeChatLimit",
                10
            );

            setValue(
                "freeImageLimit",
                0
            );

            setValue(
                "paidAds",
                "false"
            );

            return;
        }

        const data =
            snapshot.data();

        setValue(
            "freeContentLimit",
            data.freeContentLimit ?? 10
        );

        setValue(
            "freeChatLimit",
            data.freeChatLimit ?? 10
        );

        setValue(
            "freeImageLimit",
            data.freeImageLimit ?? 0
        );

        setValue(
            "paidAds",
            data.paidAds === true
                ? "true"
                : "false"
        );

    } catch (error) {

        console.error(
            "Plans loading error:",
            error
        );
    }
}


/* =========================================================
   SAVE PLANS
========================================================= */

const savePlans =
    $("savePlans");

if (savePlans) {

    savePlans.addEventListener(
        "click",
        async () => {

            try {

                await setDoc(
                    doc(
                        db,
                        "adminSettings",
                        "plans"
                    ),
                    {
                        freeContentLimit:
                            Number(
                                getValue(
                                    "freeContentLimit"
                                )
                            ),

                        freeChatLimit:
                            Number(
                                getValue(
                                    "freeChatLimit"
                                )
                            ),

                        freeImageLimit:
                            Number(
                                getValue(
                                    "freeImageLimit"
                                )
                            ),

                        paidAds:
                            getValue(
                                "paidAds"
                            ) === "true",

                        updatedAt:
                            new Date()
                                .toISOString()
                    },
                    {
                        merge: true
                    }
                );

                alert(
                    "Plans saved successfully."
                );

            } catch (error) {

                console.error(
                    "Plans save error:",
                    error
                );

                alert(
                    "Could not save plans."
                );
            }
        }
    );
}


/* =========================================================
   APP SETTINGS
========================================================= */

async function loadAppSettings() {

    try {

        const snapshot =
            await getDoc(
                doc(
                    db,
                    "adminSettings",
                    "app"
                )
            );

        if (!snapshot.exists()) {
            return;
        }

        const data =
            snapshot.data();

        setValue(
            "appVersion",
            data.version || "1.0.0"
        );

        setChecked(
            "maintenanceMode",
            data.maintenanceMode === true
        );

    } catch (error) {

        console.error(
            "App settings loading error:",
            error
        );
    }
}


/* =========================================================
   SAVE APP SETTINGS
========================================================= */

const saveSettings =
    $("saveSettings");

if (saveSettings) {

    saveSettings.addEventListener(
        "click",
        async () => {

            try {

                await setDoc(
                    doc(
                        db,
                        "adminSettings",
                        "app"
                    ),
                    {
                        version:
                            getValue(
                                "appVersion"
                            ),

                        maintenanceMode:
                            getChecked(
                                "maintenanceMode"
                            ),

                        updatedAt:
                            new Date()
                                .toISOString()
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
                    "Could not save app settings."
                );
            }
        }
    );
}


/* =========================================================
   NAVIGATION
========================================================= */

document
    .querySelectorAll(".nav")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                const sectionId =
                    button.dataset.section;

                document
                    .querySelectorAll(".nav")
                    .forEach(item => {

                        item.classList.remove(
                            "active"
                        );
                    });

                button.classList.add(
                    "active"
                );

                document
                    .querySelectorAll(".section")
                    .forEach(section => {

                        section.classList.remove(
                            "active"
                        );
                    });

                const section =
                    $(sectionId);

                if (section) {

                    section.classList.add(
                        "active"
                    );
                }
            }
        );
    });


/* =========================================================
   LOGIN SCREEN STYLES
========================================================= */

const loginStyle =
    document.createElement("style");

loginStyle.textContent = `

#adminLoginScreen {
    position: fixed;
    inset: 0;
    z-index: 99999;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    background:
        linear-gradient(
            135deg,
            #eef4ff 0%,
            #f8faff 50%,
            #eaf3ff 100%
        );
}

.admin-login-box {
    width: 100%;
    max-width: 390px;
    padding: 32px;
    background: #ffffff;
    border: 1px solid #e3e8f0;
    border-radius: 18px;
    box-shadow:
        0 18px 50px
        rgba(25, 45, 80, 0.12);
}

.admin-login-icon {
    width: 58px;
    height: 58px;
    margin: 0 auto 15px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #eef4ff;
    border-radius: 16px;
    font-size: 27px;
}

.admin-login-box h1 {
    margin: 0;
    text-align: center;
    color: #111827;
    font-size: 24px;
    font-weight: 800;
}

.admin-login-box > p {
    margin: 7px 0 25px;
    text-align: center;
    color: #7a8495;
    font-size: 12px;
}

#adminLoginForm {
    display: flex;
    flex-direction: column;
    gap: 15px;
}

#adminLoginForm label {
    display: flex;
    flex-direction: column;
    gap: 7px;
    color: #344054;
    font-size: 12px;
    font-weight: 700;
}

#adminLoginForm input {
    width: 100%;
    padding: 12px 13px;
    border: 1px solid #d9dee8;
    border-radius: 10px;
    outline: none;
    background: #ffffff;
    color: #172033;
    font-size: 13px;
    box-sizing: border-box;
}

#adminLoginForm input:focus {
    border-color: #2563eb;
    box-shadow:
        0 0 0 3px
        rgba(37, 99, 235, 0.10);
}

#adminLoginBtn {
    margin-top: 4px;
    border: 0;
    border-radius: 10px;
    padding: 12px;
    background: #2563eb;
    color: #ffffff;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
}

#adminLoginBtn:hover {
    background: #1d4ed8;
}

#adminLoginBtn:disabled {
    opacity: 0.65;
    cursor: not-allowed;
}

.admin-login-error {
    min-height: 18px;
    color: #dc2626;
    text-align: center;
    font-size: 12px;
    line-height: 1.5;
}

`;

document.head.appendChild(loginStyle);