(function () {
    "use strict";

    let workspace = null;

    function openWebsiteBuilder() {
        if (workspace) return;

        const styles = document.createElement("style");
        styles.id = "websiteBuilderClientStyles";
        styles.textContent = `
            #websiteBuilderWorkspace {
                position: fixed;
                inset: 0;
                z-index: 99999;
                overflow-y: auto;
                background: #f7f9fc;
                color: #172033;
                font-family: inherit;
                padding: 28px;
                box-sizing: border-box;
            }
            .wb-topbar {
                display: flex;
                align-items: center;
                justify-content: space-between;
                max-width: 1100px;
                margin: 0 auto 55px;
            }
            .wb-title {
                font-size: 22px;
                font-weight: 700;
            }
            .wb-back {
                border: 1px solid #d8deea;
                background: #fff;
                color: #26344d;
                border-radius: 10px;
                padding: 11px 17px;
                cursor: pointer;
                font-size: 14px;
            }
            .wb-content {
                max-width: 760px;
                margin: 55px auto;
                text-align: center;
            }
            .wb-content h1 {
                font-size: clamp(30px, 5vw, 44px);
                margin: 0 0 14px;
                letter-spacing: -1px;
            }
            .wb-content p {
                color: #69758a;
                font-size: 16px;
                line-height: 1.7;
                margin: 0 auto;
                max-width: 570px;
            }
            .wb-form {
                margin: 32px auto 0;
                text-align: left;
                max-width: 700px;
            }
            .wb-label {
                display: block;
                font-size: 14px;
                font-weight: 650;
                margin-bottom: 10px;
            }
            .wb-prompt {
                width: 100%;
                min-height: 150px;
                resize: vertical;
                box-sizing: border-box;
                border: 1px solid #d8deea;
                border-radius: 14px;
                padding: 16px;
                font: inherit;
                font-size: 15px;
                line-height: 1.6;
                color: #172033;
                background: #fff;
                outline: none;
            }
            .wb-prompt:focus {
                border-color: #6479df;
                box-shadow: 0 0 0 3px rgba(100,121,223,.12);
            }
            .wb-hint {
                color: #7b8799;
                font-size: 13px;
                margin-top: 9px;
            }
            .wb-generate {
                display: block;
                width: 100%;
                margin-top: 20px;
                border: 0;
                border-radius: 12px;
                padding: 15px 20px;
                background: #5268d8;
                color: #fff;
                font-size: 15px;
                font-weight: 650;
                cursor: pointer;
            }
            .wb-generate:hover {
                background: #4056c5;
            }
            .wb-generate:disabled {
                opacity: .6;
                cursor: not-allowed;
            }
            .wb-message {
                min-height: 22px;
                margin-top: 13px;
                font-size: 14px;
                color: #b54747;
            }
            @media(max-width:600px) {
                #websiteBuilderWorkspace { padding: 18px; }
                .wb-topbar { margin-bottom: 35px; }
                .wb-content { margin-top: 40px; }
            }
        `;
        document.head.appendChild(styles);

        workspace = document.createElement("section");
        workspace.id = "websiteBuilderWorkspace";
        workspace.setAttribute("role", "dialog");
        workspace.setAttribute("aria-modal", "true");
        workspace.setAttribute("aria-label", "Website Builder");

        workspace.innerHTML = `
            <header class="wb-topbar">
                <div class="wb-title">Website Builder</div>
                <button type="button" class="wb-back" data-wb-back>
                    ← Back to Chat
                </button>
            </header>
            <main class="wb-content">
                <h1>Build your website with AI</h1>
                <p>
                    Describe the website you want to create.
                    Our AI will turn your idea into a website.
                </p>

                <form class="wb-form" data-wb-form>
                    <label class="wb-label" for="wbPrompt">
                        Describe your website
                    </label>
                    <textarea
                        id="wbPrompt"
                        class="wb-prompt"
                        maxlength="4000"
                        required
                        placeholder="Example: Create a modern coaching institute website with Home, About, Courses and Contact sections."
                    ></textarea>
                    <div class="wb-hint">
                        Be specific about your website type, sections, design and features. Maximum 4000 characters.
                    </div>
                    <button type="submit" class="wb-generate">
                        Generate Website
                    </button>
                    <div class="wb-message" data-wb-message role="status" aria-live="polite"></div>
                </form>
            </main>
        `;

        document.body.appendChild(workspace);

        workspace.querySelector("[data-wb-back]")
            .addEventListener("click", closeWebsiteBuilder);

        workspace.querySelector("[data-wb-form]")
            .addEventListener("submit", async function (event) {
                event.preventDefault();

                const prompt = workspace.querySelector("#wbPrompt").value.trim();
                const message = workspace.querySelector("[data-wb-message]");
                const button = workspace.querySelector(".wb-generate");

                if (!prompt) {
                    message.textContent = "Please describe the website you want to create.";
                    return;
                }

                button.disabled = true;
                button.textContent = "Generating Website...";
                message.style.color = "#5268d8";
                message.textContent = "Connecting to AI. Please wait...";

                try {
                    const [
                        firebaseApp,
                        firebaseAuth
                    ] = await Promise.all([
                        import("https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js"),
                        import("https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js")
                    ]);

                    const firebaseConfig = {
                        apiKey: "AIzaSyAF9-LEij0O7caT5I74f2UtfGDdc78JGqQ",
                        authDomain: "ai-content-agent-a9820.firebaseapp.com",
                        projectId: "ai-content-agent-a9820",
                        storageBucket: "ai-content-agent-a9820.firebasestorage.app",
                        messagingSenderId: "833284009437",
                        appId: "1:833284009437:web:91859542fb1f87ccdb9a34"
                    };

                    const app = firebaseApp.getApps().length
                        ? firebaseApp.getApp()
                        : firebaseApp.initializeApp(firebaseConfig);

                    const auth = firebaseAuth.getAuth(app);
                    const user = auth.currentUser;

                    if (!user) {
                        throw new Error("Please log in before generating a website.");
                    }

                    const token = await user.getIdToken();

                    message.textContent = "AI is generating your website...";

                    const response = await fetch(
                        "https://ai-content-agent-3hb3.onrender.com/api/websites/generate",
                        {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                                "Authorization": "Bearer " + token
                            },
                            body: JSON.stringify({ prompt })
                        }
                    );

                    const data = await response.json().catch(() => ({}));

                    if (!response.ok || !data.success) {
                        throw new Error(
                            data.message || "Website generation failed. Please try again."
                        );
                    }

                    if (!data.project || !data.project.files) {
                        throw new Error("Server response did not contain the generated website files.");
                    }

                    message.style.color = "#16834a";
                    message.textContent =
                        "Website generated and saved successfully: " +
                        (data.project.title || "Untitled Website");

                    const result = document.createElement("div");
                    result.style.cssText =
                        "margin-top:14px;padding:14px;background:#eaf7ef;border-radius:10px;color:#176b3a;font-size:14px;";
                    result.textContent =
                        "Project saved successfully. Project ID: " +
                        data.project.projectId;

                    const oldResult = workspace.querySelector("[data-wb-result]");
                    if (oldResult) oldResult.remove();

                    result.setAttribute("data-wb-result", "true");
                    message.insertAdjacentElement("afterend", result);

                } catch (error) {
                    console.error("Website Builder generation error:", error);
                    message.style.color = "#b54747";
                    message.textContent = error.message ||
                        "Something went wrong. Please try again.";
                } finally {
                    if (workspace) {
                        const currentButton = workspace.querySelector(".wb-generate");
                        if (currentButton) {
                            currentButton.disabled = false;
                            currentButton.textContent = "Generate Website";
                        }
                    }
                }
            });
document.addEventListener("keydown", handleEscape);
    }

    function closeWebsiteBuilder() {
        if (!workspace) return;

        workspace.remove();
        workspace = null;

        const styles = document.getElementById("websiteBuilderClientStyles");
        if (styles) styles.remove();

        document.removeEventListener("keydown", handleEscape);
    }

    function handleEscape(event) {
        if (event.key === "Escape") closeWebsiteBuilder();
    }

    document.addEventListener("ai:open-website-builder", openWebsiteBuilder);
})();
