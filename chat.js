// ==========================================
// AI CHAT
// AI CONTENT AGENT
// ==========================================

// ==========================================
// RENDER BACKEND URL
// ==========================================

const AI_CHAT_API_BASE_URL =
    (window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1")
        ? "http://localhost:3000"
        : "https://ai-content-agent-3hb3.onrender.com";

window.AI_CONTENT_AGENT_API_BASE_URL = AI_CHAT_API_BASE_URL;


// ==========================================
// DOM READY
// ==========================================

document.addEventListener("DOMContentLoaded", () => {

    const appContent =
        document.getElementById("appContent");

    // appContent is not required for AI Chat.
    // Do not stop execution if it is missing.

    initializeAIChat();

});


// ==========================================
// INITIALIZE AI CHAT
// ==========================================

async function initializeAIChat() {

    const mount = document.getElementById("aiChatMount");
    const chatSection = document.getElementById("universalChatSection");

    if (!mount || !chatSection) {
        console.error("Universal Chatbox mount not found.");
        return;
    }

    chatSection.style.display = "none";

    // Prevent duplicate initialization
    if (
        document.getElementById("aiChatLauncher") ||
        document.getElementById("aiChatPanel")
    ) {
        console.log(
            "AI Chat already initialized."
        );
        return;
    }


    // ==========================================
    // CHAT STYLES
    // ==========================================

    const style =
        document.createElement("style");

    style.id =
        "aiChatStyles";

    style.textContent = `

        #aiChatLauncher {
            position: fixed;
            right: 22px;
            bottom: 22px;
            z-index: 10000;
            border: none;
            border-radius: 50px;
            padding: 14px 20px;
            background: linear-gradient(
                135deg,
                #5b5cf0,
                #4546d8
            );
            color: white;
            font-size: 15px;
            font-weight: 700;
            cursor: pointer;
            box-shadow:
                0 10px 30px rgba(69,70,216,0.30);
            transition: 0.2s ease;
        }

        #aiChatLauncher:hover {
            transform: translateY(-2px);
        }

        #aiChatPanel {
            position: fixed;
            right: 22px;
            bottom: 82px;
            width: min(420px, calc(100vw - 28px));
            height: min(650px, calc(100vh - 120px));
            background: #ffffff;
            border: 1px solid #e9eaf3;
            border-radius: 20px;
            box-shadow:
                0 20px 60px rgba(23,24,43,0.20);
            z-index: 9999;
            display: none;
            flex-direction: column;
            overflow: hidden;
        }

        #aiChatPanel.open {
            display: flex;
        }

        .ai-chat-header {
            padding: 16px 18px;
            background:
                linear-gradient(
                    135deg,
                    #5b5cf0,
                    #4546d8
                );
            color: white;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }

        .ai-chat-header-left {
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .ai-chat-avatar {
            width: 38px;
            height: 38px;
            border-radius: 50%;
            background:
                rgba(255,255,255,0.18);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 19px;
        }

        .ai-chat-title {
            font-size: 16px;
            font-weight: 700;
        }

        .ai-chat-status {
            font-size: 11px;
            opacity: 0.85;
            margin-top: 2px;
        }

        .ai-chat-header-actions {
            display: flex;
            gap: 6px;
        }

        .ai-chat-header-btn {
            border: none;
            background:
                rgba(255,255,255,0.14);
            color: white;
            border-radius: 9px;
            padding: 8px 9px;
            cursor: pointer;
            font-size: 13px;
        }

        .ai-chat-header-btn:hover {
            background:
                rgba(255,255,255,0.24);
        }

        #aiChatMessages {
            flex: 1;
            overflow-y: auto;
            padding: 16px;
            background: #f7f8fc;
        }

        .ai-chat-message {
            display: flex;
            margin-bottom: 13px;
        }

        .ai-chat-message.user {
            justify-content: flex-end;
        }

        .ai-chat-message.assistant {
            justify-content: flex-start;
        }

        .ai-chat-bubble {
            max-width: 84%;
            padding: 11px 13px;
            border-radius: 15px;
            font-size: 14px;
            line-height: 1.55;
            word-break: break-word;
        }

        .ai-chat-message.user
        .ai-chat-bubble {
            background: #5b5cf0;
            color: white;
            border-bottom-right-radius: 5px;
        }

        .ai-chat-message.assistant
        .ai-chat-bubble {
            background: white;
            color: #17182b;
            border: 1px solid #e9eaf3;
            border-bottom-left-radius: 5px;
        }

        .ai-chat-welcome {
            text-align: center;
            padding: 35px 18px;
            color: #73758a;
        }

        .ai-chat-welcome-icon {
            font-size: 38px;
            margin-bottom: 10px;
        }

        .ai-chat-welcome-title {
            color: #17182b;
            font-size: 18px;
            font-weight: 700;
            margin-bottom: 6px;
        }

        .ai-chat-welcome-text {
            font-size: 13px;
            line-height: 1.5;
        }

        .ai-chat-input-area {
            padding: 12px;
            background: white;
            border-top: 1px solid #e9eaf3;
        }

        .ai-chat-input-row {
            display: flex;
            gap: 8px;
            align-items: flex-end;
        }

        #aiChatInput {
            flex: 1;
            min-height: 45px;
            max-height: 130px;
            resize: none;
            border: 1px solid #dfe1ec;
            border-radius: 13px;
            padding: 11px 12px;
            font-family: inherit;
            font-size: 14px;
            outline: none;
            color: #17182b;
            background: #fafbfe;
        }

        #aiChatInput:focus {
            border-color: #5b5cf0;
            background: white;
        }

        #aiChatSend {
            width: 45px;
            height: 45px;
            flex-shrink: 0;
            border: none;
            border-radius: 13px;
            background: #5b5cf0;
            color: white;
            font-size: 18px;
            cursor: pointer;
        }

        #aiChatSend:disabled {
            opacity: 0.55;
            cursor: not-allowed;
        }

        .ai-chat-hint {
            font-size: 10px;
            color: #9294a4;
            margin-top: 6px;
            padding-left: 2px;
        }

        .ai-chat-typing {
            display: inline-flex;
            gap: 4px;
            align-items: center;
        }

        .ai-chat-typing span {
            width: 5px;
            height: 5px;
            border-radius: 50%;
            background: #8b8da0;
            animation: aiChatTyping 1s infinite;
        }

        .ai-chat-typing span:nth-child(2) {
            animation-delay: 0.15s;
        }

        .ai-chat-typing span:nth-child(3) {
            animation-delay: 0.30s;
        }

        @keyframes aiChatTyping {
            0%, 60%, 100% {
                opacity: 0.3;
                transform: translateY(0);
            }

            30% {
                opacity: 1;
                transform: translateY(-3px);
            }
        }

        @media (max-width: 600px) {

            #aiChatLauncher {
                right: 15px;
                bottom: 15px;
                padding: 13px 17px;
            }

            #aiChatPanel {
                right: 8px;
                bottom: 72px;
                width: calc(100vw - 16px);
                height: calc(100vh - 95px);
                border-radius: 18px;
            }

            .ai-chat-bubble {
                max-width: 90%;
            }
        }
    `;

    document.head.appendChild(style);
    const dashboardChatStyle = document.createElement("style");

    dashboardChatStyle.textContent = `
        #universalChatSection {
            width: 100%;
            margin: 24px 0;
        }

        #aiChatLauncher {
            display: none !important;
        }

        #aiChatPanel {
            position: relative !important;
            inset: auto !important;
            width: 100% !important;
            max-width: 100% !important;
            height: min(620px, 70vh) !important;
            min-height: 420px !important;
            display: flex !important;
            margin: 0 !important;
            z-index: 1 !important;
            box-shadow: 0 10px 35px rgba(23,24,43,0.12);
        }

        #aiChatPanel.open {
            display: flex !important;
        }

        @media (max-width: 600px) {
            #aiChatPanel {
                height: min(620px, 70vh) !important;
                min-height: 380px !important;
            }
        }
    `;

    document.head.appendChild(dashboardChatStyle);



    // ==========================================
    // CREATE CHAT LAUNCHER
    // ==========================================

    const launcher =
        document.createElement("button");

    launcher.id =
        "aiChatLauncher";

    launcher.type =
        "button";

    launcher.innerHTML =
        "ðŸ’¬ AI Chat";

    launcher.style.display =
        "none";

    launcher.remove();


    // ==========================================
    // CREATE CHAT PANEL
    // ==========================================

    const panel =
        document.createElement("div");

    panel.id =
        "aiChatPanel";

    panel.innerHTML = `

        <div class="ai-chat-header">

            <div class="ai-chat-header-left">

                <div class="ai-chat-avatar">
                    &#x1F44B;
                </div>

                <div>

                    <div class="ai-chat-title">
                        AI Assistant
                    </div>

                    <div class="ai-chat-status">
                        Ready to help
                    </div>

                </div>

            </div>

            <div class="ai-chat-header-actions">

                <button
                    type="button"
                    class="ai-chat-header-btn"
                    id="aiChatSidebarNew"
                    title="New Chat">

                    â†»

                </button>

                <button
                    type="button"
                    class="ai-chat-header-btn"
                    id="aiChatCloseBtn_DISABLED"
                    title="Close">

                    âœ•

                </button>

            </div>

        </div>


        <div id="aiChatMessages">

            <div class="ai-chat-welcome">

                <div class="ai-chat-welcome-icon">
                    &#x1F44B;
                </div>

                <div class="ai-chat-welcome-title">
                    Hi! Main aapka AI Assistant hoon.
                </div>

                <div class="ai-chat-welcome-text">
                    Mujhse normal baat karo,
                    koi bhi question pucho,
                    ideas lo ya apna content create karo. Main aapki help ke liye yahan hoon.
                </div>

            </div>

        </div>


        <div class="ai-chat-input-area">

            <div class="ai-chat-input-row">

                <textarea
                    id="aiChatInput"
                    placeholder="Message AI Assistant..."
                    rows="1"></textarea>

                <button
                    type="button"
                    id="aiChatSend"
                    title="Send">

                    <svg xmlns="http://www.w3.org/2000/svg" width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 2 11 13"/><path d="m22 2-7 20-4-9-9-4Z"/></svg>

                </button>

            </div>

            <div class="ai-chat-hint">
                Enter = Send â€¢ Shift + Enter = New line
            </div>

        </div>
    `;

    // UNIVERSAL CHAT SIDEBAR LAYOUT
    const chatMessages = panel.querySelector("#aiChatMessages");
    const chatInputArea = panel.querySelector(".ai-chat-input-area");
    const chatHeader = panel.querySelector(".ai-chat-header");
    const newChatControl = panel.querySelector("#aiChatSidebarNew");

    if (!chatMessages || !chatInputArea || !chatHeader || !newChatControl) {
        console.error("Universal Chat layout elements missing. Layout unchanged.");
        return;
    }

    const sidebar = document.createElement("aside");
    sidebar.id = "aiChatSidebar";
    sidebar.innerHTML = `
        
        <button type="button" id="aiChatSidebarNew" class="ai-sidebar-new">
            + New Chat
        </button>
        <div class="ai-sidebar-heading">Tools</div>
        <button type="button" class="ai-tool-option" data-ai-tool="chat">General Chat</button>
        <button type="button" class="ai-tool-option" data-ai-tool="ideas">Content Ideas</button>
        <button type="button" class="ai-tool-option" data-ai-tool="image">Image Generation</button>
        <button type="button" class="ai-tool-option" data-ai-tool="script">Script & Caption</button>

        <div class="ai-sidebar-heading">Chat History</div>
        <div id="aiChatHistoryList"></div>
    `;

    // Move existing dashboard Profile control to sidebar bottom
    const profileControl = document.querySelector(".topbar .profile");
    if (profileControl) {
        const profileArea = document.createElement("div");
        profileArea.id = "aiChatSidebarProfile";
        profileArea.appendChild(profileControl);

        const profileDetails = document.createElement("div");
        profileDetails.id = "aiChatSidebarProfileDetails";
        profileDetails.innerHTML = `
            <div id="aiChatSidebarUserName">User</div>
            <div class="ai-sidebar-account-label">Personal Account</div>
        `;
        profileArea.appendChild(profileDetails);
        sidebar.appendChild(profileArea);
    }

    const workspace = document.createElement("div");
    workspace.id = "aiChatWorkspace";

    const mainChat = document.createElement("div");
    mainChat.id = "aiChatMain";
    mainChat.style.position = "relative";

    const chatMenuWrap = document.createElement("div");
    chatMenuWrap.style.cssText = "position:absolute;top:14px;right:18px;z-index:1000;";

    const chatMenuButton = document.createElement("button");
    chatMenuButton.type = "button";
    chatMenuButton.id = "aiChatMenuButton";
    chatMenuButton.textContent = String.fromCharCode(8942);
    chatMenuButton.setAttribute("aria-label", "Chat menu");
    chatMenuButton.setAttribute("aria-haspopup", "true");
    chatMenuButton.setAttribute("aria-expanded", "false");
    chatMenuButton.style.cssText = "width:38px;height:38px;border:1px solid #e5e7eb;border-radius:10px;background:#fff;color:#374151;font-size:25px;line-height:1;cursor:pointer;";

    const chatMenu = document.createElement("div");
    chatMenu.id = "aiChatMenu";
    chatMenu.setAttribute("role", "menu");
    chatMenu.style.cssText = "display:none;position:absolute;right:0;top:44px;min-width:165px;padding:6px;background:#fff;border:1px solid #e5e7eb;border-radius:10px;box-shadow:0 8px 25px rgba(0,0,0,.12);";

    [
        ["new", "New Chat"],
        ["rename", "Rename Chat"],
        ["delete", "Delete Chat"]
    ].forEach(([action, label]) => {
        const item = document.createElement("button");
        item.type = "button";
        item.dataset.chatAction = action;
        item.textContent = label;
        item.setAttribute("role", "menuitem");
        item.style.cssText = "display:block;width:100%;padding:10px 12px;border:0;border-radius:7px;background:#fff;color:" + (action === "delete" ? "#dc2626" : "#374151") + ";text-align:left;font-size:13px;cursor:pointer;";
        item.addEventListener("mouseenter", () => item.style.background = "#f3f4f6");
        item.addEventListener("mouseleave", () => item.style.background = "#fff");
        chatMenu.appendChild(item);
    });

    chatMenuWrap.append(chatMenuButton, chatMenu);
    mainChat.appendChild(chatMenuWrap);

    chatHeader.querySelector(".ai-chat-avatar")?.remove();
    panel.querySelector("#aiChatCloseBtn")?.remove();

    const headerActions = chatHeader.querySelector(".ai-chat-header-actions");
    if (headerActions) headerActions.remove();

    const brandTitle = chatHeader.querySelector(".ai-chat-title");
    if (brandTitle) brandTitle.textContent = "AI Content Agent";

    const brandStatus = chatHeader.querySelector(".ai-chat-status");
    if (brandStatus) brandStatus.textContent = "Your creative workspace";

    sidebar.prepend(chatHeader);

    sidebar.querySelector("#aiChatSidebarNew").replaceWith(newChatControl);
    newChatControl.id = "aiChatSidebarNew";
    newChatControl.className = "ai-sidebar-new";
    newChatControl.textContent = "+ New Chat";

    mainChat.appendChild(chatMessages);
    mainChat.appendChild(chatInputArea);
    workspace.appendChild(sidebar);
    workspace.appendChild(mainChat);
    panel.appendChild(workspace);

    const sidebarStyle = document.createElement("style");
    sidebarStyle.textContent = `
        #aiChatPanel {
            position: relative !important;
            inset: auto !important;
            width: 100% !important;
            max-width: 100% !important;
            height: min(680px, 75vh) !important;
            min-height: 440px !important;
            display: flex !important;
            flex-direction: column !important;
            overflow: hidden !important;
            border-radius: 18px !important;
        }
        #aiChatPanel .ai-chat-header {
            flex: 0 0 auto;
        }
        #aiChatWorkspace {
            display: flex;
            flex: 1;
            min-height: 0;
            overflow: hidden;
        }
        #aiChatSidebar {
            width: 220px;
            flex: 0 0 220px;
            padding: 16px 12px;
            background: #f6f8fc;
            border-right: 1px solid #e7eaf0;
            overflow-y: auto;
        }
        #aiChatSidebar .ai-sidebar-heading {
            margin: 14px 0 8px;
            color: #667085;
            font-size: 12px;
            font-weight: 700;
        }
        #aiChatSidebar button {
            display: block;
            width: 100%;
            padding: 10px;
            margin-bottom: 6px;
            border: 0;
            border-radius: 9px;
            background: transparent;
            color: #24324a;
            text-align: left;
            cursor: pointer;
            font-size: 13px;
        }
        #aiChatSidebar button:hover,
        #aiChatSidebar button.active {
            background: #e8eef9;
        }
        #aiChatSidebar .ai-sidebar-new {
            background: #e7efff;
            color: #174ea6;
            font-weight: 700;
        }
        #aiChatMain {
            display: flex;
            flex: 1;
            min-width: 0;
            min-height: 0;
            flex-direction: column;
            overflow: hidden;
        }
        #aiChatMain #aiChatMessages {
            position: relative;
            flex: 1;
            min-height: 0;
            overflow-y: auto;
        }
        #aiChatMain .ai-chat-input-area {
            flex: 0 0 auto;
        }
        @media (max-width: 650px) {
            #aiChatSidebar {
                width: 145px;
                flex-basis: 145px;
                padding: 10px 7px;
            }
            #aiChatSidebar button {
                font-size: 12px;
                padding: 8px 6px;
            }
        }

        /* Premium Universal Chat Layout */
        #aiChatPanel {
            height: min(820px, 82vh) !important;
            min-height: 560px !important;
            background: #ffffff !important;
            border: 1px solid #e5e7eb !important;
            border-radius: 16px !important;
            box-shadow: 0 8px 35px rgba(15, 23, 42, 0.07) !important;
        }

        #aiChatSidebar .ai-chat-header {
            display: block !important;
            padding: 8px 8px 12px !important;
            margin: 0 !important;
            background: transparent !important;
            color: #111827 !important;
            border: 0 !important;
            border-radius: 0 !important;
            box-shadow: none !important;
        }

        #aiChatSidebar .ai-chat-header-left {
            display: block !important;
        }

        #aiChatSidebar .ai-chat-avatar {
            display: none !important;
        }

        #aiChatSidebar .ai-chat-title {
            color: #111827 !important;
            font-size: 16px !important;
            font-weight: 700 !important;
        }

        #aiChatSidebar .ai-chat-status {
            color: #6b7280 !important;
            font-size: 11px !important;
            margin-top: 4px;
        }

        #aiChatPanel .ai-chat-title {
            color: #111827;
            font-size: 16px;
            font-weight: 750;
        }

        #aiChatPanel .ai-chat-status {
            color: #6b7280;
            font-size: 11px;
        }

        #aiChatSidebar {
            width: 230px;
            flex-basis: 230px;
            background: #f9fafb;
            border-right: 1px solid #e5e7eb;
            padding: 12px;
        }

        #aiChatSidebar .ai-sidebar-heading {
            margin: 24px 0 9px;
            color: #6b7280;
            font-size: 11px;
            letter-spacing: 0.08em;
            text-transform: uppercase;
        }

        #aiChatMain {
            background: #ffffff;
        }

        #aiChatMain #aiChatMessages {
            display: flex;
            flex-direction: column;
            padding: clamp(36px, 8vh, 90px) clamp(16px, 5vw, 64px) 24px;
            background: #ffffff;
        }

        #aiChatMain .ai-chat-welcome {
            width: 100%;
            max-width: 650px;
            margin: auto;
            padding: 20px;
            text-align: center;
        }

        #aiChatMain .ai-chat-welcome-title {
            font-size: 23px;
            color: #111827;
        }

        #aiChatMain .ai-chat-welcome-text {
            color: #6b7280;
            font-size: 14px;
        }

        #aiChatMain .ai-chat-input-area {
            padding: 16px clamp(14px, 5vw, 64px);
            background: #ffffff;
            border-top: 1px solid #f0f1f3;
        }

        @media (max-width: 650px) {
            #aiChatPanel {
                height: 82vh !important;
                min-height: 480px !important;
            }

            #aiChatSidebar {
                width: 135px;
                flex-basis: 135px;
                padding: 9px 6px;
            }

            #aiChatPanel .ai-chat-header {
                padding: 16px 8px;
            }

            #aiChatPanel .ai-chat-title {
                font-size: 13px;
            }

            #aiChatMain .ai-chat-welcome-title {
                font-size: 19px;
            }
        }
    `;
    panel.appendChild(sidebarStyle);

    const profileStyle = document.createElement("style");
    profileStyle.textContent = `
        #aiChatSidebar {
            display: flex;
            flex-direction: column;
            min-height: 0;
            box-sizing: border-box;
            overflow: hidden;
        }

        #aiChatHistoryList {
            flex: 1 1 auto;
            min-height: 0;
            overflow-y: auto;
            overflow-x: hidden;
        }

        #aiChatSidebarProfile {
            flex: 0 0 auto;
            margin-top: auto;
            padding: 16px 8px 8px;
            border-top: 1px solid #e5e7eb;
            display: flex;
            align-items: center;
            justify-content: flex-start;
        }

        #aiChatSidebarProfile .profile {
            width: 36px !important;
            height: 36px !important;
            border-radius: 50% !important;
            background: #eeeeee !important;
            color: #333333 !important;
            border: 1px solid #dddddd !important;
            box-shadow: none !important;
        }
    `;
    panel.appendChild(profileStyle);

    let activeWebsitePlanId = "";
    let websitePlanLocked = false;

    sidebar.querySelectorAll("[data-ai-tool]").forEach((button) => {
        button.addEventListener("click", () => {
            sidebar.querySelectorAll("[data-ai-tool]").forEach((item) => item.classList.remove("active"));
            button.classList.add("active");
            input.dataset.aiTool = button.dataset.aiTool;

            input.placeholder =
                button.dataset.aiTool === "image"
                    ? "Describe the image you want to create..."
                    : button.dataset.aiTool === "ideas"
                        ? "Enter a topic for content ideas..."
                        : button.dataset.aiTool === "script"
                            ? "Describe the script or caption you need..."
                            : "Message AI...";

            input.focus();
        });
    });
    mount.appendChild(panel);


    // ==========================================
    // ELEMENTS
    // ==========================================

    const messagesBox =
        document.getElementById(
            "aiChatMessages"
        );

    const input =
        document.getElementById(
            "aiChatInput"
        );

    const sendButton =
        document.getElementById(
            "aiChatSend"
        );

    const closeButton =
        document.getElementById(
            "aiChatCloseBtn_DISABLED"
        );

    const newChatButton =
        document.getElementById(
            "aiChatSidebarNew"
        );


    // ==========================================
    // FIREBASE AUTH
    // ==========================================

    try {

        const {
            initializeApp,
            getApps,
            getApp
        } = await import(
            "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js"
        );

        const {
            getAuth,
            onAuthStateChanged
        } = await import(
            "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js"
        );


        const firebaseConfig = {
            apiKey:
                "AIzaSyAF9-LEijO0bI7OcaT5I74f2UtfGDdc78JGqQ",

            authDomain:
                "ai-content-agent-a9820.firebaseapp.com",

            projectId:
                "ai-content-agent-a9820",

            storageBucket:
                "ai-content-agent-a9820.firebasestorage.app",

            messagingSenderId:
                "833284009437",

            appId:
                "1:833284009437:web:91859542fb1f87ccdb9a34"
        };


        const firebaseApp =
            getApps().length
                ? getApp()
                : initializeApp(firebaseConfig);


        const auth =
            getAuth(firebaseApp);


        onAuthStateChanged(
            auth,
            (user) => {

                if (user) {

                    chatSection.style.display =
                        "block";

                    console.log(
                        "AI Chat visible - user logged in."
                    );

                } else {

                    chatSection.style.display =
                        "none";

                    panel.classList.remove(
                        "open"
                    );

                    console.log(
                        "AI Chat hidden - user logged out."
                    );
                }
            }
        );


    } catch (error) {

        console.error(
            "AI Chat Firebase Error:",
            error
        );

        chatSection.style.display =
            "none";

        panel.classList.remove(
            "open"
        );
    }


    // ==========================================
    // CHAT MEMORY
    // ==========================================

    let messages = [];
    let activeChatId = null;
    let activeChatTitle = "New Chat";
    activeWebsitePlanId = window.AIWebsitePlanning?.getPlanId?.() || "";

    let isSending = false;


    // ==========================================
    // OPEN / CLOSE
    // ==========================================

    launcher.addEventListener(
        "click",
        () => {

            panel.classList.toggle(
                "open"
            );

            if (
                panel.classList.contains(
                    "open"
                )
            ) {

                setTimeout(
                    () => {
                        input.focus();
                    },
                    100
                );
            }
        }
    );


    if (closeButton) closeButton.addEventListener(
        "click",
        () => {

            panel.classList.remove(
                "open"
            );

        }
    );


    // ==========================================
    // NEW CHAT
    // ==========================================

    newChatButton.addEventListener(
        "click",
        () => {

            messages = [];

            activeChatId = null;
            activeChatTitle = "New Chat";


            messagesBox.innerHTML = `

                <div class="ai-chat-welcome">

                    <div class="ai-chat-welcome-icon">
                        âœ¨
                    </div>

                    <div class="ai-chat-welcome-title">
                        New Chat
                    </div>

                    <div class="ai-chat-welcome-text">
                        Fresh conversation started.
                        What would you like to talk about?
                    </div>

                </div>
            `;


            input.value = "";

            input.style.height =
                "45px";

            input.focus();

        }
    );


    // ==========================================
    // ESCAPE HTML
    // ==========================================

    function escapeHTML(value) {

        const div =
            document.createElement("div");

        div.textContent =
            String(value || "");

        return div.innerHTML;
    }


    // ==========================================
    // FORMAT RESPONSE
    // ==========================================

    function formatMessage(text) {

        return escapeHTML(text)
            .replace(/\r\n/g, "\n")
            .replace(/\r/g, "\n")
            .replace(/\n/g, "<br>");
    }


    // ==========================================
    // MARKDOWN RENDER (assistant replies only)
    // Text is HTML-escaped first, so replies can never inject HTML.
    // ==========================================

    function renderInlineMarkdown(escaped) {

        const codes = [];

        let t = escaped.replace(
            /`([^`\n]+)`/g,
            (m, c) => {
                codes.push("<code>" + c + "</code>");
                return "" + (codes.length - 1) + "";
            }
        );

        // links: only http / https are allowed
        t = t.replace(
            /\[([^\]\n]+)\]\((https?:\/\/[^\s)]+)\)/g,
            (m, label, url) =>
                '<a href="' + url.replace(/"/g, "&quot;") +
                '" target="_blank" rel="noopener noreferrer">' +
                label + "</a>"
        );

        t = t.replace(/\*\*([^\n]+?)\*\*/g, "<strong>$1</strong>");
        t = t.replace(/(^|[^\w])__([^\s_][^\n]*?)__(?!\w)/g, "$1<strong>$2</strong>");
        t = t.replace(/(^|[^*\w])\*([^*\s][^*\n]*?)\*(?!\*)/g, "$1<em>$2</em>");
        t = t.replace(/(^|[^_\w])_([^_\s][^_\n]*?)_(?![_\w])/g, "$1<em>$2</em>");

        return t.replace(
            /(\d+)/g,
            (m, i) => codes[Number(i)]
        );
    }


    function renderMarkdown(text) {

        const source =
            String(text || "")
                .replace(/\r\n/g, "\n")
                .replace(/\r/g, "\n");

        const codeBlocks = [];

        // fenced code blocks
        const withoutCode = source.replace(
            /```[^\n]*\n([\s\S]*?)```/g,
            (m, code) => {
                codeBlocks.push(
                    '<pre class="ai-md-code"><code>' +
                    escapeHTML(code.replace(/\n$/, "")) +
                    "</code></pre>"
                );
                return "\n" + (codeBlocks.length - 1) + "\n";
            }
        );

        const lines = withoutCode.split("\n");

        let html = "";
        let paragraph = [];
        let listType = null;

        const inline = (value) =>
            renderInlineMarkdown(escapeHTML(value));

        function flushParagraph() {
            if (paragraph.length) {
                html += "<p>" + paragraph.map(inline).join("<br>") + "</p>";
                paragraph = [];
            }
        }

        function flushList() {
            if (listType) {
                html += "</" + listType + ">";
                listType = null;
            }
        }

        function flushAll() {
            flushParagraph();
            flushList();
        }

        const splitRow = (row) =>
            row.trim()
                .replace(/^\|/, "")
                .replace(/\|$/, "")
                .split("|")
                .map((cell) => cell.trim());

        const isTableSeparator = (row) =>
            /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/.test(row || "");

        for (let i = 0; i < lines.length; i++) {

            const line = lines[i];
            const trimmed = line.trim();

            if (!trimmed) {
                flushAll();
                continue;
            }

            let m;

            // code block placeholder
            m = trimmed.match(/^(\d+)$/);
            if (m) {
                flushAll();
                html += codeBlocks[Number(m[1])];
                continue;
            }

            // headings
            m = trimmed.match(/^(#{1,6})\s+(.+?)\s*#*$/);
            if (m) {
                flushAll();
                html += '<div class="ai-md-h ai-md-h' + m[1].length + '">' +
                    inline(m[2]) + "</div>";
                continue;
            }

            // horizontal rule
            if (/^([-*_])(\s*\1){2,}$/.test(trimmed)) {
                flushAll();
                html += "<hr>";
                continue;
            }

            // quote
            if (/^>/.test(trimmed)) {
                flushAll();
                const quote = [];
                while (i < lines.length && /^\s*>/.test(lines[i])) {
                    quote.push(lines[i].replace(/^\s*>\s?/, ""));
                    i++;
                }
                i--;
                html += "<blockquote>" + quote.map(inline).join("<br>") + "</blockquote>";
                continue;
            }

            // table
            if (
                trimmed.indexOf("|") > -1 &&
                isTableSeparator(lines[i + 1])
            ) {
                flushAll();
                const head = splitRow(trimmed);
                i += 2;
                const rows = [];
                while (i < lines.length && lines[i].trim() && lines[i].indexOf("|") > -1) {
                    rows.push(splitRow(lines[i]));
                    i++;
                }
                i--;
                html += '<div class="ai-md-table"><table><thead><tr>' +
                    head.map((c) => "<th>" + inline(c) + "</th>").join("") +
                    "</tr></thead><tbody>" +
                    rows.map((r) =>
                        "<tr>" + r.map((c) => "<td>" + inline(c) + "</td>").join("") + "</tr>"
                    ).join("") +
                    "</tbody></table></div>";
                continue;
            }

            // lists (- * + or 1. 1) ), two spaces of indent = one level
            m = line.match(/^(\s*)([-*+]|\d+[.)])\s+(.*)$/);
            if (m) {
                flushParagraph();

                const indent = m[1].replace(/\t/g, "    ").length;
                const level = Math.min(2, Math.floor(indent / 2));
                const type = /\d/.test(m[2]) ? "ol" : "ul";

                if (listType !== type) {
                    flushList();
                    const start = type === "ol" ? parseInt(m[2], 10) : 1;
                    html += type === "ol" && start !== 1
                        ? '<ol start="' + start + '">'
                        : "<" + type + ">";
                    listType = type;
                }

                html += '<li class="ai-md-l' + level + '">' + inline(m[3]) + "</li>";
                continue;
            }

            // normal text
            flushList();
            paragraph.push(trimmed);
        }

        flushAll();

        return html || formatMessage(text);
    }




    // ==========================================
    // ADD MESSAGE
    // ==========================================

    function addMessage(
        role,
        content
    ) {

        const message =
            document.createElement("div");

        message.className =
            "ai-chat-message " + role;


        const bubble =
            document.createElement("div");

        bubble.className =
            "ai-chat-bubble";

        bubble.innerHTML =
            role === "assistant"
                ? renderMarkdown(content)
                : formatMessage(content);


        message.appendChild(bubble);

        messagesBox.appendChild(message);

        messagesBox.scrollTop =
            messagesBox.scrollHeight;


        return message;
    }



// IMAGE REQUEST HELPERS
function getImagePromptFromMessage(text) {
    const value = String(text || "").trim();

    const patterns = [
        /^(?:please\s*)?(?:generate|create|make|draw)\s+(?:an?\s+)?(?:image|picture|photo)\b/i,
        /^(?:image|picture|photo|tasveer|तस्वीर)\s*(?:banao|bana\s*do|बनाओ|बना\s*दो)/i,
        /^(?:please\s*)?(?:banao|bana\s*do|बनाओ|बना\s*दो)\s+(?:ek\s+)?(?:image|photo|picture|tasveer|तस्वीर)/i
    ];

    if (!patterns.some(pattern => pattern.test(value))) return null;

    return value
        .replace(/^(?:please\s*)?(?:generate|create|make|draw)\s+(?:an?\s+)?(?:image|picture|photo)\s*(?:of\s*)?[:,-]?\s*/i, "")
        .replace(/^(?:image|picture|photo|tasveer|तस्वीर)\s*(?:banao|bana\s*do|बनाओ|बना\s*दो)\s*[:,-]?\s*/i, "")
        .replace(/^(?:please\s*)?(?:banao|bana\s*do|बनाओ|बना\s*दो)\s+(?:ek\s+)?(?:image|photo|picture|tasveer|तस्वीर)\s*(?:of\s*)?[:,-]?\s*/i, "")
        .trim() || value;
}

function addGeneratedImageMessage(imageData, prompt) {
    const message = document.createElement("div");
    message.className = "ai-chat-message assistant";

    const bubble = document.createElement("div");
    bubble.className = "ai-chat-bubble";

    const caption = document.createElement("p");
    caption.textContent = "Your image is ready.";
    caption.style.margin = "0 0 10px";

    const image = document.createElement("img");
    image.alt = prompt || "AI-generated image";
    image.loading = "lazy";
    image.style.display = "block";
    image.style.width = "100%";
    image.style.maxWidth = "520px";
    image.style.height = "auto";
    image.style.borderRadius = "12px";
    image.style.objectFit = "contain";

    if (/^data:image\/(?:png|jpeg|jpg|webp)(?:;charset=[^;,]+)?;base64,/i.test(imageData) || /^https:\/\//i.test(imageData)) {
        image.src = imageData;
    } else {
        throw new Error("Image server ne invalid image format bheja.");
    }

    bubble.appendChild(caption);
    bubble.appendChild(image);

    if (prompt) {
        const detail = document.createElement("p");
        detail.textContent = "Prompt: " + prompt;
        detail.style.margin = "10px 0 0";
        detail.style.fontSize = "12px";
        detail.style.opacity = "0.75";
        bubble.appendChild(detail);
    }

    message.appendChild(bubble);
    messagesBox.appendChild(message);
    messagesBox.scrollTop = messagesBox.scrollHeight;
}

async function generateImageInChat(prompt) {
    if (typeof API_BASE_URL === "undefined" || !API_BASE_URL) {
        throw new Error("Image API URL nahi mila. script.js configuration check karein.");
    }

    const response = await fetch(`${API_BASE_URL}/generate-image`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            prompt,
            imageType: "Square Post",
            style: "Modern Premium",
            imageSize: "1K"
        })
    });

    const data = await response.json();

    if (!response.ok || data.success === false) {
        throw new Error(data.error || "Image generation failed.");
    }

    const imageData = data.image || data.imageUrl || data.url;
    if (typeof imageData !== "string" || !imageData) {
        throw new Error("Image server ne image return nahi ki.");
    }

    return imageData;
}

    // ==========================================
    // TYPING INDICATOR
    // ==========================================

    // TOP-RIGHT CHAT MENU
    chatMenuButton.addEventListener("click", (event) => {
        event.stopPropagation();
        const isOpen = chatMenu.style.display === "block";
        chatMenu.style.display = isOpen ? "none" : "block";
        chatMenuButton.setAttribute("aria-expanded", String(!isOpen));
    });

    document.addEventListener("click", (event) => {
        if (!chatMenuWrap.contains(event.target)) {
            chatMenu.style.display = "none";
            chatMenuButton.setAttribute("aria-expanded", "false");
        }
    });

    chatMenu.addEventListener("click", async (event) => {
        const item = event.target.closest("[data-chat-action]");
        if (!item) return;

        const action = item.dataset.chatAction;
        chatMenu.style.display = "none";
        chatMenuButton.setAttribute("aria-expanded", "false");

        if (action === "new") {
            newChatButton.click();
            return;
        }

        if (!activeChatId) {
            alert("Pehle chat mein message bhejo ya sidebar se saved chat kholo.");
            return;
        }

        if (action === "rename") {
            const firstUser = messages.find(m => m.role === "user");
            const currentTitle = activeChatTitle || firstUser?.content || "AI Chat";
            const newTitle = window.prompt("New chat name:", currentTitle);
            if (newTitle === null || !newTitle.trim()) return;

            if (typeof window.renameAIChatHistory !== "function") {
    alert("Rename is not ready yet. Please refresh the page and try again.");
    return;
}

const success = await window.renameAIChatHistory(activeChatId, newTitle);
            if (success) activeChatTitle = newTitle.trim().substring(0, 100);
            return;
        }

        if (action === "delete") {
            if (!window.confirm("Delete this chat permanently?")) return;

            const deletingId = activeChatId;
            const success = await window.deleteAIChatHistory?.(deletingId);
            if (success && activeChatId === deletingId) newChatButton.click();
        }
    });

    // RESTORE SAVED CHAT
    window.addEventListener("ai-content-agent:open-chat", (event) => {
        const detail = event.detail || {};
        if (!Array.isArray(detail.messages)) return;

        const restored = detail.messages
            .filter(m => m && (m.role === "user" || m.role === "assistant"))
            .map(m => ({ role: m.role, content: String(m.content ?? "") }));

        if (!restored.length) return;

        messages = restored;
        activeChatId = typeof detail.id === "string" ? detail.id : null;
        activeChatTitle = String(detail.title || restored.find(m => m.role === "user")?.content || "AI Chat");
        messagesBox.replaceChildren();

        messages.forEach(m => addMessage(m.role, m.content));

        panel.classList.remove("ai-sidebar-open");
        panel.classList.add("open");
        messagesBox.scrollTop = messagesBox.scrollHeight;
        input.value = "";
        input.focus();
    });

    function addTypingIndicator() {

        const message =
            document.createElement("div");

        message.className =
            "ai-chat-message assistant";

        message.id =
            "aiChatTypingMessage";

        message.innerHTML = `

            <div class="ai-chat-bubble">

                <div class="ai-chat-typing">

                    <span></span>
                    <span></span>
                    <span></span>

                </div>

            </div>
        `;


        messagesBox.appendChild(message);

        messagesBox.scrollTop =
            messagesBox.scrollHeight;
    }


    function removeTypingIndicator() {

        const typing =
            document.getElementById(
                "aiChatTypingMessage"
            );

        if (typing) {
            typing.remove();
        }
    }


    function addWebsitePlanSummary(plan, readyForApproval, status) {
        const card = document.createElement("section");
        card.style.cssText = "margin:12px 0;padding:14px;border:1px solid #dbe3f0;border-radius:12px;background:#f8faff;color:#172033;";

        const heading = document.createElement("strong");
        heading.textContent = "Website Plan Summary";
        card.appendChild(heading);

        const fields = [
            ["Purpose", plan.purpose],
            ["Target audience", plan.targetAudience],
            ["Pages", plan.pages],
            ["Sections", plan.sections],
            ["Design", plan.design],
            ["Content", plan.content],
            ["Features", plan.features],
            ["Admin panel", plan.adminPanel],
            ["Additional requirements", plan.additionalRequirements]
        ];

        fields.forEach(([label, value]) => {
            const normalized = Array.isArray(value)
                ? value.filter(Boolean).join(", ")
                : String(value || "").trim();
            if (!normalized) return;

            const row = document.createElement("p");
            row.style.cssText = "margin:8px 0 0;font-size:13px;line-height:1.5;";
            const strong = document.createElement("b");
            strong.textContent = label + ": ";
            const text = document.createElement("span");
            text.textContent = normalized;
            row.append(strong, text);
            card.appendChild(row);
        });

        const note = document.createElement("p");
        note.style.cssText = "margin:12px 0 0;color:#64748b;font-size:12px;";
        note.textContent = status === "approved"
            ? "Plan approved. You can now generate the website."
            : readyForApproval
                ? "Review the plan. Website generation will be available only after your approval."
                : "More details are needed. Continue the conversation to complete this plan.";
        card.appendChild(note);

        if (readyForApproval && status !== "approved") {
            const approveButton = document.createElement("button");
            approveButton.type = "button";
            approveButton.textContent = "Approve Website Plan";
            approveButton.style.cssText = "margin-top:12px;padding:10px 14px;border:0;border-radius:8px;background:#16834b;color:#fff;font-weight:600;cursor:pointer;";
            approveButton.addEventListener("click", async () => {
                approveButton.disabled = true;
                approveButton.textContent = "Approving...";
                try {
                    const result = await window.AIWebsitePlanning.approve(activeWebsitePlanId);
                    card.remove();
                    addMessage("assistant", result.message || "Website plan approved.");
                    addWebsitePlanSummary(plan, true, "approved");
                } catch (error) {
                    addMessage("assistant", error.message || "Plan approval failed.");
                    approveButton.disabled = false;
                    approveButton.textContent = "Approve Website Plan";
                }
            });
            card.appendChild(approveButton);
        } else if (status === "approved") {
            const generateButton = document.createElement("button");
            generateButton.type = "button";
            generateButton.textContent = "Generate Website";
            generateButton.style.cssText = "margin-top:12px;padding:10px 14px;border:0;border-radius:8px;background:#5268d8;color:#fff;font-weight:600;cursor:pointer;";
            generateButton.addEventListener("click", async () => {
                generateButton.disabled = true;
                generateButton.textContent = "Generating Website...";
                try {
                    const result = await window.AIWebsitePlanning.generate(activeWebsitePlanId);
                    addMessage("assistant", "Website generated and saved successfully: **" + (result.project?.title || "Website") + "**. Open Website Builder → My Websites to preview and edit it.");
                    window.AIWebsitePlanning.clearPlanId();
                    activeWebsitePlanId = "";
                } catch (error) {
                    addMessage("assistant", error.message || "Website generation failed.");
                    generateButton.disabled = false;
                    generateButton.textContent = "Generate Website";
                }
            });
            card.appendChild(generateButton);
        }

        messagesBox.appendChild(card);
        messagesBox.scrollTop = messagesBox.scrollHeight;
    }

    function isWebsiteCreationRequest(text) {
        const mentionsWebsite = /(website|web\s*site|landing\s*page|e-?commerce\s*site)/i.test(text);

        const asksToBuild =
            /(create|build|make|design|develop|want|need|banana|banani|banao|bnao|bnaani|chahiye|bana\s*do|taiyar\s*karo)/i.test(text);

        return mentionsWebsite && asksToBuild;
    }

    async function sendWebsitePlanningMessage(text) {
        if (!window.AIWebsitePlanning) {
            throw new Error("Website Planning module did not load. Refresh the page and try again.");
        }

        let planIdForRequest = activeWebsitePlanId;

        // A finished (locked) plan must not capture the chat. A new website request starts a fresh plan.
        if (websitePlanLocked && isWebsiteCreationRequest(text)) {
            window.AIWebsitePlanning.clearPlanId();
            activeWebsitePlanId = "";
            planIdForRequest = "";
            websitePlanLocked = false;
        }

        let result;
        try {
            result = await window.AIWebsitePlanning.chat(text, planIdForRequest);
        } catch (error) {
            if (planIdForRequest && /locked|cannot be edited/i.test(error.message || "")) {
                websitePlanLocked = true;
                return false; // not a planning conversation anymore: let normal chat answer
            }
            throw error;
        }

        activeWebsitePlanId = result.planId;
        window.AIWebsitePlanning.setPlanId(result.planId);

        addMessage("assistant", result.assistantMessage || "Let's refine your website requirements.");
        messages.push({ role: "assistant", content: result.assistantMessage || "" });

        if (result.plan) {
            addWebsitePlanSummary(result.plan, result.readyForApproval === true, "draft");
        }

        if (typeof window.saveAIChatHistory === "function") {
            const savedId = await window.saveAIChatHistory(messages, activeChatId);
            if (savedId) activeChatId = savedId;
        }

        return true;
    }

    // ==========================================
    // SEND MESSAGE
    // ==========================================

    async function sendMessage() {

        if (isSending) {
            return;
        }


        const text =
            input.value.trim();


        if (!text) {

            input.focus();

            return;
        }


        isSending = true;

        sendButton.disabled =
            true;

        input.disabled =
            true;


        const welcome =
            messagesBox.querySelector(
                ".ai-chat-welcome"
            );


        if (welcome) {
            welcome.remove();
        }


        addMessage(
            "user",
            text
        );


        messages.push({
            role: "user",
            content: text
        });


        input.value = "";

        input.style.height =
            "45px";


        addTypingIndicator();

        try {
            if ((activeWebsitePlanId && !websitePlanLocked) || isWebsiteCreationRequest(text)) {
                if ((await sendWebsitePlanningMessage(text)) !== false) {
                    removeTypingIndicator();
                    return;
                }
            }

            const imagePrompt = getImagePromptFromMessage(text);

            if (imagePrompt !== null) {
                const imageData = await generateImageInChat(imagePrompt);
                removeTypingIndicator();
                addGeneratedImageMessage(imageData, imagePrompt);

                messages.push({
                    role: "assistant",
                    content: "[Generated image] " + imagePrompt
                });

                if (typeof window.saveAIChatHistory === "function") {
                    const savedId = await window.saveAIChatHistory(messages, activeChatId);
                    if (savedId) activeChatId = savedId;
                }
                return;
            }


            const response =
                await fetch(
                    `${AI_CHAT_API_BASE_URL}/chat`,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify({
                                messages:
                                    messages,

                                language:
                                    "Hindi"
                            })
                    }
                );


            let data;


            try {

                data =
                    await response.json();

            } catch {

                throw new Error(
                    "Invalid response received from server."
                );
            }


            if (
                !response.ok ||
                !data.success
            ) {

                throw new Error(
                    data.error ||
                    "AI chat failed."
                );
            }


            const reply =
                data.reply || "";


            if (!reply.trim()) {

                throw new Error(
                    "AI returned an empty response."
                );
            }


            removeTypingIndicator();


            addMessage(
                "assistant",
                reply
            );


            messages.push({
                role:
                    "assistant",

                content:
                    reply
            });

            if (typeof window.saveAIChatHistory === "function") {
                const savedId = await window.saveAIChatHistory(
                    messages,
                    activeChatId
                );
                if (savedId) activeChatId = savedId;
            }


        } catch (error) {

            console.error(
                "AI Chat Error:",
                error
            );


            removeTypingIndicator();


            addMessage(
                "assistant",
                (error && error.message) ? error.message : "Sorry, kuch problem aa gayi. Please try again."
            );


        } finally {

            isSending =
                false;

            sendButton.disabled =
                false;

            input.disabled =
                false;

            input.focus();
        }
    }


    // ==========================================
    // SEND BUTTON
    // ==========================================

    sendButton.addEventListener(
        "click",
        sendMessage
    );


    // ==========================================
    // KEYBOARD
    // ==========================================

    input.addEventListener(
        "keydown",
        (event) => {

            if (
                event.key === "Enter" &&
                !event.shiftKey
            ) {

                event.preventDefault();

                sendMessage();
            }
        }
    );


    // ==========================================
    // AUTO RESIZE
    // ==========================================

    input.addEventListener(
        "input",
        () => {

            input.style.height =
                "45px";

            input.style.height =
                Math.min(
                    input.scrollHeight,
                    130
                ) + "px";
        }
    );


    console.log(
        "AI Chat loaded successfully."
    );
}