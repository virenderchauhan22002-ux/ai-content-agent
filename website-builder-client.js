(function () {
    "use strict";

    let workspace = null;

    function getWebsiteBuilderApiBase() {
        if (window.AIWebsitePlanning?.getApiBase) {
            return window.AIWebsitePlanning.getApiBase();
        }
        return (window.location.hostname === "localhost" ||
            window.location.hostname === "127.0.0.1")
            ? "http://localhost:3000"
            : "https://ai-content-agent-3hb3.onrender.com";
    }

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
                    â† Back to Chat
                </button>
            </header>
            <main class="wb-content">
                <h1>Build your website with AI</h1>
                <p>
                    Describe the website you want to create.
                    Our AI will turn your idea into a website.
                </p>

                <div style="max-width:700px;margin:0 auto 18px;text-align:right;">
                    <button type="button" data-wb-mywebsites
                        style="padding:11px 17px;border:1px solid #d8deea;border-radius:10px;background:#fff;color:#26344d;font-weight:600;cursor:pointer;">
                        My Websites
                    </button>
                </div>

                <section data-wb-projects hidden
                    style="max-width:700px;margin:0 auto 25px;padding:18px;background:#fff;border:1px solid #e1e6ef;border-radius:14px;text-align:left;">
                    <h2 style="margin:0 0 14px;font-size:19px;">My Saved Websites</h2>
                    <div data-wb-project-list style="display:grid;gap:12px;"></div>
                    <div data-wb-project-message style="margin-top:12px;font-size:14px;color:#69758a;" role="status"></div>
                </section>
                <div style="max-width:700px;margin:0 auto 18px;display:flex;gap:10px;flex-wrap:wrap;">
                    <button type="button" data-wb-open-planner
                        style="padding:11px 16px;border:0;border-radius:10px;background:#5268d8;color:#fff;font-weight:650;cursor:pointer;">
                        AI Planning & Consultation
                    </button>
                    <button type="button" data-wb-direct-mode
                        style="padding:11px 16px;border:1px solid #d8deea;border-radius:10px;background:#fff;color:#26344d;font-weight:600;cursor:pointer;">
                        Direct Generation
                    </button>
                </div>

                <section data-wb-planner hidden
                    style="max-width:700px;margin:0 auto 24px;padding:18px;background:#fff;border:1px solid #dce3ef;border-radius:14px;text-align:left;">
                    <h2 style="margin:0 0 6px;font-size:19px;">Website Planning & Consultation</h2>
                    <p style="margin:0 0 14px;color:#69758a;font-size:13px;line-height:1.5;">
                        Pehle requirements discuss karein. AI plan ready hone par summary dikhayega. Aapki approval ke baad hi website generate hogi.
                    </p>
                    <div data-wb-plan-messages aria-live="polite"
                        style="max-height:280px;overflow:auto;display:grid;gap:9px;margin-bottom:12px;"></div>
                    <textarea data-wb-plan-input maxlength="4000"
                        placeholder="Example: Mujhe bakery ke liye website chahiye..."
                        style="width:100%;min-height:82px;box-sizing:border-box;padding:12px;border:1px solid #d8deea;border-radius:10px;font:inherit;resize:vertical;"></textarea>
                    <button type="button" data-wb-plan-send
                        style="margin-top:9px;padding:11px 16px;border:0;border-radius:9px;background:#5268d8;color:#fff;font-weight:650;cursor:pointer;">
                        Send Message
                    </button>
                    <div data-wb-plan-status role="status" style="margin-top:10px;color:#69758a;font-size:13px;"></div>
                </section>

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
        workspace.querySelector("[data-wb-mywebsites]")
            .addEventListener("click", loadMyWebsites);
        workspace.querySelector("[data-wb-open-planner]")
            .addEventListener("click", function () {
                workspace.querySelector("[data-wb-planner]").hidden = false;
                workspace.querySelector("[data-wb-plan-input]").focus();
                restoreWebsitePlanningSession();
            });
        workspace.querySelector("[data-wb-direct-mode]")
            .addEventListener("click", function () {
                workspace.querySelector("[data-wb-form]").scrollIntoView({ behavior: "smooth", block: "center" });
                workspace.querySelector("#wbPrompt").focus();
            });
        workspace.querySelector("[data-wb-plan-send]")
            .addEventListener("click", sendWebsitePlanMessage);
        workspace.querySelector("[data-wb-plan-input]")
            .addEventListener("keydown", function (event) {
                if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    sendWebsitePlanMessage();
                }
            });

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
                        getWebsiteBuilderApiBase() + "/api/websites/generate",
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

                    // Show the generated website immediately instead of making the user hunt for it.
                    openWebsitePreview(data.project.title, data.project.files);

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
        restoreWebsitePlanningSession();
    }

    function addWebsitePlanChatMessage(role, text) {
        const messages = workspace?.querySelector("[data-wb-plan-messages]");
        if (!messages) return;

        const bubble = document.createElement("div");
        bubble.style.cssText = "padding:10px 12px;border-radius:10px;line-height:1.5;font-size:13px;white-space:pre-wrap;overflow-wrap:anywhere;" +
            (role === "user"
                ? "background:#eaf0ff;color:#253b75;margin-left:30px;"
                : "background:#f2f5f9;color:#26344d;margin-right:30px;");
        bubble.textContent = text;
        messages.appendChild(bubble);
        messages.scrollTop = messages.scrollHeight;
    }

    function renderWebsitePlanSummary(plan, readyForApproval, status) {
        const panel = workspace?.querySelector("[data-wb-plan-messages]");
        if (!panel) return;

        const card = document.createElement("div");
        card.style.cssText = "padding:13px;border:1px solid #dce3ef;border-radius:11px;background:#fbfcff;color:#172033;font-size:13px;";
        const heading = document.createElement("strong");
        heading.textContent = "Agreed Website Plan";
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
            row.style.cssText = "margin:7px 0 0;line-height:1.5;";
            const strong = document.createElement("b");
            strong.textContent = label + ": ";
            const content = document.createElement("span");
            content.textContent = normalized;
            row.append(strong, content);
            card.appendChild(row);
        });

        const note = document.createElement("p");
        note.style.cssText = "margin:10px 0 0;color:#64748b;font-size:12px;";
        note.textContent = status === "approved"
            ? "Plan approved. You can now generate the website."
            : readyForApproval
                ? "Review this summary. Generation will unlock after your approval."
                : "More details are needed. Continue the conversation.";
        card.appendChild(note);

        if (readyForApproval && status === "draft") {
            const approve = document.createElement("button");
            approve.type = "button";
            approve.textContent = "Approve Plan";
            approve.style.cssText = "margin-top:11px;padding:10px 14px;border:0;border-radius:8px;background:#16834b;color:#fff;font-weight:600;cursor:pointer;";
            approve.addEventListener("click", async function () {
                approve.disabled = true;
                approve.textContent = "Approving...";
                try {
                    const result = await window.AIWebsitePlanning.approve(window.AIWebsitePlanning.getPlanId());
                    card.remove();
                    addWebsitePlanChatMessage("assistant", result.message || "Plan approved.");
                    renderWebsitePlanSummary(plan, true, "approved");
                } catch (error) {
                    approve.disabled = false;
                    approve.textContent = "Approve Plan";
                    addWebsitePlanChatMessage("assistant", error.message || "Plan approval failed.");
                }
            });
            card.appendChild(approve);
        } else if (status === "approved") {
            const generate = document.createElement("button");
            generate.type = "button";
            generate.textContent = "Generate Website";
            generate.style.cssText = "margin-top:11px;padding:10px 14px;border:0;border-radius:8px;background:#5268d8;color:#fff;font-weight:600;cursor:pointer;";
            generate.addEventListener("click", async function () {
                generate.disabled = true;
                generate.textContent = "Generating...";
                const statusNode = workspace.querySelector("[data-wb-plan-status]");
                statusNode.textContent = "AI is generating your approved website...";
                try {
                    const result = await window.AIWebsitePlanning.generate(window.AIWebsitePlanning.getPlanId());
                    addWebsitePlanChatMessage("assistant", "Website generated and saved: " + (result.project?.title || "Website") + ". You can open it from My Websites.");
                    statusNode.textContent = "Website generated successfully. Project saved.";
                    window.AIWebsitePlanning.clearPlanId();
                    if (result.project && result.project.files) {
                        openWebsitePreview(result.project.title, result.project.files);
                    }
                    await loadMyWebsites();
                } catch (error) {
                    generate.disabled = false;
                    generate.textContent = "Generate Website";
                    statusNode.textContent = error.message || "Website generation failed.";
                }
            });
            card.appendChild(generate);
        }

        panel.appendChild(card);
        panel.scrollTop = panel.scrollHeight;
    }

    async function restoreWebsitePlanningSession() {
        if (!workspace || !window.AIWebsitePlanning) return;
        const planId = window.AIWebsitePlanning.getPlanId();
        if (!planId) return;

        const messages = workspace.querySelector("[data-wb-plan-messages]");
        if (messages.dataset.restoredPlanId === planId) return;

        try {
            const result = await window.AIWebsitePlanning.getPlan(planId);
            messages.dataset.restoredPlanId = planId;
            addWebsitePlanChatMessage("assistant", "Aapka previous planning session mil gaya. Yahin se continue kar sakte hain.");
            renderWebsitePlanSummary(result.plan || {}, result.readyForApproval, result.status);
            const input = workspace.querySelector("[data-wb-plan-input]");
            if (result.status === "generated") {
                workspace.querySelector("[data-wb-plan-status]").textContent =
                    "This plan has already generated a website. Open My Websites to view it.";
            }
        } catch (error) {
            if (/planning session not found/i.test(error.message || "")) {
                window.AIWebsitePlanning.clearPlanId();
            }
            workspace.querySelector("[data-wb-plan-status]").textContent =
                error.message || "Previous planning session could not be loaded.";
        }
    }

    async function sendWebsitePlanMessage() {
        if (!workspace) return;
        const input = workspace.querySelector("[data-wb-plan-input]");
        const send = workspace.querySelector("[data-wb-plan-send]");
        const status = workspace.querySelector("[data-wb-plan-status]");
        const message = input.value.trim();
        if (!message) {
            input.focus();
            return;
        }
        if (!window.AIWebsitePlanning) {
            status.textContent = "Website Planning module did not load. Refresh the page.";
            return;
        }

        input.value = "";
        send.disabled = true;
        send.textContent = "Sending...";
        status.textContent = "AI is reviewing your requirements...";
        addWebsitePlanChatMessage("user", message);

        try {
            const result = await window.AIWebsitePlanning.chat(
                message,
                window.AIWebsitePlanning.getPlanId()
            );
            window.AIWebsitePlanning.setPlanId(result.planId);
            addWebsitePlanChatMessage("assistant", result.assistantMessage || "Let's refine your requirements.");
            renderWebsitePlanSummary(result.plan || {}, result.readyForApproval === true, "draft");
            status.textContent = result.readyForApproval
                ? "Your plan is ready for review."
                : "Continue discussing the missing requirements.";
        } catch (error) {
            status.textContent = error.message || "Planning request failed.";
        } finally {
            send.disabled = false;
            send.textContent = "Send Message";
        }
    }

    async function getWebsiteBuilderToken() {
        const [firebaseApp, firebaseAuth] = await Promise.all([
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

        if (!auth.currentUser) {
            throw new Error("Please log in to view your saved websites.");
        }

        return await auth.currentUser.getIdToken();
    }

    function openWebsitePreview(title, files) {
        if (!workspace) return;

        const oldPreview = workspace.querySelector("[data-wb-preview]");
        if (oldPreview) oldPreview.remove();

        const overlay = document.createElement("section");
        overlay.setAttribute("data-wb-preview", "true");
        overlay.style.cssText =
            "position:fixed;inset:0;z-index:100001;background:#fff;display:flex;flex-direction:column;";

        const topbar = document.createElement("div");
        topbar.style.cssText =
            "height:58px;flex-shrink:0;display:flex;align-items:center;justify-content:space-between;padding:0 18px;background:#172033;color:#fff;";

        const heading = document.createElement("strong");
        heading.textContent = title || "Website Preview";

        const closeButton = document.createElement("button");
        closeButton.type = "button";
        closeButton.textContent = "Close Preview";
        closeButton.style.cssText =
            "padding:9px 14px;border:0;border-radius:8px;background:#fff;color:#172033;font-weight:600;cursor:pointer;";
        closeButton.addEventListener("click", function () {
            overlay.remove();
        });

        topbar.append(heading, closeButton);

        const frame = document.createElement("iframe");
        frame.title = "Generated Website Preview";
        frame.setAttribute("sandbox", "allow-scripts");
        frame.style.cssText = "width:100%;height:100%;border:0;background:#fff;";

        let html = files.html || "<!DOCTYPE html><html><head></head><body></body></html>";
        const css = String(files.css || "").replace(/<\/style/gi, "<\\/style");
        const js = String(files.js || "").replace(/<\/script/gi, "<\\/script");

        if (css) {
            const styleTag = "<style>" + css + "</style>";
            if (/<\/head>/i.test(html)) {
                html = html.replace(/<\/head>/i, styleTag + "</head>");
            } else {
                html = styleTag + html;
            }
        }

        if (js) {
            const scriptTag = "<script>" + js + "</script>";
            if (/<\/body>/i.test(html)) {
                html = html.replace(/<\/body>/i, scriptTag + "</body>");
            } else {
                html += scriptTag;
            }
        }

        frame.srcdoc = html;
        overlay.append(topbar, frame);
        workspace.appendChild(overlay);
    }
    async function openWebsiteEditor(projectId) {
        if (!workspace) return;

        const oldEditor = workspace.querySelector("[data-wb-editor]");
        if (oldEditor) oldEditor.remove();

        const editor = document.createElement("section");
        editor.setAttribute("data-wb-editor", "true");
        editor.style.cssText = "position:fixed;inset:0;z-index:100000;background:#f1f4f9;display:flex;flex-direction:column;overflow:hidden;";

        editor.innerHTML = `
            <header style="height:58px;flex-shrink:0;background:#172033;color:white;padding:0 18px;display:flex;align-items:center;justify-content:space-between;">
                <strong style="font-size:17px;">Website Builder Studio</strong>
                <button type="button" data-editor-close style="padding:9px 15px;border:0;border-radius:8px;cursor:pointer;font-weight:600;">Close Editor</button>
            </header>

            <div style="flex:1;min-height:0;display:grid;grid-template-columns:minmax(340px,44%) minmax(0,56%);">
                <div style="min-height:0;overflow:auto;padding:15px;background:#f1f4f9;">
                    <div style="background:white;border:1px solid #e0e5ed;border-radius:12px;padding:14px;margin-bottom:12px;">
                        <h3 style="margin:0 0 10px;font-size:16px;">AI Edit</h3>
                        <textarea data-ai-prompt placeholder="Example: Header red karo, button rounded karo..." style="width:100%;height:75px;box-sizing:border-box;padding:11px;border:1px solid #ccd3e0;border-radius:8px;resize:vertical;"></textarea>
                        <button type="button" data-ai-edit style="margin-top:9px;padding:11px 15px;background:#5268d8;color:white;border:0;border-radius:8px;font-weight:600;cursor:pointer;">Generate AI Changes</button>
                    </div>

                    <div style="background:white;border:1px solid #e0e5ed;border-radius:12px;padding:14px;">
                        <h3 style="margin:0 0 12px;font-size:16px;">Manual Code Editor</h3>
                        <div style="display:flex;gap:7px;margin-bottom:10px;">
                            <button type="button" data-tab="html" style="padding:8px 13px;border:0;border-radius:7px;background:#5268d8;color:white;cursor:pointer;">HTML</button>
                            <button type="button" data-tab="css" style="padding:8px 13px;border:0;border-radius:7px;background:#e8ecf4;color:#172033;cursor:pointer;">CSS</button>
                            <button type="button" data-tab="js" style="padding:8px 13px;border:0;border-radius:7px;background:#e8ecf4;color:#172033;cursor:pointer;">JS</button>
                        </div>
                        <textarea data-html-code spellcheck="false" style="width:100%;height:340px;box-sizing:border-box;padding:12px;border:1px solid #ccd3e0;border-radius:8px;font:13px/1.5 monospace;resize:vertical;"></textarea>
                        <textarea data-css-code spellcheck="false" hidden style="width:100%;height:340px;box-sizing:border-box;padding:12px;border:1px solid #ccd3e0;border-radius:8px;font:13px/1.5 monospace;resize:vertical;"></textarea>
                        <textarea data-js-code spellcheck="false" hidden style="width:100%;height:340px;box-sizing:border-box;padding:12px;border:1px solid #ccd3e0;border-radius:8px;font:13px/1.5 monospace;resize:vertical;"></textarea>
                    </div>

                    <div style="display:flex;gap:9px;flex-wrap:wrap;margin-top:12px;">
                        <button type="button" data-apply-save style="padding:12px 17px;background:#16834b;color:white;border:0;border-radius:8px;font-weight:600;cursor:pointer;">Apply & Save</button>
                    </div>
                    <div data-editor-status role="status" style="padding:12px 2px;color:#526078;font-size:13px;">Loading website...</div>
                </div>

                <div style="min-width:0;min-height:0;background:#fff;display:flex;flex-direction:column;border-left:1px solid #dce2eb;">
                    <div style="height:48px;flex-shrink:0;background:white;border-bottom:1px solid #e1e6ef;display:flex;align-items:center;justify-content:space-between;padding:0 14px;">
                        <strong style="font-size:14px;color:#172033;">Live Website Preview</strong>
                        <span style="font-size:12px;color:#16834b;">● Live</span>
                    </div>
                    <iframe data-live-frame title="Live website preview" sandbox="allow-scripts" style="width:100%;height:100%;flex:1;border:0;background:white;"></iframe>
                </div>
            </div>
        `;

        workspace.appendChild(editor);

        const status = editor.querySelector("[data-editor-status]");
        const aiButton = editor.querySelector("[data-ai-edit]");
        const saveButton = editor.querySelector("[data-apply-save]");
        const htmlInput = editor.querySelector("[data-html-code]");
        const cssInput = editor.querySelector("[data-css-code]");
        const jsInput = editor.querySelector("[data-js-code]");
        const promptInput = editor.querySelector("[data-ai-prompt]");
        const liveFrame = editor.querySelector("[data-live-frame]");

        let currentTitle = "Website";
        let currentFiles = null;
        let liveTimer = null;

        editor.querySelector("[data-editor-close]").addEventListener("click", function () {
            editor.remove();
        });

        function readDraft() {
            return {
                html: htmlInput.value,
                css: cssInput.value,
                js: jsInput.value
            };
        }

        function updateLivePreview() {
            const files = readDraft();

            if (!files.html.trim()) {
                status.textContent = "HTML cannot be empty.";
                return;
            }

            let html = files.html;
            const css = String(files.css || "").replace(/<\/style/gi, "<\\/style");
            const js = String(files.js || "").replace(/<\/script/gi, "<\\/script");

            if (css) {
                const styleTag = "<style>" + css + "</style>";
                if (/<\/head>/i.test(html)) {
                    html = html.replace(/<\/head>/i, styleTag + "</head>");
                } else {
                    html = styleTag + html;
                }
            }

            if (js) {
                const scriptTag = "<script>" + js + "</script>";
                if (/<\/body>/i.test(html)) {
                    html = html.replace(/<\/body>/i, scriptTag + "</body>");
                } else {
                    html += scriptTag;
                }
            }

            liveFrame.srcdoc = html;
        }

        function scheduleLivePreview() {
            clearTimeout(liveTimer);
            liveTimer = setTimeout(updateLivePreview, 350);
        }

        [htmlInput, cssInput, jsInput].forEach(function (input) {
            input.addEventListener("input", scheduleLivePreview);
        });

        editor.querySelectorAll("[data-tab]").forEach(function (button) {
            button.addEventListener("click", function () {
                const selected = button.getAttribute("data-tab");

                htmlInput.hidden = selected !== "html";
                cssInput.hidden = selected !== "css";
                jsInput.hidden = selected !== "js";

                editor.querySelectorAll("[data-tab]").forEach(function (tab) {
                    const active = tab === button;
                    tab.style.background = active ? "#5268d8" : "#e8ecf4";
                    tab.style.color = active ? "#fff" : "#172033";
                });
            });
        });

        try {
            const token = await getWebsiteBuilderToken();

            const response = await fetch(
                getWebsiteBuilderApiBase() + "/api/websites/" + encodeURIComponent(projectId),
                { headers: { "Authorization": "Bearer " + token } }
            );

            const data = await response.json().catch(() => ({}));

            if (!response.ok || !data.success || !data.project || !data.project.files) {
                throw new Error(data.message || "Could not load website.");
            }

            currentTitle = data.project.title || "Website";
            currentFiles = data.project.files;

            htmlInput.value = currentFiles.html || "";
            cssInput.value = currentFiles.css || "";
            jsInput.value = currentFiles.js || "";

            updateLivePreview();
            status.textContent = "Website loaded. Edit code or ask AI. Preview updates live.";
        } catch (error) {
            status.textContent = error.message || "Could not load website.";
            aiButton.disabled = true;
            saveButton.disabled = true;
            return;
        }

        aiButton.addEventListener("click", async function () {
            const prompt = promptInput.value.trim();

            if (!prompt) {
                status.textContent = "Please describe the changes you want.";
                return;
            }

            aiButton.disabled = true;
            aiButton.textContent = "Generating...";
            status.textContent = "AI is editing your website. Please wait...";

            try {
                const token = await getWebsiteBuilderToken();
                const response = await fetch(
                    getWebsiteBuilderApiBase() + "/api/websites/" + encodeURIComponent(projectId) + "/edit",
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": "Bearer " + token
                        },
                        body: JSON.stringify({ prompt: prompt })
                    }
                );

                const data = await response.json().catch(() => ({}));

                if (!response.ok || !data.success || !data.project || !data.project.files) {
                    throw new Error(data.message || "AI editing failed.");
                }

                currentTitle = data.project.title || currentTitle;
                currentFiles = data.project.files;

                htmlInput.value = currentFiles.html || "";
                cssInput.value = currentFiles.css || "";
                jsInput.value = currentFiles.js || "";

                updateLivePreview();
                status.textContent = "AI changes ready. Check the live preview before saving.";
            } catch (error) {
                status.textContent = error.message || "AI editing failed.";
            } finally {
                aiButton.disabled = false;
                aiButton.textContent = "Generate AI Changes";
            }
        });

        saveButton.addEventListener("click", async function () {
            const files = readDraft();

            if (!files.html.trim()) {
                status.textContent = "HTML cannot be empty.";
                return;
            }

            saveButton.disabled = true;
            saveButton.textContent = "Saving...";
            status.textContent = "Updating your existing website...";

            try {
                const token = await getWebsiteBuilderToken();
                const response = await fetch(
                    getWebsiteBuilderApiBase() + "/api/websites/" + encodeURIComponent(projectId),
                    {
                        method: "PUT",
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": "Bearer " + token
                        },
                        body: JSON.stringify({
                            title: currentTitle,
                            files: files
                        })
                    }
                );

                const data = await response.json().catch(() => ({}));

                if (!response.ok || !data.success) {
                    throw new Error(data.message || "Could not save website.");
                }

                currentFiles = files;
                status.textContent = "Website updated successfully. Existing project saved.";
            } catch (error) {
                status.textContent = error.message || "Website save failed.";
            } finally {
                saveButton.disabled = false;
                saveButton.textContent = "Apply & Save";
            }
        });
    }
    async function loadMyWebsites() {
        if (!workspace) return;

        const section = workspace.querySelector("[data-wb-projects]");
        const list = workspace.querySelector("[data-wb-project-list]");
        const status = workspace.querySelector("[data-wb-project-message]");

        section.hidden = false;
        list.replaceChildren();
        status.textContent = "Loading your saved websites...";

        try {
            const token = await getWebsiteBuilderToken();
            const response = await fetch(getWebsiteBuilderApiBase() + "/api/websites?refresh=" + Date.now(), {
    cache: "no-store",
                headers: { "Authorization": "Bearer " + token }
            });

            const data = await response.json().catch(() => ({}));

            if (!response.ok || !data.success) {
                throw new Error(data.message || "Could not load saved websites.");
            }

            const projects = Array.isArray(data.projects) ? data.projects : [];

            if (projects.length === 0) {
                status.textContent = "You have not saved any websites yet.";
                return;
            }

            status.textContent = projects.length + " saved website(s).";

            projects.forEach(function (project) {
                const card = document.createElement("div");
                card.style.cssText =
                    "padding:14px;border:1px solid #e1e6ef;border-radius:11px;background:#f9faff;";

                const title = document.createElement("div");
                title.style.cssText = "font-weight:650;color:#172033;font-size:15px;";
                title.textContent = project.title || "Untitled Website";

                const id = document.createElement("div");
                id.style.cssText = "margin-top:6px;color:#7b8799;font-size:12px;overflow-wrap:anywhere;";
                id.textContent = "Project ID: " + (project.projectId || "");

                card.append(title, id);

                const previewButton = document.createElement("button");
                previewButton.type = "button";
                previewButton.textContent = "Open Preview";
                previewButton.style.cssText =
                    "margin-top:12px;padding:10px 16px;border:0;border-radius:9px;background:#5268d8;color:#fff;font-weight:600;cursor:pointer;";

                previewButton.addEventListener("click", async function () {
                    previewButton.disabled = true;
                    previewButton.textContent = "Opening...";

                    try {
                        const token = await getWebsiteBuilderToken();
                        const response = await fetch(
                            getWebsiteBuilderApiBase() + "/api/websites/" +
                                encodeURIComponent(project.projectId),
                            { headers: { "Authorization": "Bearer " + token } }
                        );

                        const projectData = await response.json().catch(() => ({}));

                        if (!response.ok || !projectData.success || !projectData.project || !projectData.project.files) {
                            throw new Error(projectData.message || "Could not open this website.");
                        }

                        openWebsitePreview(projectData.project.title, projectData.project.files);
                    } catch (error) {
                        status.textContent = error.message || "Preview could not be opened.";
                    } finally {
                        previewButton.disabled = false;
                        previewButton.textContent = "Open Preview";
                    }
                });

                card.appendChild(previewButton);

                const editButton = document.createElement("button");
                editButton.type = "button";
                editButton.textContent = "Edit Website";
                editButton.style.cssText =
                    "margin:12px 0 0 8px;padding:10px 16px;border:0;border-radius:9px;background:#16834b;color:#fff;font-weight:600;cursor:pointer;";

                editButton.addEventListener("click", function () {
                    openWebsiteEditor(project.projectId);
                });

                card.appendChild(editButton);
                list.appendChild(card);
            });
        } catch (error) {
            console.error("My Websites error:", error);
            status.textContent = error.message || "Unable to load your websites.";
        }
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