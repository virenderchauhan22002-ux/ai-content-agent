const API_BASE_URL = "https://ai-content-agent-3hb3.onrender.com";

document.addEventListener("DOMContentLoaded", () => {
    const topicInput = document.getElementById("topicInput");
    const contentType = document.getElementById("contentType");
    const language = document.getElementById("language");
    const generateBtn = document.getElementById("generateBtn");
    const result = document.getElementById("result");

    const ideasTopic = document.getElementById("ideasTopic");
    const ideasLanguage = document.getElementById("ideasLanguage");
    const ideasCount = document.getElementById("ideasCount");
    const generateIdeasBtn = document.getElementById("generateIdeasBtn");
    const ideasResult = document.getElementById("ideasResult");

    const imagePrompt = document.getElementById("imagePrompt");
    const imageType = document.getElementById("imageType");
    const imageStyle = document.getElementById("imageStyle");
    const imageSize = document.getElementById("imageSize");
    const generateImageBtn = document.getElementById("generateImageBtn");
    const imageResult = document.getElementById("imageResult");

    let lastGeneratedText = "";
    let lastGeneratedData = null;

    /* =========================================================
       REMOVE OLD SEPARATE CONTENT CARDS
    ========================================================= */

    [
        "scriptsCard",
        "hooksCard",
        "captionsCard",
        "hashtagsCard",
        "ctaCard"
    ].forEach((id) => {
        const card = document.getElementById(id);

        if (card) {
            card.remove();
        }
    });

    /* =========================================================
       BUTTON HELPERS
    ========================================================= */

    function setButtonLoading(button, loadingText, originalText) {
        if (!button) return;

        button.disabled = true;

        button.dataset.originalText =
            originalText || button.textContent;

        button.textContent = loadingText;
        button.style.opacity = "0.7";
        button.style.cursor = "not-allowed";
    }

    function resetButton(button) {
        if (!button) return;

        button.disabled = false;

        const originalText =
            button.dataset.originalText || button.textContent;

        button.textContent = originalText;
        button.style.opacity = "1";
        button.style.cursor = "pointer";
    }

    /* =========================================================
       TEXT HELPERS
    ========================================================= */

    function escapeHTML(value) {
        if (value === null || value === undefined) {
            return "";
        }

        const div = document.createElement("div");
        div.textContent = String(value);

        return div.innerHTML;
    }

    function cleanText(text) {
        return String(text || "")
            .replace(/\r\n/g, "\n")
            .replace(/\r/g, "\n")
            .replace(/```[\s\S]*?```/g, "")
            .replace(/`/g, "")
            .trim();
    }

    /*
     * Removes markdown symbols without destroying Hindi text.
     */
    function removeMarkdown(text) {
        return cleanText(text)
            .replace(/\\\*\\\*([^*]+?)\\\*\\\*/g, "$1")
            .replace(/\*\*([^*]+?)\*\*/g, "$1")
            .replace(/__([^_]+?)__/g, "$1")
            .replace(/\\_/g, "_")
            .replace(/\\\*/g, "*")
            .replace(/^\s*#{1,6}\s*/gm, "")
            .replace(/^\s*[•*+]\s+/gm, "")
            .replace(/^\s*-\s+(?!\d)/gm, "")
            .replace(/^\s*[-=_]{3,}\s*$/gm, "")
            .trim();
    }

    /*
     * Clean a single content idea.
     */
    function cleanIdeaText(text) {
        let idea = String(text || "");

        idea = idea
            .replace(/\r\n/g, "\n")
            .replace(/\r/g, "\n")
            .replace(/```[\s\S]*?```/g, "")
            .replace(/\\\*\\\*/g, "")
            .replace(/\*\*/g, "")
            .replace(/__+/g, "")
            .replace(/^\s*[•*+\-]\s*/g, "")
            .replace(/^\s*\d+\s*[\.\):-]\s*/g, "")
            .replace(/^\s*\d+\s*$/g, "")
            .replace(
                /\s*(?:✨\s*)?use\s+this\s+idea\s*$/i,
                ""
            )
            .replace(
                /\s*(?:✨\s*)?इस\s+आइडिया\s+का\s+उपयोग\s+करें\s*$/i,
                ""
            )
            .replace(/\s{2,}/g, " ")
            .trim();

        return idea;
    }

    /* =========================================================
       COMPLETE CONTENT CLEANER
    ========================================================= */

    function cleanGeneratedContent(rawText) {
        let text = removeMarkdown(rawText);

        if (!text) {
            return "";
        }

        text = text.replace(
            /^\s*(?:AI\s*)?(?:generated\s*)?(?:content|answer)\s*[:\-]?\s*/i,
            ""
        );

        text = text.replace(
            /^\s*(?:1\.\s*)?(?:hook|hooks|हुक)\s*[:\-]?\s*/gim,
            "Hook:\n"
        );

        text = text.replace(
            /^\s*(?:2\.\s*)?(?:script|scripts|video script|स्क्रिप्ट)\s*[:\-]?\s*/gim,
            "Script:\n"
        );

        text = text.replace(
            /^\s*(?:3\.\s*)?(?:caption|captions|post caption|कैप्शन)\s*[:\-]?\s*/gim,
            "Caption:\n"
        );

        text = text.replace(
            /^\s*(?:4\.\s*)?(?:hashtags?|hash tags?|हैशटैग)\s*[:\-]?\s*/gim,
            "Hashtags:\n"
        );

        text = text.replace(
            /^\s*(?:5\.\s*)?(?:cta|call to action|कॉल टू एक्शन)\s*[:\-]?\s*/gim,
            "CTA:\n"
        );

        text = text.replace(/\n{3,}/g, "\n\n");

        return text.trim();
    }

    /* =========================================================
       SECTION EXTRACTION
    ========================================================= */

    function findSection(text, startNames, endNames) {
        const lines = text.split("\n");

        let started = false;
        const output = [];

        for (const rawLine of lines) {
            const line = rawLine.trim();

            if (!line) {
                if (started) {
                    output.push("");
                }

                continue;
            }

            const lower = line
                .replace(/^[\s#*_0-9.)-]+/, "")
                .trim()
                .toLowerCase();

            const isStart = startNames.some((name) =>
                lower === name ||
                lower.startsWith(name + ":") ||
                lower.startsWith(name + " -") ||
                lower.startsWith(name + " –")
            );

            if (isStart) {
                started = true;

                const colonIndex = line.indexOf(":");

                if (colonIndex !== -1) {
                    const sameLine = line
                        .slice(colonIndex + 1)
                        .trim();

                    if (sameLine) {
                        output.push(sameLine);
                    }
                }

                continue;
            }

            if (started) {
                const isEnd = endNames.some((name) =>
                    lower === name ||
                    lower.startsWith(name + ":") ||
                    lower.startsWith(name + " -") ||
                    lower.startsWith(name + " –")
                );

                if (isEnd) {
                    break;
                }

                output.push(rawLine);
            }
        }

        return output.join("\n").trim();
    }

    /* =========================================================
       HASHTAGS
    ========================================================= */

    function cleanHashtags(text, topic = "") {
        let source = String(text || "");

        /*
         * Remove markdown / unwanted symbols.
         */
        source = source
            .replace(/\\\*/g, "")
            .replace(/\*\*/g, "")
            .replace(/[`*_]/g, "")
            .replace(/\r\n/g, "\n");

        /*
         * Extract proper hashtag tokens.
         */
        const matches =
            source.match(
                /#[\p{L}\p{N}_]+/gu
            ) || [];

        const unique = [];
        const seen = new Set();

        matches.forEach((tag) => {
            let cleanTag = tag.trim();

            /*
             * Remove punctuation accidentally attached.
             */
            cleanTag = cleanTag.replace(
                /[.,!?;:।|()[\]{}]+$/g,
                ""
            );

            /*
             * Ignore broken 1-character hashtags.
             */
            const hashtagBody =
                cleanTag.replace(/^#/, "");

            if (
                !hashtagBody ||
                hashtagBody.length < 3
            ) {
                return;
            }

            /*
             * Ignore obvious markdown leftovers.
             */
            if (
                /^[0-9]+$/.test(hashtagBody)
            ) {
                return;
            }

            const key =
                cleanTag.toLowerCase();

            if (!seen.has(key)) {
                seen.add(key);
                unique.push(cleanTag);
            }
        });

        /*
         * If AI returned usable hashtags, use them.
         */
        if (unique.length >= 5) {
            return unique
                .slice(0, 25)
                .join(" ");
        }

        /*
         * Fallback: create simple hashtags from topic.
         * This prevents broken one/two-character tags.
         */
        const fallback = [];

        const topicWords =
            String(topic || "")
                .replace(
                    /[^\p{L}\p{N}\s]/gu,
                    " "
                )
                .split(/\s+/)
                .map((word) => word.trim())
                .filter(
                    (word) =>
                        word.length >= 3
                );

        topicWords.forEach((word) => {
            const tag = `#${word}`;

            const key =
                tag.toLowerCase();

            if (!seen.has(key)) {
                seen.add(key);
                fallback.push(tag);
            }
        });

        /*
         * Useful generic Hindi/English tags.
         */
        const commonTags = [
            "#बचत",
            "#निवेश",
            "#बीमा",
            "#जीवनबीमा",
            "#वित्तीययोजना",
            "#FinancialPlanning",
            "#Savings",
            "#Investment",
            "#LIC",
            "#MoneyManagement"
        ];

        commonTags.forEach((tag) => {
            const key =
                tag.toLowerCase();

            if (
                !seen.has(key) &&
                fallback.length < 20
            ) {
                seen.add(key);
                fallback.push(tag);
            }
        });

        return fallback
            .slice(0, 20)
            .join(" ");
    }

    /* =========================================================
       FINAL OUTPUT
    ========================================================= */

    function buildFinalOutput(rawText) {
        const text =
            cleanGeneratedContent(
                rawText
            );

        let hook = findSection(
            text,
            ["hook", "hooks", "हुक"],
            ["script", "caption", "hashtags", "cta"]
        );

        let script = findSection(
            text,
            ["script", "scripts", "video script", "स्क्रिप्ट"],
            ["caption", "hashtags", "cta"]
        );

        let caption = findSection(
            text,
            ["caption", "captions", "post caption", "कैप्शन"],
            ["hashtags", "cta"]
        );

        let hashtags = findSection(
            text,
            ["hashtags", "hash tags", "हैशटैग"],
            ["cta"]
        );

        let cta = findSection(
            text,
            ["cta", "call to action", "कॉल टू एक्शन"],
            []
        );

        if (
            !hook &&
            !script &&
            !caption &&
            !hashtags &&
            !cta
        ) {
            script = text;
        }

        const currentTopic =
            topicInput
                ? topicInput.value.trim()
                : "";

        hashtags = cleanHashtags(
            hashtags,
            currentTopic
        );

        if (script) {
            script = script
                .replace(
                    /#[\p{L}\p{N}_]+/gu,
                    ""
                )
                .trim();
        }

        if (caption) {
            caption = caption
                .replace(
                    /#[\p{L}\p{N}_]+/gu,
                    ""
                )
                .trim();
        }

        return {
            hook,
            script,
            caption,
            hashtags,
            cta
        };
    }

    function renderFinalOutput(rawText) {
        if (!result) return;

        lastGeneratedText =
            String(rawText || "");

        const data =
            buildFinalOutput(
                rawText
            );

        lastGeneratedData =
            data;

        let html = "";

        if (data.hook) {
            html += `
                <div style="margin-bottom:18px;">
                    <div style="
                        font-weight:800;
                        color:#102c57;
                        margin-bottom:7px;
                        font-size:16px;
                    ">
                        Hook
                    </div>

                    <div style="
                        color:#17304f;
                        line-height:1.65;
                    ">
                        ${escapeHTML(data.hook)}
                    </div>
                </div>
            `;
        }

        if (data.script) {
            html += `
                <div style="margin-bottom:18px;">
                    <div style="
                        font-weight:800;
                        color:#102c57;
                        margin-bottom:7px;
                        font-size:16px;
                    ">
                        Script
                    </div>

                    <div style="
                        color:#17304f;
                        line-height:1.65;
                        white-space:pre-line;
                    ">
                        ${escapeHTML(data.script)}
                    </div>
                </div>
            `;
        }

        if (data.caption) {
            html += `
                <div style="margin-bottom:18px;">
                    <div style="
                        font-weight:800;
                        color:#102c57;
                        margin-bottom:7px;
                        font-size:16px;
                    ">
                        Caption
                    </div>

                    <div style="
                        color:#17304f;
                        line-height:1.65;
                    ">
                        ${escapeHTML(data.caption)}
                    </div>
                </div>
            `;
        }

        if (data.hashtags) {
            html += `
                <div style="margin-bottom:18px;">
                    <div style="
                        font-weight:800;
                        color:#102c57;
                        margin-bottom:7px;
                        font-size:16px;
                    ">
                        Hashtags
                    </div>

                    <div style="
                        color:#1677ff;
                        line-height:2;
                        word-break:break-word;
                        font-weight:600;
                    ">
                        ${escapeHTML(data.hashtags)}
                    </div>
                </div>
            `;
        }

        if (data.cta) {
            html += `
                <div style="margin-bottom:8px;">
                    <div style="
                        font-weight:800;
                        color:#102c57;
                        margin-bottom:7px;
                        font-size:16px;
                    ">
                        CTA
                    </div>

                    <div style="
                        color:#17304f;
                        line-height:1.65;
                        white-space:pre-line;
                    ">
                        ${escapeHTML(data.cta)}
                    </div>
                </div>
            `;
        }

        if (!html.trim()) {
            html = `
                <div style="color:#d93025;">
                    AI ne usable content return nahi kiya.
                    Please try again.
                </div>
            `;
        }

        result.innerHTML = `
            <div
                class="ai-generated-content"
                id="aiGeneratedContent"
                style="
                    text-align:left;
                    word-break:break-word;
                "
            >
                ${html}
            </div>
        `;

        addResultActions();
    }

    /* =========================================================
       RESULT ACTIONS
    ========================================================= */

    function getReadableResultText() {
        if (!lastGeneratedData) {
            return lastGeneratedText || "";
        }

        const sections = [];

        if (lastGeneratedData.hook) {
            sections.push(
                "Hook:\n" +
                lastGeneratedData.hook
            );
        }

        if (lastGeneratedData.script) {
            sections.push(
                "Script:\n" +
                lastGeneratedData.script
            );
        }

        if (lastGeneratedData.caption) {
            sections.push(
                "Caption:\n" +
                lastGeneratedData.caption
            );
        }

        if (lastGeneratedData.hashtags) {
            sections.push(
                "Hashtags:\n" +
                lastGeneratedData.hashtags
            );
        }

        if (lastGeneratedData.cta) {
            sections.push(
                "CTA:\n" +
                lastGeneratedData.cta
            );
        }

        return sections
            .join("\n\n")
            .trim();
    }

    function addResultActions() {
        if (!result) return;

        const oldActions =
            document.getElementById(
                "aiResultActions"
            );

        if (oldActions) {
            oldActions.remove();
        }

        const actions =
            document.createElement("div");

        actions.id =
            "aiResultActions";

        actions.style.cssText = `
            display:flex;
            flex-wrap:wrap;
            gap:8px;
            margin-top:18px;
            padding-top:16px;
            border-top:1px solid rgba(16,44,87,0.10);
        `;

        actions.innerHTML = `
            <button
                type="button"
                id="copyResultBtn"
                style="
                    border:none;
                    border-radius:10px;
                    padding:10px 14px;
                    background:#eef5ff;
                    color:#1558a6;
                    font-weight:600;
                    cursor:pointer;
                "
            >
                📋 Copy
            </button>

            <button
                type="button"
                id="rewriteResultBtn"
                style="
                    border:none;
                    border-radius:10px;
                    padding:10px 14px;
                    background:#f1edff;
                    color:#5d3dbb;
                    font-weight:600;
                    cursor:pointer;
                "
            >
                ✨ Rewrite
            </button>

            <button
                type="button"
                id="regenerateResultBtn"
                style="
                    border:none;
                    border-radius:10px;
                    padding:10px 14px;
                    background:#eaf8f0;
                    color:#177245;
                    font-weight:600;
                    cursor:pointer;
                "
            >
                🔄 Regenerate
            </button>

            <button
                type="button"
                id="txtResultBtn"
                style="
                    border:none;
                    border-radius:10px;
                    padding:10px 14px;
                    background:#fff5e8;
                    color:#a45b00;
                    font-weight:600;
                    cursor:pointer;
                "
            >
                📄 TXT
            </button>

            <button
                type="button"
                id="pdfResultBtn"
                style="
                    border:none;
                    border-radius:10px;
                    padding:10px 14px;
                    background:#ffecec;
                    color:#b42318;
                    font-weight:600;
                    cursor:pointer;
                "
            >
                📑 PDF
            </button>
        `;

        result.appendChild(actions);

        document
            .getElementById("copyResultBtn")
            ?.addEventListener(
                "click",
                copyResult
            );

        document
            .getElementById("rewriteResultBtn")
            ?.addEventListener(
                "click",
                rewriteResult
            );

        document
            .getElementById("regenerateResultBtn")
            ?.addEventListener(
                "click",
                regenerateResult
            );

        document
            .getElementById("txtResultBtn")
            ?.addEventListener(
                "click",
                downloadTXT
            );

        document
            .getElementById("pdfResultBtn")
            ?.addEventListener(
                "click",
                downloadPDF
            );
    }

    /* =========================================================
       COPY
    ========================================================= */

    async function copyResult() {
        const text =
            getReadableResultText();

        if (!text) {
            alert(
                "Copy karne ke liye content available nahi hai."
            );
            return;
        }

        const button =
            document.getElementById(
                "copyResultBtn"
            );

        try {
            await navigator.clipboard.writeText(
                text
            );

            if (button) {
                const oldText =
                    button.textContent;

                button.textContent =
                    "✓ Copied";

                setTimeout(() => {
                    button.textContent =
                        oldText;
                }, 1500);
            }

        } catch (error) {
            console.error(
                "Copy Error:",
                error
            );

            const textarea =
                document.createElement(
                    "textarea"
                );

            textarea.value = text;

            document.body.appendChild(
                textarea
            );

            textarea.select();

            document.execCommand(
                "copy"
            );

            textarea.remove();

            if (button) {
                button.textContent =
                    "✓ Copied";

                setTimeout(() => {
                    button.textContent =
                        "📋 Copy";
                }, 1500);
            }
        }
    }

    /* =========================================================
       MAIN GENERATION REQUEST
    ========================================================= */

    async function generateContentRequest(
        prompt,
        selectedContentType,
        selectedLanguage
    ) {
        const response =
            await fetch(
                `${API_BASE_URL}/generate`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        topic: prompt,
                        contentType:
                            selectedContentType,
                        language:
                            selectedLanguage
                    })
                }
            );

        const responseText =
            await response.text();

        let data;

        try {
            data =
                JSON.parse(
                    responseText
                );
        } catch (error) {
            throw new Error(
                "Server ne valid response nahi diya. Please try again."
            );
        }

        if (
            !response.ok ||
            (
                data &&
                data.success === false
            )
        ) {
            throw new Error(
                data && data.error
                    ? data.error
                    : "Content generation failed."
            );
        }

        const generatedText =
            data &&
            (
                data.result ||
                data.content ||
                data.reply ||
                data.output ||
                data.text
            );

        if (
            !generatedText ||
            !String(generatedText).trim()
        ) {
            throw new Error(
                "AI returned an empty response."
            );
        }

        return String(
            generatedText
        );
    }

    /* =========================================================
       REGENERATE
    ========================================================= */

    async function regenerateResult() {
        if (!topicInput) return;

        const topic =
            topicInput.value.trim();

        const selectedContentType =
            contentType
                ? contentType.value
                : "Instagram Reel";

        const selectedLanguage =
            language
                ? language.value
                : "Hindi";

        if (!topic) {
            alert(
                "Pehle topic enter karein."
            );
            return;
        }

        const button =
            document.getElementById(
                "regenerateResultBtn"
            );

        setButtonLoading(
            button,
            "🔄 Generating...",
            "🔄 Regenerate"
        );

        try {
            const prompt =
                getMainPrompt(
                    topic,
                    selectedContentType,
                    selectedLanguage
                );

            const generatedText =
                await generateContentRequest(
                    prompt,
                    selectedContentType,
                    selectedLanguage
                );

            renderFinalOutput(
                generatedText
            );

        } catch (error) {
            console.error(
                "Regenerate Error:",
                error
            );

            showMessage(
                result,
                error.message ||
                    "Regeneration failed.",
                "error"
            );

        } finally {
            resetButton(
                button
            );
        }
    }

    /* =========================================================
       REWRITE
    ========================================================= */

    async function rewriteResult() {
        const currentText =
            getReadableResultText();

        if (!currentText) {
            alert(
                "Rewrite karne ke liye pehle content generate karein."
            );
            return;
        }

        const selectedContentType =
            contentType
                ? contentType.value
                : "Instagram Reel";

        const selectedLanguage =
            language
                ? language.value
                : "Hindi";

        const button =
            document.getElementById(
                "rewriteResultBtn"
            );

        setButtonLoading(
            button,
            "✨ Rewriting...",
            "✨ Rewrite"
        );

        if (result) {
            result.innerHTML = `
                <div style="
                    text-align:center;
                    padding:15px;
                ">
                    <div style="
                        font-size:24px;
                        margin-bottom:8px;
                    ">
                        ✨
                    </div>

                    <div>
                        Rewriting your content...
                    </div>
                </div>
            `;
        }

        try {
            const rewritePrompt = `
Rewrite the following social media content.

Make it:
- More natural
- More engaging
- More professional
- Easy to understand
- Better suited for social media
- Different from the original wording
- Same meaning
- Same language

Return ONLY these five sections in exactly this order:

Hook:
Write one improved attention-grabbing hook.

Script:
Rewrite and improve the complete script.

Caption:
Rewrite and improve the caption.

Hashtags:
Write 15 to 25 meaningful and relevant hashtags.

CTA:
Write 3 improved call-to-action lines.

STRICT HASHTAG RULES:
- Every hashtag must start with #.
- Each hashtag must be a COMPLETE meaningful word.
- Never split a Hindi word into separate characters or fragments.
- Never create hashtags such as #न, #ज, #भ, #व, #पर when they are incomplete fragments.
- Hindi hashtags must contain complete Hindi words.
- English hashtags must contain complete English words.
- Do not put spaces inside a hashtag.
- Do not use markdown.
- Do not number the hashtags.
- Do not write "Use This Idea" or any extra text.

OTHER RULES:
- Do not add any other sections.
- Do not add explanations.
- Do not use markdown symbols.
- Do not use code blocks.
- Keep the content in ${selectedLanguage}.

ORIGINAL CONTENT:

${currentText}
`;

            const generatedText =
                await generateContentRequest(
                    rewritePrompt,
                    selectedContentType,
                    selectedLanguage
                );

            renderFinalOutput(
                generatedText
            );

        } catch (error) {
            console.error(
                "Rewrite Error:",
                error
            );

            showMessage(
                result,
                error.message ||
                    "Rewrite failed.",
                "error"
            );

        } finally {
            resetButton(
                button
            );
        }
    }

    /* =========================================================
       TXT DOWNLOAD
    ========================================================= */

    function downloadTXT() {
        const text =
            getReadableResultText();

        if (!text) {
            alert(
                "Download karne ke liye content available nahi hai."
            );
            return;
        }

        try {
            const blob =
                new Blob(
                    [text],
                    {
                        type:
                            "text/plain;charset=utf-8"
                    }
                );

            const url =
                URL.createObjectURL(
                    blob
                );

            const link =
                document.createElement(
                    "a"
                );

            link.href = url;

            link.download =
                "ai-content-agent-content.txt";

            document.body.appendChild(
                link
            );

            link.click();

            document.body.removeChild(
                link
            );

            setTimeout(() => {
                URL.revokeObjectURL(
                    url
                );
            }, 1000);

        } catch (error) {
            console.error(
                "TXT Download Error:",
                error
            );

            alert(
                "TXT download failed. Please try again."
            );
        }
    }

    /* =========================================================
       PDF SUPPORT
    ========================================================= */

    function loadExternalScript(src) {
        return new Promise(
            (resolve, reject) => {
                const existing =
                    document.querySelector(
                        `script[src="${src}"]`
                    );

                if (existing) {
                    if (
                        existing.dataset.loaded ===
                        "true"
                    ) {
                        resolve();
                        return;
                    }

                    existing.addEventListener(
                        "load",
                        resolve,
                        {
                            once: true
                        }
                    );

                    existing.addEventListener(
                        "error",
                        reject,
                        {
                            once: true
                        }
                    );

                    return;
                }

                const script =
                    document.createElement(
                        "script"
                    );

                script.src = src;

                script.onload = () => {
                    script.dataset.loaded =
                        "true";

                    resolve();
                };

                script.onerror = () => {
                    reject(
                        new Error(
                            "PDF library load failed."
                        )
                    );
                };

                document.head.appendChild(
                    script
                );
            }
        );
    }

    async function downloadPDF() {
        const text =
            getReadableResultText();

        if (!text) {
            alert(
                "PDF banane ke liye content available nahi hai."
            );
            return;
        }

        const button =
            document.getElementById(
                "pdfResultBtn"
            );

        const originalText =
            button
                ? button.textContent
                : "📑 PDF";

        if (button) {
            button.disabled = true;
            button.textContent =
                "📑 Creating PDF...";
            button.style.opacity =
                "0.7";
        }

        try {
            await loadExternalScript(
                "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"
            );

            await loadExternalScript(
                "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"
            );

            if (
                typeof html2canvas ===
                "undefined"
            ) {
                throw new Error(
                    "PDF canvas library unavailable."
                );
            }

            if (
                !window.jspdf ||
                !window.jspdf.jsPDF
            ) {
                throw new Error(
                    "PDF library unavailable."
                );
            }

            const pdfContent =
                document.createElement(
                    "div"
                );

            pdfContent.style.position =
                "fixed";

            pdfContent.style.left =
                "-100000px";

            pdfContent.style.top =
                "0";

            pdfContent.style.width =
                "794px";

            pdfContent.style.padding =
                "45px";

            pdfContent.style.background =
                "#ffffff";

            pdfContent.style.color =
                "#17304f";

            pdfContent.style.fontFamily =
                "Arial, sans-serif";

            pdfContent.style.fontSize =
                "16px";

            pdfContent.style.lineHeight =
                "1.7";

            pdfContent.innerHTML = `
                <div style="
                    font-size:26px;
                    font-weight:700;
                    color:#102c57;
                    margin-bottom:8px;
                ">
                    AI Content Agent
                </div>

                <div style="
                    font-size:14px;
                    color:#667085;
                    margin-bottom:25px;
                ">
                    AI Generated Content
                </div>

                ${escapeHTML(text)
                    .replace(
                        /\n/g,
                        "<br>"
                    )}
            `;

            document.body.appendChild(
                pdfContent
            );

            const canvas =
                await html2canvas(
                    pdfContent,
                    {
                        scale:2,
                        backgroundColor:
                            "#ffffff",
                        useCORS:true
                    }
                );

            document.body.removeChild(
                pdfContent
            );

            const {
                jsPDF
            } = window.jspdf;

            const pdf =
                new jsPDF({
                    orientation:
                        "p",
                    unit:
                        "mm",
                    format:
                        "a4"
                });

            const pageWidth =
                pdf.internal.pageSize
                    .getWidth();

            const pageHeight =
                pdf.internal.pageSize
                    .getHeight();

            const margin =
                10;

            const usableWidth =
                pageWidth -
                margin * 2;

            const imageHeight =
                canvas.height *
                usableWidth /
                canvas.width;

            let remainingHeight =
                imageHeight;

            let position =
                margin;

            const imageData =
                canvas.toDataURL(
                    "image/jpeg",
                    0.92
                );

            pdf.addImage(
                imageData,
                "JPEG",
                margin,
                position,
                usableWidth,
                imageHeight
            );

            remainingHeight -=
                pageHeight -
                margin * 2;

            while (
                remainingHeight > 0
            ) {
                position =
                    margin -
                    (
                        imageHeight -
                        remainingHeight
                    );

                pdf.addPage();

                pdf.addImage(
                    imageData,
                    "JPEG",
                    margin,
                    position,
                    usableWidth,
                    imageHeight
                );

                remainingHeight -=
                    pageHeight -
                    margin * 2;
            }

            pdf.save(
                "ai-content-agent-content.pdf"
            );

        } catch (error) {
            console.error(
                "PDF Download Error:",
                error
            );

            try {
                const printWindow =
                    window.open(
                        "",
                        "_blank"
                    );

                if (!printWindow) {
                    throw new Error(
                        "Popup blocked."
                    );
                }

                printWindow.document.write(`
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <title>AI Content Agent</title>

                        <style>
                            body {
                                font-family:
                                    Arial,
                                    sans-serif;

                                padding:40px;

                                color:#17304f;

                                line-height:1.7;
                            }

                            h1 {
                                color:#102c57;
                            }

                            .content {
                                white-space:pre-wrap;
                            }

                            @media print {
                                body {
                                    padding:20px;
                                }
                            }
                        </style>
                    </head>

                    <body>
                        <h1>
                            AI Content Agent
                        </h1>

                        <div class="content">
                            ${escapeHTML(text)}
                        </div>
                    </body>
                    </html>
                `);

                printWindow.document.close();

                printWindow.focus();

                setTimeout(() => {
                    printWindow.print();
                }, 500);

            } catch (fallbackError) {
                console.error(
                    "PDF fallback error:",
                    fallbackError
                );

                alert(
                    "PDF download failed. Please try again."
                );
            }

        } finally {
            if (button) {
                button.disabled =
                    false;

                button.textContent =
                    originalText;

                button.style.opacity =
                    "1";
            }
        }
    }

    /* =========================================================
       ERROR MESSAGE
    ========================================================= */

    function showMessage(
        element,
        message,
        type = "normal"
    ) {
        if (!element) return;

        const color =
            type === "error"
                ? "#d93025"
                : type === "success"
                    ? "#188038"
                    : "";

        element.innerHTML = `
            <div style="
                ${color
                    ? `color:${color};`
                    : ""}
            ">
                ${escapeHTML(message)}
            </div>
        `;
    }

    /* =========================================================
       MAIN CONTENT PROMPT
    ========================================================= */

    function getMainPrompt(
        topic,
        selectedContentType,
        selectedLanguage
    ) {
        return `
Create complete social media content for this topic:

"${topic}"

Content type:
${selectedContentType}

Language:
${selectedLanguage}

Return ONLY these five sections in exactly this order:

Hook:
Write one strong attention-grabbing opening.

Script:
Write a useful, natural and engaging short-form video script.

Caption:
Write one clean social media caption.

Hashtags:
Write 15 to 25 meaningful and relevant hashtags.

CTA:
Write 3 strong call-to-action lines.

STRICT HASHTAG RULES:
- Every hashtag must start with #.
- Each hashtag must be a COMPLETE meaningful word.
- NEVER split a Hindi word into individual characters or fragments.
- NEVER generate broken hashtags such as #न, #ज, #भ, #व, #पर when they are incomplete.
- Use complete Hindi words such as #बचत, #निवेश, #जीवनबीमा, #भविष्य, #धनसंचय.
- English hashtags must also be complete words.
- Do not put spaces inside a hashtag.
- Do not number hashtags.
- Do not add symbols around hashtags.
- Do not repeat the same hashtag.

OTHER STRICT RULES:
- Do not add any other sections.
- Do not add explanations.
- Do not use markdown symbols.
- Do not use code blocks.
- Do not add extra headings.
- Keep the five section names exactly as shown.
- Keep the content in ${selectedLanguage}.
- Make the content practical and audience-friendly.
`;
    }

    /* =========================================================
       MAIN GENERATE BUTTON
    ========================================================= */

    if (generateBtn) {
        generateBtn.addEventListener(
            "click",
            async () => {
                const topic =
                    topicInput
                        ? topicInput.value.trim()
                        : "";

                const selectedContentType =
                    contentType
                        ? contentType.value
                        : "Instagram Reel";

                const selectedLanguage =
                    language
                        ? language.value
                        : "Hindi";

                if (!topic) {
                    showMessage(
                        result,
                        "Please enter a topic first.",
                        "error"
                    );

                    if (topicInput) {
                        topicInput.focus();
                    }

                    return;
                }

                setButtonLoading(
                    generateBtn,
                    "✨ Generating...",
                    "✨ Generate Content"
                );

                if (result) {
                    result.innerHTML = `
                        <div style="
                            text-align:center;
                            padding:15px;
                        ">
                            <div style="
                                font-size:24px;
                                margin-bottom:8px;
                            ">
                                ✨
                            </div>

                            <div>
                                Creating your complete content...
                            </div>
                        </div>
                    `;
                }

                try {
                    const prompt =
                        getMainPrompt(
                            topic,
                            selectedContentType,
                            selectedLanguage
                        );

                    const generatedText =
                        await generateContentRequest(
                            prompt,
                            selectedContentType,
                            selectedLanguage
                        );

                    renderFinalOutput(
                        generatedText
                    );

                } catch (error) {
                    console.error(
                        "Content Generation Error:",
                        error
                    );

                    let message =
                        error.message ||
                        "Something went wrong.";

                    if (
                        error.name ===
                        "TypeError"
                    ) {
                        message =
                            "Backend se connection nahi ho pa raha. Render server check karke 20 seconds baad try karein.";
                    }

                    showMessage(
                        result,
                        message,
                        "error"
                    );

                } finally {
                    resetButton(
                        generateBtn
                    );
                }
            }
        );
    }

    /* =========================================================
       CONTENT IDEAS
    ========================================================= */

    if (generateIdeasBtn) {
        generateIdeasBtn.addEventListener(
            "click",
            async () => {
                const topic =
                    ideasTopic
                        ? ideasTopic.value.trim()
                        : "";

                const selectedLanguage =
                    ideasLanguage
                        ? ideasLanguage.value
                        : "Hindi";

                const count =
                    ideasCount
                        ? parseInt(
                            ideasCount.value,
                            10
                        )
                        : 10;

                if (!topic) {
                    showMessage(
                        ideasResult,
                        "Please enter a topic first.",
                        "error"
                    );

                    if (ideasTopic) {
                        ideasTopic.focus();
                    }

                    return;
                }

                setButtonLoading(
                    generateIdeasBtn,
                    "✨ Generating...",
                    "✨ Generate Ideas"
                );

                if (ideasResult) {
                    ideasResult.innerHTML = `
                        <div style="
                            text-align:center;
                            padding:15px;
                        ">
                            💡 Generating fresh content ideas...
                        </div>
                    `;
                }

                try {
                    const response =
                        await fetch(
                            `${API_BASE_URL}/generate-ideas`,
                            {
                                method: "POST",

                                headers: {
                                    "Content-Type":
                                        "application/json"
                                },

                                body: JSON.stringify({
                                    topic,
                                    language:
                                        selectedLanguage,
                                    count
                                })
                            }
                        );

                    const responseText =
                        await response.text();

                    let data;

                    try {
                        data =
                            JSON.parse(
                                responseText
                            );
                    } catch (error) {
                        throw new Error(
                            "Ideas server response error."
                        );
                    }

                    if (
                        !response.ok ||
                        (
                            data &&
                            data.success === false
                        )
                    ) {
                        throw new Error(
                            data && data.error
                                ? data.error
                                : "Idea generation failed."
                        );
                    }

                    const ideas =
                        Array.isArray(
                            data.ideas
                        )
                            ? data.ideas
                            : Array.isArray(
                                data.result
                            )
                                ? data.result
                                : [];

                    if (!ideas.length) {
                        throw new Error(
                            "No ideas were generated. Please try again."
                        );
                    }

                    renderIdeas(
                        ideas
                    );

                } catch (error) {
                    console.error(
                        "Ideas Generation Error:",
                        error
                    );

                    showMessage(
                        ideasResult,
                        error.message ||
                            "Something went wrong while generating ideas.",
                        "error"
                    );

                } finally {
                    resetButton(
                        generateIdeasBtn
                    );
                }
            }
        );
    }

    function renderIdeas(ideas) {
        if (!ideasResult) return;

        ideasResult.innerHTML = "";

        ideas.forEach(
            (idea, index) => {
                const cleanedIdea =
                    cleanIdeaText(
                        idea
                    );

                if (!cleanedIdea) {
                    return;
                }

                const item =
                    document.createElement(
                        "div"
                    );

                item.className =
                    "idea-item";

                item.style.cssText = `
                    display:flex;
                    align-items:flex-start;
                    gap:12px;
                    margin-bottom:12px;
                    padding:14px;
                    border-radius:14px;
                    background:#f8fbff;
                    border:1px solid rgba(21,88,166,0.08);
                `;

                const number =
                    document.createElement(
                        "div"
                    );

                number.className =
                    "idea-number";

                number.textContent =
                    index + 1;

                number.style.cssText = `
                    min-width:30px;
                    height:30px;
                    display:flex;
                    align-items:center;
                    justify-content:center;
                    border-radius:50%;
                    background:#eaf3ff;
                    color:#1558a6;
                    font-weight:800;
                    font-size:14px;
                `;

                const content =
                    document.createElement(
                        "div"
                    );

                content.className =
                    "idea-content";

                content.style.cssText = `
                    flex:1;
                    min-width:0;
                `;

                const text =
                    document.createElement(
                        "div"
                    );

                text.className =
                    "idea-text";

                text.textContent =
                    cleanedIdea;

                text.style.cssText = `
                    color:#102c57;
                    font-weight:700;
                    font-size:15px;
                    line-height:1.55;
                    margin-bottom:10px;
                `;

                const useButton =
                    document.createElement(
                        "button"
                    );

                useButton.className =
                    "use-idea-btn";

                useButton.type =
                    "button";

                useButton.textContent =
                    "✨ Use This Idea";

                useButton.style.cssText = `
                    border:none;
                    border-radius:9px;
                    padding:8px 12px;
                    background:#eef5ff;
                    color:#1558a6;
                    font-weight:700;
                    cursor:pointer;
                `;

                useButton.addEventListener(
                    "click",
                    () => {
                        useIdea(
                            cleanedIdea,
                            useButton
                        );
                    }
                );

                content.appendChild(
                    text
                );

                content.appendChild(
                    useButton
                );

                item.appendChild(
                    number
                );

                item.appendChild(
                    content
                );

                ideasResult.appendChild(
                    item
                );
            }
        );
    }

    function useIdea(
        idea,
        button
    ) {
        if (!topicInput) return;

        topicInput.value =
            idea;

        topicInput.focus();

        window.scrollTo({
            top:
                Math.max(
                    0,
                    topicInput
                        .getBoundingClientRect()
                        .top +
                        window.scrollY -
                        120
                ),
            behavior:
                "smooth"
        });

        if (button) {
            const originalText =
                button.textContent;

            button.textContent =
                "✓ Added";

            button.disabled =
                true;

            setTimeout(
                () => {
                    button.textContent =
                        originalText;

                    button.disabled =
                        false;
                },
                1500
            );
        }
    }

    /* =========================================================
       IMAGE GENERATOR
    ========================================================= */

    if (generateImageBtn) {
        generateImageBtn.addEventListener(
            "click",
            async () => {
                const prompt =
                    imagePrompt
                        ? imagePrompt.value.trim()
                        : "";

                const selectedImageType =
                    imageType
                        ? imageType.value
                        : "Instagram Post";

                const selectedStyle =
                    imageStyle
                        ? imageStyle.value
                        : "Modern Premium";

                const selectedSize =
                    imageSize
                        ? imageSize.value
                        : "1K";

                if (!prompt) {
                    showMessage(
                        imageResult,
                        "Please enter an image prompt first.",
                        "error"
                    );

                    if (imagePrompt) {
                        imagePrompt.focus();
                    }

                    return;
                }

                setButtonLoading(
                    generateImageBtn,
                    "🎨 Generating Image...",
                    "✨ Generate Image"
                );

                if (imageResult) {
                    imageResult.innerHTML = `
                        <div class="image-placeholder">
                            <span>🎨</span>

                            <p>
                                Creating your image...
                            </p>
                        </div>
                    `;
                }

                try {
                    const response =
                        await fetch(
                            `${API_BASE_URL}/generate-image`,
                            {
                                method: "POST",

                                headers: {
                                    "Content-Type":
                                        "application/json"
                                },

                                body: JSON.stringify({
                                    prompt,
                                    imageType:
                                        selectedImageType,
                                    style:
                                        selectedStyle,
                                    imageSize:
                                        selectedSize
                                })
                            }
                        );

                    const responseText =
                        await response.text();

                    let data;

                    try {
                        data =
                            JSON.parse(
                                responseText
                            );
                    } catch (error) {
                        throw new Error(
                            "Image server se invalid response mila."
                        );
                    }

                    if (
                        !response.ok ||
                        (
                            data &&
                            data.success === false
                        )
                    ) {
                        throw new Error(
                            data && data.error
                                ? data.error
                                : "Image generation failed."
                        );
                    }

                    const imageData =
                        data &&
                        (
                            data.image ||
                            data.imageUrl ||
                            data.url
                        );

                    if (!imageData) {
                        throw new Error(
                            "No image was returned by the server."
                        );
                    }

                    renderGeneratedImage(
                        imageData
                    );

                } catch (error) {
                    console.error(
                        "Image Generation Error:",
                        error
                    );

                    showMessage(
                        imageResult,
                        error.message ||
                            "Something went wrong while generating the image.",
                        "error"
                    );

                } finally {
                    resetButton(
                        generateImageBtn
                    );
                }
            }
        );
    }

    function renderGeneratedImage(
        imageData
    ) {
        if (!imageResult) return;

        imageResult.innerHTML = "";

        const wrapper =
            document.createElement(
                "div"
            );

        wrapper.style.width =
            "100%";

        wrapper.style.textAlign =
            "center";

        const image =
            document.createElement(
                "img"
            );

        image.className =
            "generated-image";

        image.alt =
            "AI generated image";

        image.loading =
            "lazy";

        image.src =
            imageData;

        const downloadButton =
            document.createElement(
                "button"
            );

        downloadButton.type =
            "button";

        downloadButton.className =
            "download-image-btn";

        downloadButton.textContent =
            "⬇ Download Image";

        downloadButton.addEventListener(
            "click",
            () => {
                downloadImage(
                    imageData
                );
            }
        );

        wrapper.appendChild(
            image
        );

        wrapper.appendChild(
            downloadButton
        );

        imageResult.appendChild(
            wrapper
        );
    }

    function downloadImage(
        imageData
    ) {
        try {
            const link =
                document.createElement(
                    "a"
                );

            link.href =
                imageData;

            link.download =
                "ai-content-agent-image.png";

            document.body.appendChild(
                link
            );

            link.click();

            document.body.removeChild(
                link
            );

        } catch (error) {
            console.error(
                "Image Download Error:",
                error
            );

            alert(
                "Image download failed. Please try again."
            );
        }
    }

    /* =========================================================
       KEYBOARD SHORTCUTS
    ========================================================= */

    if (topicInput) {
        topicInput.addEventListener(
            "keydown",
            (event) => {
                if (
                    event.ctrlKey &&
                    event.key === "Enter"
                ) {
                    event.preventDefault();

                    if (generateBtn) {
                        generateBtn.click();
                    }
                }
            }
        );
    }

    if (ideasTopic) {
        ideasTopic.addEventListener(
            "keydown",
            (event) => {
                if (
                    event.ctrlKey &&
                    event.key === "Enter"
                ) {
                    event.preventDefault();

                    if (generateIdeasBtn) {
                        generateIdeasBtn.click();
                    }
                }
            }
        );
    }

    if (imagePrompt) {
        imagePrompt.addEventListener(
            "keydown",
            (event) => {
                if (
                    event.ctrlKey &&
                    event.key === "Enter"
                ) {
                    event.preventDefault();

                    if (generateImageBtn) {
                        generateImageBtn.click();
                    }
                }
            }
        );
    }

    console.log(
        "AI Content Agent main generator loaded successfully."
    );
});