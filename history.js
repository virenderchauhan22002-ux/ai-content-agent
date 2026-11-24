import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, doc, deleteDoc, query, orderBy, limit, updateDoc } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyAF9-LEij0O7caT5I74f2UtfGDdc78JGqQ",
    authDomain: "ai-content-agent-a9820.firebaseapp.com",
    projectId: "ai-content-agent-a9820",
    storageBucket: "ai-content-agent-a9820.firebasestorage.app",
    messagingSenderId: "833284009437",
    appId: "1:833284009437:web:91859542fb1f87ccdb9a34"
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let currentUser = null;
let activeTab = "content";


function esc(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


async function copyText(text) {

    try {

        await navigator.clipboard.writeText(
            String(text ?? "")
        );

        alert("✅ Copied!");

    } catch (e) {

        const ta = document.createElement("textarea");

        ta.value = String(text ?? "");

        ta.style.position = "fixed";
        ta.style.left = "-9999px";

        document.body.appendChild(ta);

        ta.select();

        try {

            document.execCommand("copy");

            alert("✅ Copied!");

        } catch {

            alert("❌ Copy nahi ho paya.");

        }

        ta.remove();
    }
}


/* =========================================================
   LOGIN / LOGOUT VISIBILITY
========================================================= */

function setToolsVisibility() {

    const loggedIn = !!currentUser;

    const launcher =
        document.getElementById("historyLauncher");

    const panel =
        document.getElementById("historyPanel");


    if (launcher) {

        launcher.style.display =
            loggedIn ? "flex" : "none";

    }


    if (!loggedIn && panel) {

        panel.style.display = "none";

    }
}


onAuthStateChanged(auth, (user) => {

    currentUser = user;
    setToolsVisibility();
    loadSidebarChatHistory();

    if (
        user &&
        document.getElementById("historyPanel")?.style.display === "flex"
    ) {

        loadHistory();

    }

    console.log(
        "History auth:",
        user ? user.email : "No user"
    );

});


/* =========================================================
   SAVE CONTENT HISTORY
========================================================= */

async function saveContent(data) {

    if (
        !currentUser ||
        !data?.result
    ) {

        return;

    }


    try {

        await addDoc(
            collection(
                db,
                "users",
                currentUser.uid,
                "contentHistory"
            ),
            {
                topic: data.topic || "",

                contentType:
                    data.contentType || "",

                language:
                    data.language || "",

                result:
                    String(data.result),

                createdAt:
                    new Date().toISOString()
            }
        );


        refreshIfOpen();
    loadSidebarChatHistory();


    } catch (e) {

        console.error(
            "Content history save error:",
            e
        );

    }

}


/* =========================================================
   SAVE CHAT HISTORY
========================================================= */

async function saveChat(messages, existingId = null) {
    if (!currentUser || !Array.isArray(messages) || !messages.length) return null;

    const allMessages = messages
        .filter(m => m && (m.role === "user" || m.role === "assistant"))
        .map(m => ({ role: m.role, content: String(m.content ?? "") }));

    if (!allMessages.length) return null;

    try {
        let savedId = existingId;

        if (existingId) {
            await updateDoc(
                doc(db, "users", currentUser.uid, "chatHistory", existingId),
                {
                    messages: allMessages,
                    updatedAt: new Date().toISOString()
                }
            );
        } else {
            const savedRef = await addDoc(
                collection(db, "users", currentUser.uid, "chatHistory"),
                {
                    messages: allMessages,
                    title: String(allMessages.find(m => m.role === "user")?.content || "AI Chat").substring(0, 100),
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                }
            );
            savedId = savedRef.id;
        }

        refreshIfOpen();
        loadSidebarChatHistory();
        return savedId;
    } catch (e) {
        console.error("Chat history save error:", e);
        return null;
    }
}

window.saveAIChatHistory = saveChat;

window.renameAIChatHistory = async function (id, newTitle) {
    if (!currentUser || !id || typeof newTitle !== "string") return false;
    const title = newTitle.trim().substring(0, 100);
    if (!title) return false;

    try {
        await updateDoc(
            doc(db, "users", currentUser.uid, "chatHistory", id),
            { title, updatedAt: new Date().toISOString() }
        );
        await loadSidebarChatHistory();
        return true;
    } catch (error) {
        console.error("Rename chat error:", error);
        alert("Chat rename nahi ho paya.");
        return false;
    }
};

window.deleteAIChatHistory = async function (id) {
    if (!currentUser || !id) return false;

    try {
        await deleteDoc(doc(db, "users", currentUser.uid, "chatHistory", id));
        loadSidebarChatHistory();
        return true;
    } catch (error) {
        console.error("Menu delete chat error:", error);
        alert("Chat delete nahi ho paya.");
        return false;
    }
};

/* =========================================================
   FETCH INTERCEPTOR
========================================================= */

const realFetch =
    window.fetch.bind(window);


window.fetch = async function (...args) {

    const response =
        await realFetch(...args);


    try {

        const url =
            typeof args[0] === "string"
                ? args[0]
                : (args[0]?.url || "");


        const path =
            url.split("?")[0];


        const request =
            args[1] || {};


        let body = {};


        try {

            body =
                request.body
                    ? JSON.parse(request.body)
                    : {};

        } catch {

            body = {};

        }


        /* CONTENT GENERATOR */

        if (
            currentUser &&
            path.includes("/generate") &&
            !path.includes("/generate-ideas") &&
            !path.includes("/generate-image")
        ) {

            response
                .clone()
                .json()
                .then((data) => {

                    if (
                        data?.success &&
                        data.result
                    ) {

                        saveContent({

                            topic:
                                body.topic,

                            contentType:
                                body.contentType,

                            language:
                                body.language,

                            result:
                                data.result

                        });

                    }

                })
                .catch((e) => {

                    console.error(
                        "Generate history error:",
                        e
                    );

                });

        }


    } catch (e) {

        console.error(
            "History fetch watcher error:",
            e
        );

    }


    return response;

};


/* =========================================================
   CREATE HISTORY UI
========================================================= */

function createHistoryUI() {

    if (
        document.getElementById(
            "historyLauncher"
        )
    ) {

        return;

    }


    const style =
        document.createElement("style");


    style.textContent = `

        #historyLauncher {

            position: fixed;

            left: 20px;
            bottom: 20px;

            z-index: 9998;

            display: none;

            align-items: center;

            border: 0;

            border-radius: 999px;

            padding: 11px 17px;

            background: #111827;

            color: #fff;

            font-weight: 700;

            cursor: pointer;

            box-shadow:
                0 8px 25px rgba(0,0,0,.2);

        }


        #historyPanel {

            position: fixed;

            left: 20px;
            bottom: 70px;

            width:
                min(
                    440px,
                    calc(100vw - 40px)
                );

            max-height: 72vh;

            display: none;

            flex-direction: column;

            z-index: 9999;

            background: #fff;

            border:
                1px solid #e5e7eb;

            border-radius: 18px;

            box-shadow:
                0 20px 60px rgba(0,0,0,.22);

            overflow: hidden;

        }


        .historyHead {

            display: flex;

            justify-content:
                space-between;

            align-items: center;

            padding: 15px 17px;

            background: #f8fafc;

            border-bottom:
                1px solid #e5e7eb;

        }


        .historyHead strong {

            font-size: 17px;

        }


        .historyClose {

            border: 0;

            background: transparent;

            font-size: 23px;

            cursor: pointer;

        }


        .historyTabs {

            display: flex;

            gap: 8px;

            padding: 11px;

            border-bottom:
                1px solid #e5e7eb;

        }


        .historyTab {

            border: 0;

            border-radius: 9px;

            padding: 8px 12px;

            background: #f1f5f9;

            color: #475569;

            font-weight: 700;

            cursor: pointer;

        }


        .historyTab.active {

            background: #111827;

            color: #fff;

        }


        #historyList {

            overflow: auto;

            padding: 12px;

        }


        .historyEmpty {

            text-align: center;

            padding: 30px 12px;

            color: #64748b;

            font-size: 14px;

        }


        .historyCard {

            border:
                1px solid #e5e7eb;

            border-radius: 13px;

            padding: 13px;

            margin-bottom: 10px;

        }


        .historyTitle {

            font-weight: 700;

            color: #111827;

            word-break: break-word;

        }


        .historyMeta {

            font-size: 11px;

            color: #64748b;

            margin: 5px 0 10px;

        }


        .historyPreview {

            font-size: 13px;

            line-height: 1.5;

            color: #374151;

            white-space: pre-wrap;

            max-height: 100px;

            overflow: hidden;

            margin-bottom: 10px;

        }


        .historyActions {

            display: flex;

            gap: 7px;

            flex-wrap: wrap;

        }


        .historyAction {

            display: inline-flex !important;

            visibility: visible !important;

            opacity: 1 !important;

            border: 0;

            border-radius: 8px;

            padding: 7px 10px;

            background: #f1f5f9;

            color: #334155;

            font-weight: 700;

            font-size: 12px;

            cursor: pointer;

        }


        .historyAction.delete {

            background: #fee2e2;

            color: #b91c1c;

        }


        @media(max-width:600px) {

            #historyLauncher {

                left: 12px;

                bottom: 12px;

            }


            #historyPanel {

                left: 10px;

                bottom: 62px;

                width:
                    calc(100vw - 20px);

            }

        }

    `;


    document.head.appendChild(style);


    /* LAUNCHER */

    const launcher =
        document.createElement("button");


    launcher.id =
        "historyLauncher";


    launcher.type =
        "button";


    launcher.textContent =
        "🕘 History";


    /* PANEL */

    const panel =
        document.createElement("div");


    panel.id =
        "historyPanel";


    panel.innerHTML = `

        <div class="historyHead">

            <strong>
                🕘 History
            </strong>

            <button
                class="historyClose"
                id="historyClose"
                type="button"
            >
                ×
            </button>

        </div>


        <div class="historyTabs">

            <button
                class="historyTab active"
                id="contentHistoryTab"
                type="button"
            >
                📄 Content
            </button>


            <button
                class="historyTab"
                id="chatHistoryTab"
                type="button"
            >
                💬 Chat
            </button>

        </div>


        <div id="historyList">

            <div class="historyEmpty">
                Loading...
            </div>

        </div>

    `;


    // Floating History popup disabled. Chat history is displayed in the main sidebar.


    /* OPEN */

    launcher.addEventListener(
        "click",
        async () => {

            if (!currentUser) {
                return;
            }


            panel.style.display =
                panel.style.display === "flex"
                    ? "none"
                    : "flex";


            if (
                panel.style.display === "flex"
            ) {

                await loadHistory();

            }

        }
    );


    /* CLOSE */

    document
        .getElementById(
            "historyClose"
        )
        .addEventListener(
            "click",
            () => {

                panel.style.display =
                    "none";

            }
        );


    /* CONTENT TAB */

    document
        .getElementById(
            "contentHistoryTab"
        )
        .addEventListener(
            "click",
            async () => {

                activeTab =
                    "content";

                setActiveTab();

                await loadHistory();

            }
        );


    /* CHAT TAB */

    document
        .getElementById(
            "chatHistoryTab"
        )
        .addEventListener(
            "click",
            async () => {

                activeTab =
                    "chat";

                setActiveTab();

                await loadHistory();

            }
        );


    setToolsVisibility();

}


/* =========================================================
   ACTIVE TAB
========================================================= */

function setActiveTab() {

    document
        .getElementById(
            "contentHistoryTab"
        )
        ?.classList.toggle(
            "active",
            activeTab === "content"
        );


    document
        .getElementById(
            "chatHistoryTab"
        )
        ?.classList.toggle(
            "active",
            activeTab === "chat"
        );

}


/* =========================================================
   LOAD HISTORY
========================================================= */
// SIDEBAR CHAT HISTORY
let sidebarLoadSeq = 0;
async function loadSidebarChatHistory() {
    const seq = ++sidebarLoadSeq;
 const list = document.getElementById("aiChatHistoryList");
    if (!list) return;

    if (!currentUser) {
        list.textContent = "Please login to see your chats.";
        return;
    }

        if (!list.children.length) list.textContent = "Loading chats...";

    try {
        const q = query(
            collection(db, "users", currentUser.uid, "chatHistory"),
            orderBy("createdAt", "desc"),
            limit(100)
        );

                const snap = await getDocs(q);
        if (seq !== sidebarLoadSeq) return; // a newer refresh exists; drop this stale result
        list.replaceChildren();

        if (snap.empty) {
            list.textContent = "No previous chats yet.";
            return;
        }

        snap.docs.forEach((snapDoc) => {
            const data = snapDoc.data() || {};
            const messages = Array.isArray(data.messages) ? data.messages : [];
            const firstUser = messages.find(m => m?.role === "user");
            const title = String(data.title || firstUser?.content || "AI Chat");

            const row = document.createElement("div");
            row.style.cssText = "display:flex;align-items:center;gap:5px;margin:5px 0;";

            const openButton = document.createElement("button");
            openButton.type = "button";
            openButton.className = "ai-sidebar-history-item";
            openButton.textContent = title.substring(0, 65);
            openButton.title = title;
            openButton.style.cssText = "flex:1;min-width:0;text-align:left;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;";

            openButton.addEventListener("click", () => {
                window.dispatchEvent(new CustomEvent("ai-content-agent:open-chat", {
                    detail: { id: snapDoc.id, title, messages }
                }));
            });

            const deleteButton = document.createElement("button");
            deleteButton.type = "button";
            deleteButton.textContent = "×";
            deleteButton.title = "Delete chat";
            deleteButton.style.cssText = "flex:0 0 auto;width:auto;margin:0;";

            deleteButton.addEventListener("click", async () => {
                if (!confirm("Delete this saved chat?")) return;

                await deleteHistory("chatHistory", snapDoc.id);
                await loadSidebarChatHistory();
            });

            row.append(openButton, deleteButton);
            list.appendChild(row);
        });

    } catch (error) {
                if (seq !== sidebarLoadSeq) return;
        console.error("Sidebar chat history error:", error);
        list.textContent = "Could not load chat history.";
    }
}

window.addEventListener("ai-chat-sidebar-ready", loadSidebarChatHistory);

async function loadHistory() {

    const list =
        document.getElementById(
            "historyList"
        );


    if (!list) {
        return;
    }


    if (!currentUser) {

        list.innerHTML = `
            <div class="historyEmpty">
                Please login first.
            </div>
        `;

        return;

    }


    list.innerHTML = `
        <div class="historyEmpty">
            Loading...
        </div>
    `;


    try {

        const collectionName =
            activeTab === "content"
                ? "contentHistory"
                : "chatHistory";


        const q =
            query(
                collection(
                    db,
                    "users",
                    currentUser.uid,
                    collectionName
                ),
                orderBy(
                    "createdAt",
                    "desc"
                ),
                limit(100)
            );


        const snap =
            await getDocs(q);


        if (snap.empty) {

            list.innerHTML = `

                <div class="historyEmpty">

                    ${
                        activeTab === "content"
                            ? "📄 No content history yet."
                            : "💬 No chat history yet."
                    }

                </div>

            `;

            return;

        }


        list.innerHTML = "";


        snap.docs.forEach(
            (d) => {

                renderHistoryCard(
                    list,
                    d
                );

            }
        );


    } catch (e) {

        console.error(
            "History load error:",
            e
        );


        list.innerHTML = `

            <div class="historyEmpty">

                ❌ History load nahi ho paayi.

                <br><br>

                Check Firebase rules/connection.

            </div>

        `;

    }

}


/* =========================================================
   RENDER HISTORY CARD
========================================================= */

function renderHistoryCard(
    list,
    snapDoc
) {

    const data =
        snapDoc.data() || {};


    const card =
        document.createElement("div");


    card.className =
        "historyCard";


    /* CONTENT */

    if (
        activeTab === "content"
    ) {

        const content =
            String(
                data.result ||
                data.content ||
                ""
            );


        card.innerHTML = `

            <div class="historyTitle">

                ${esc(
                    data.topic ||
                    "Generated Content"
                )}

            </div>


            <div class="historyMeta">

                ${esc(
                    data.contentType ||
                    "Content"
                )}

                ${
                    data.language
                        ? " • " +
                          esc(
                              data.language
                          )
                        : ""
                }

                ${
                    data.createdAt
                        ? " • " +
                          esc(
                              new Date(
                                  data.createdAt
                              ).toLocaleString()
                          )
                        : ""
                }

            </div>


            <div class="historyPreview">

                ${esc(content)}

            </div>


            <div class="historyActions">

                <button
                    class="historyAction viewBtn"
                    type="button"
                >
                    👁 Open
                </button>


                <button
                    class="historyAction copyBtn"
                    type="button"
                >
                    📋 Copy
                </button>


                <button
                    class="historyAction delete deleteBtn"
                    type="button"
                >
                    🗑 Delete
                </button>

            </div>

        `;


        card
            .querySelector(
                ".viewBtn"
            )
            .addEventListener(
                "click",
                () => {

                    openViewer(
                        data.topic ||
                            "Generated Content",
                        content
                    );

                }
            );


        card
            .querySelector(
                ".copyBtn"
            )
            .addEventListener(
                "click",
                () => {

                    copyText(content);

                }
            );


        card
            .querySelector(
                ".deleteBtn"
            )
            .addEventListener(
                "click",
                async () => {

                    if (
                        !confirm(
                            "Delete this saved content?"
                        )
                    ) {

                        return;

                    }


                    await deleteHistory(
                        "contentHistory",
                        snapDoc.id
                    );


                    await loadHistory();

                }
            );

    }


    /* CHAT */

    else {

        const messages =
            Array.isArray(
                data.messages
            )
                ? data.messages
                : [];


        const firstUser =
            messages.find(
                (m) =>
                    m?.role === "user"
            );


        const title = String(data.title || firstUser?.content || "AI Chat");


        const preview =
            messages.length
                ? (
                    messages[
                        messages.length - 1
                    ]?.content || ""
                )
                : "";


        card.innerHTML = `

            <div class="historyTitle">

                💬 ${
                    esc(
                        String(title)
                            .substring(
                                0,
                                80
                            )
                    )
                }

            </div>


            <div class="historyMeta">

                ${
                    data.createdAt
                        ? esc(
                            new Date(
                                data.createdAt
                            ).toLocaleString()
                        )
                        : ""
                }

            </div>


            <div class="historyPreview">

                ${esc(preview)}

            </div>


            <div class="historyActions">

                <button
                    class="historyAction viewBtn"
                    type="button"
                >
                    👁 Open
                </button>


                <button
                    class="historyAction delete deleteBtn"
                    type="button"
                >
                    🗑 Delete
                </button>

            </div>

        `;


        card
            .querySelector(
                ".viewBtn"
            )
            .addEventListener(
                "click",
                () => {

                    openChatViewer(
                        title,
                        messages
                    );

                }
            );


        card
            .querySelector(
                ".deleteBtn"
            )
            .addEventListener(
                "click",
                async () => {

                    if (
                        !confirm(
                            "Delete this saved chat?"
                        )
                    ) {

                        return;

                    }


                    await deleteHistory(
                        "chatHistory",
                        snapDoc.id
                    );


                    await loadHistory();

                }
            );

    }


    list.appendChild(card);

}


/* =========================================================
   DELETE
========================================================= */

async function deleteHistory(
    collectionName,
    id
) {

    if (!currentUser) {
        return;
    }


    try {

        await deleteDoc(
            doc(
                db,
                "users",
                currentUser.uid,
                collectionName,
                id
            )
        );


    } catch (e) {

        console.error(
            "Delete history error:",
            e
        );


        alert(
            "❌ Delete nahi ho paya."
        );

    }

}


/* =========================================================
   CONTENT VIEWER
========================================================= */

function openViewer(
    title,
    content
) {

    const overlay =
        document.createElement(
            "div"
        );


    overlay.style.cssText =
        "position:fixed;inset:0;" +
        "z-index:10001;" +
        "background:rgba(0,0,0,.55);" +
        "display:flex;" +
        "align-items:center;" +
        "justify-content:center;" +
        "padding:20px";


    overlay.innerHTML = `

        <div style="
            background:#fff;
            width:min(700px,100%);
            max-height:85vh;
            overflow:auto;
            border-radius:18px;
            padding:22px;
        ">

            <div style="
                display:flex;
                justify-content:space-between;
                gap:10px;
            ">

                <strong
                    style="font-size:18px"
                >

                    ${esc(title)}

                </strong>


                <button
                    id="closeViewer"
                    style="
                        border:0;
                        background:#f1f5f9;
                        border-radius:8px;
                        padding:6px 10px;
                        cursor:pointer;
                        font-size:18px;
                    "
                >
                    ×
                </button>

            </div>


            <div style="
                margin-top:15px;
                white-space:pre-wrap;
                line-height:1.6;
                color:#374151;
            ">

                ${esc(content)}

            </div>

        </div>

    `;


    document.body.appendChild(
        overlay
    );


    overlay
        .querySelector(
            "#closeViewer"
        )
        .onclick = () =>
            overlay.remove();


    overlay.onclick =
        (e) => {

            if (
                e.target === overlay
            ) {

                overlay.remove();

            }

        };

}


/* =========================================================
   CHAT VIEWER
========================================================= */

function openChatViewer(
    title,
    messages
) {

    const overlay =
        document.createElement(
            "div"
        );


    overlay.style.cssText =
        "position:fixed;inset:0;" +
        "z-index:10001;" +
        "background:rgba(0,0,0,.55);" +
        "display:flex;" +
        "align-items:center;" +
        "justify-content:center;" +
        "padding:20px";


    const blocks =
        (messages || [])
            .map(
                (m) => `

                    <div
                        style="
                            margin-bottom:15px;
                        "
                    >

                        <strong>

                            ${
                                m?.role === "user"
                                    ? "You"
                                    : "AI"
                            }:

                        </strong>


                        <div style="
                            white-space:pre-wrap;
                            line-height:1.6;
                            margin-top:4px;
                        ">

                            ${esc(
                                m?.content ||
                                ""
                            )}

                        </div>

                    </div>

                `
            )
            .join("");


    overlay.innerHTML = `

        <div style="
            background:#fff;
            width:min(700px,100%);
            max-height:85vh;
            overflow:auto;
            border-radius:18px;
            padding:22px;
        ">

            <div style="
                display:flex;
                justify-content:space-between;
                gap:10px;
            ">

                <strong
                    style="font-size:18px"
                >

                    ${esc(
                        title ||
                        "AI Chat"
                    )}

                </strong>


                <button
                    id="closeViewer"
                    style="
                        border:0;
                        background:#f1f5f9;
                        border-radius:8px;
                        padding:6px 10px;
                        cursor:pointer;
                        font-size:18px;
                    "
                >
                    ×
                </button>

            </div>


            <div style="
                margin-top:18px;
            ">

                ${
                    blocks ||
                    "No messages found."
                }

            </div>

        </div>

    `;


    document.body.appendChild(
        overlay
    );


    overlay
        .querySelector(
            "#closeViewer"
        )
        .onclick = () =>
            overlay.remove();


    overlay.onclick =
        (e) => {

            if (
                e.target === overlay
            ) {

                overlay.remove();

            }

        };

}


/* =========================================================
   REFRESH
========================================================= */

function refreshIfOpen() {

    const panel =
        document.getElementById(
            "historyPanel"
        );


    if (
        panel?.style.display ===
        "flex"
    ) {

        loadHistory();

    }

}


/* =========================================================
   START
========================================================= */

function start() {
    createHistoryUI();
    setToolsVisibility();
    loadSidebarChatHistory();


    console.log(
        "AI Content Agent History loaded successfully."
    );

}


if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        start
    );

} else {

    start();

}