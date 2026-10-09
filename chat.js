// ==========================================
// AI CHAT
// AI CONTENT AGENT
// ==========================================

// ==========================================
// RENDER BACKEND URL
// ==========================================

const API_BASE_URL =
    "https://ai-content-agent-3hb3.onrender.com";


document.addEventListener("DOMContentLoaded", () => {

    const appContent =
        document.getElementById("appContent");

    if (!appContent) {
        console.error(
            "AI Chat: appContent not found."
        );
        return;
    }


    // ==========================================
    // CHAT STYLES
    // ==========================================

    const style =
        document.createElement("style");

    style.textContent = `

        #aiChatLauncher {
            position: fixed;
            right: 22px;
            bottom: 22px;
            z-index: 9999;
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
            z-index: 9998;
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
            background: rgba(255,255,255,0.18);
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
            background: rgba(255,255,255,0.14);
            color: white;
            border-radius: 9px;
            padding: 8px 9px;
            cursor: pointer;
            font-size: 13px;
        }

        .ai-chat-header-btn:hover {
            background: rgba(255,255,255,0.24);
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


    // ==========================================
    // CREATE CHAT LAUNCHER
    // ==========================================

    const launcher =
        document.createElement("button");

    launcher.id = "aiChatLauncher";
    launcher.type = "button";
    launcher.innerHTML = "💬 AI Chat";

    document.body.appendChild(launcher);


    // ==========================================
    // CREATE CHAT PANEL
    // ==========================================

    const panel =
        document.createElement("div");

    panel.id = "aiChatPanel";

    panel.innerHTML = `

        <div class="ai-chat-header">

            <div class="ai-chat-header-left">

                <div class="ai-chat-avatar">
                    🤖
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
                    id="aiChatNewBtn"
                    title="New Chat">
                    ↻
                </button>

                <button
                    type="button"
                    class="ai-chat-header-btn"
                    id="aiChatCloseBtn"
                    title="Close">
                    ✕
                </button>

            </div>

        </div>


        <div id="aiChatMessages">

            <div class="ai-chat-welcome">

                <div class="ai-chat-welcome-icon">
                    🤖
                </div>

                <div class="ai-chat-welcome-title">
                    Hi! I'm your AI Assistant
                </div>

                <div class="ai-chat-welcome-text">
                    Normal baat karo, questions pucho,
                    ideas lo ya content banwao.
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
                    ➤
                </button>

            </div>

            <div class="ai-chat-hint">
                Enter = Send • Shift + Enter = New line
            </div>

        </div>
    `;

    document.body.appendChild(panel);


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
            "aiChatCloseBtn"
        );

    const newChatButton =
        document.getElementById(
            "aiChatNewBtn"
        );


    // ==========================================
    // LOGIN VISIBILITY
    // AI CHAT ONLY
    // ==========================================

    async function setupChatAuthVisibility() {

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
                apiKey: "AIzaSyAF9-LEijO0bI7OcaT5I74f2UtfGDdc78JGqQ",
                authDomain: "ai-content-agent-a9820.firebaseapp.com",
                projectId: "ai-content-agent-a9820",
                storageBucket: "ai-content-agent-a9820.firebasestorage.app",
                messagingSenderId: "833284009437",
                appId: "1:833284009437:web:91859542fb1f87ccdb9a34"
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

                        // Logged in → show AI Chat
                        launcher.style.display = "block";

                    } else {

                        // Logged out → hide AI Chat
                        launcher.style.display = "none";

                        // Also close the chat if it was open
                        panel.classList.remove("open");
                    }
                }
            );

        } catch (error) {

            console.error(
                "AI Chat Auth Visibility Error:",
                error
            );

            // Safe default:
            // hidden until authentication is confirmed
            launcher.style.display = "none";
            panel.classList.remove("open");
        }
    }


    setupChatAuthVisibility();


    // ==========================================
    // CHAT MEMORY
    // ==========================================

    let messages = [];

    let isSending = false;


    // ==========================================
    // OPEN / CLOSE
    // ==========================================

    launcher.addEventListener(
        "click",
        () => {

            panel.classList.toggle("open");

            if (panel.classList.contains("open")) {
                setTimeout(() => {
                    input.focus();
                }, 100);
            }
        }
    );


    closeButton.addEventListener(
        "click",
        () => {
            panel.classList.remove("open");
        }
    );


    // ==========================================
    // NEW CHAT
    // ==========================================

    newChatButton.addEventListener(
        "click",
        () => {

            messages = [];

            messagesBox.innerHTML = `

                <div class="ai-chat-welcome">

                    <div class="ai-chat-welcome-icon">
                        ✨
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
    // ADD MESSAGE TO UI
    // ==========================================

    function addMessage(
        role,
        content
    ) {

        const message =
            document.createElement("div");

        message.className =
            "ai-chat-message " +
            role;

        const bubble =
            document.createElement("div");

        bubble.className =
            "ai-chat-bubble";

        bubble.innerHTML =
            formatMessage(content);

        message.appendChild(bubble);

        messagesBox.appendChild(message);

        messagesBox.scrollTop =
            messagesBox.scrollHeight;

        return message;
    }


    // ==========================================
    // TYPING INDICATOR
    // ==========================================

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

        sendButton.disabled = true;

        input.disabled = true;


        // Remove welcome message
        const welcome =
            messagesBox.querySelector(
                ".ai-chat-welcome"
            );

        if (welcome) {
            welcome.remove();
        }


        // Add user message
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

            const response =
                await fetch(
                    `${API_BASE_URL}/chat`,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify({
                            messages: messages,
                            language: "Hindi"
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
                role: "assistant",
                content: reply
            });


        } catch (error) {

            console.error(
                "AI Chat Error:",
                error
            );

            removeTypingIndicator();


            addMessage(
                "assistant",
                "Sorry, kuch problem aa gayi. Please try again."
            );

        } finally {

            isSending = false;

            sendButton.disabled = false;

            input.disabled = false;

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
    // AUTO RESIZE INPUT
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
});