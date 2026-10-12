```javascript
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

    const scriptsCard = document.getElementById("scriptsCard");
    const hooksCard = document.getElementById("hooksCard");
    const captionsCard = document.getElementById("captionsCard");
    const hashtagsCard = document.getElementById("hashtagsCard");
    const ctaCard = document.getElementById("ctaCard");

    let activeContentMode = "general";

    /* =========================================================
       BUTTON HELPERS
    ========================================================= */

    function setButtonLoading(button, loadingText, originalText) {
        if (!button) return;

        button.disabled = true;
        button.dataset.originalText = originalText || button.textContent;
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
       SECURITY / TEXT HELPERS
    ========================================================= */

    function escapeHTML(value) {
        if (value === null || value === undefined) return "";

        const div = document.createElement("div");
        div.textContent = String(value);

        return div.innerHTML;
    }

    function normalizeText(text) {
        return String(text || "")
            .replace(/\r\n/g, "\n")
            .replace(/\r/g, "\n")
            .replace(/\u00A0/g, " ")
            .trim();
    }

    function sanitizeMarkdown(rawText, preserveHashtags = false) {
        if (!rawText) return "";

        let text = normalizeText(rawText);

        text = text.replace(/```[\s\S]*?```/g, "");
        text = text.replace(/`([^`]+)`/g, "$1");
        text = text.replace(/`/g, "");

        text = text.replace(
            /^[ \t]*\\?[-—_*]{3,}[ \t]*$/gm,
            ""
        );

        text = text.replace(
            /\\([#*_`[\]()\-+!.]|[—–])/g,
            "$1"
        );

        text = text.replace(
            /^[ \t]*#{1,6}[ \t]*/gm,
            ""
        );

        text = text.replace(
            /\*\*\*([^*]+)\*\*\*/g,
            "$1"
        );

        text = text.replace(
            /\*\*([^*]+)\*\*/g,
            "$1"
        );

        text = text.replace(
            /__([^_]+)__/g,
            "$1"
        );

        text = text.replace(
            /\*([^*\n]+)\*/g,
            "$1"
        );

        text = text.replace(
            /_([^_\n]+)_/g,
            "$1"
        );

        text = text.replace(
            /[*_]{1,3}/g,
            ""
        );

        text = text.replace(
            /^[ \t]*[•*+–—][ \t]+/gm,
            ""
        );

        text = text.replace(
            /^[ \t]*-[ \t]+(?!\d)/gm,
            ""
        );

        if (!preserveHashtags) {
            text = text.replace(/#/g, "");
        }

        text = text.replace(/\n{3,}/g, "\n\n");

        return text.trim();
    }

    /* =========================================================
       SECTION DETECTION
    ========================================================= */

    function cleanHeaderLine(line) {
        return String(line || "")
            .replace(/^[\s>*•\-–—#`*_~📌📝💬📢🎯#️⃣]+/, "")
            .replace(/[`*_~]/g, "")
            .trim();
    }

    function isSectionHeader(line, section) {
        const normalized = cleanHeaderLine(line);

        const patterns = {
            scripts:
                /^(?:script|scripts|video script|स्क्रिप्ट)(?:\s*\([^)]*\))?\s*[:\-–]?\s*$/i,

            hooks:
                /^(?:hook|hooks|opening hooks|हुक|हुक्स)(?:\s*\([^)]*\))?\s*[:\-–]?\s*$/i,

            captions:
                /^(?:caption|captions|post caption|social media caption|कैप्शन)(?:\s*\([^)]*\))?\s*[:\-–]?\s*$/i,

            hashtags:
                /^(?:hashtags?|hash tags?|tags?|हैशटैग|टैग्स?)(?:\s*\([^)]*\))?\s*[:\-–]?\s*$/i,

            cta:
                /^(?:cta|call to action|कॉल टू एक्शन)(?:\s*\([^)]*\))?\s*[:\-–]?\s*$/i
        };

        return patterns[section]
            ? patterns[section].test(normalized)
            : false;
    }

    function isAnySectionHeader(line) {
        return (
            isSectionHeader(line, "scripts") ||
            isSectionHeader(line, "hooks") ||
            isSectionHeader(line, "captions") ||
            isSectionHeader(line, "hashtags") ||
            isSectionHeader(line, "cta")
        );
    }

    function extractSection(rawText, section) {
        const text = normalizeText(rawText);

        if (!text) return "";

        const lines = text.split("\n");

        let found = false;
        const output = [];

        for (const rawLine of lines) {
            const line = rawLine.trim();

            if (isSectionHeader(line, section)) {
                found = true;
                continue;
            }

            if (!found) continue;

            if (isAnySectionHeader(line)) {
                break;
            }

            output.push(rawLine);
        }

        return output.join("\n").trim();
    }

    /* =========================================================
       HASHTAGS
       ========================================================= */

    function extractHashtagsOnly(rawText) {
        if (!rawText) return "";

        const text = normalizeText(rawText);

        const matches =
            text.match(/#[\p{L}\p{N}_]+/gu) || [];

        const seen = new Set();
        const output = [];

        for (const tag of matches) {
            const cleanTag = tag
                .replace(/[*_`~\\]+$/g, "")
                .trim();

            if (!cleanTag) continue;

            const key = cleanTag.toLocaleLowerCase();

            if (!seen.has(key)) {
                seen.add(key);
                output.push(cleanTag);
            }

            if (output.length >= 25) break;
        }

        return output.join(" ");
    }

    /* =========================================================
       SCRIPT CLEANER
    ========================================================= */

    function cleanScriptsOutput(rawText) {
        if (!rawText) return "";

        let section = extractSection(rawText, "scripts");

        /*
         If AI did not create a Script heading, use the complete
         response but remove obvious unwanted sections.
        */
        if (!section) {
            section = normalizeText(rawText);

            const lines = section.split("\n");
            const filtered = [];

            for (const line of lines) {
                if (
                    isSectionHeader(line, "captions") ||
                    isSectionHeader(line, "hashtags") ||
                    isSectionHeader(line, "cta") ||
                    isSectionHeader(line, "hooks")
                ) {
                    break;
                }

                filtered.push(line);
            }

            section = filtered.join("\n");
        }

        let cleaned = sanitizeMarkdown(section, false);

        /*
         Remove accidental hashtag blocks.
        */
        cleaned = cleaned.replace(
            /(?:^|\n)\s*(?:hashtags?|हैशटैग|tags?)\s*[:\-–]?\s*(?:#[^\n]+)?/gi,
            ""
        );

        /*
         Remove accidental caption/CTA sections.
        */
        cleaned = cleaned.replace(
            /\n\s*(?:caption|captions|कैप्शन)\s*[:\-–][\s\S]*$/i,
            ""
        );

        cleaned = cleaned.replace(
            /\n\s*(?:cta|call to action|कॉल टू एक्शन)\s*[:\-–][\s\S]*$/i,
            ""
        );

        return cleaned
            .replace(/\n{3,}/g, "\n\n")
            .trim();
    }

    /* =========================================================
       HOOK CLEANER
    ========================================================= */

    function cleanHooksOutput(rawText) {
        if (!rawText) return "";

        let section = extractSection(rawText, "hooks");

        /*
         First preference:
         explicit Hooks section.
        */
        if (section) {
            const lines = section.split("\n");
            const hooks = [];

            for (const rawLine of lines) {
                const cleaned = sanitizeMarkdown(
                    rawLine,
                    false
                ).trim();

                if (!cleaned) continue;

                if (
                    isSectionHeader(cleaned, "scripts") ||
                    isSectionHeader(cleaned, "captions") ||
                    isSectionHeader(cleaned, "hashtags") ||
                    isSectionHeader(cleaned, "cta")
                ) {
                    break;
                }

                let hookText = cleaned.replace(
                    /^(?:hook\s*\d*[\s:.-]+|\d+[\).]\s*)/i,
                    ""
                ).trim();

                if (!hookText) continue;

                hooks.push(
                    `${hooks.length + 1}. ${hookText}`
                );

                if (hooks.length >= 7) break;
            }

            if (hooks.length) {
                return hooks.join("\n");
            }
        }

        /*
         Second preference:
         Find Hook 1 / Hook 2 / numbered hooks.
        */
        const lines = normalizeText(rawText).split("\n");
        const hooks = [];

        for (const rawLine of lines) {
            const cleaned = sanitizeMarkdown(
                rawLine,
                false
            ).trim();

            if (!cleaned) continue;

            if (
                /^(?:caption|captions|hashtags?|हैशटैग|cta|call to action|script|скрип्ट|स्क्रिप्ट)/i.test(
                    cleaned
                )
            ) {
                continue;
            }

            const match = cleaned.match(
                /^(?:Hook\s*\d*[\s:.-]+|\d+[\).]\s+)(.+)$/i
            );

            if (!match) continue;

            const hookText = match[1].trim();

            if (!hookText) continue;

            hooks.push(
                `${hooks.length + 1}. ${hookText}`
            );

            if (hooks.length >= 7) break;
        }

        return hooks.join("\n").trim();
    }

    /* =========================================================
       CAPTION CLEANER
    ========================================================= */

    function cleanCaptionsOutput(rawText) {
        if (!rawText) return "";

        let section = extractSection(
            rawText,
            "captions"
        );

        /*
         If Caption heading exists, only that block is returned.
        */
        if (section) {
            section = sanitizeMarkdown(
                section,
                false
            );

            section = section.replace(
                /\n\s*(?:hashtags?|हैशटैग|tags?|cta|call to action|कॉल टू एक्शन)\s*[:\-–][\s\S]*$/i,
                ""
            );

            section = section.replace(
                /(?:\s*#[\p{L}\p{N}_]+){2,}\s*$/gu,
                ""
            );

            return section.trim();
        }

        /*
         No heading:
         remove obvious unwanted sections.
        */
        let cleaned = normalizeText(rawText);

        cleaned = cleaned.replace(
            /(?:^|\n)\s*(?:hashtags?|हैशटैग|tags?)\s*[:\-–][\s\S]*$/i,
            ""
        );

        cleaned = cleaned.replace(
            /(?:^|\n)\s*(?:cta|call to action|कॉल टू एक्शन)\s*[:\-–][\s\S]*$/i,
            ""
        );

        cleaned = cleaned.replace(
            /(?:^|\n)\s*(?:script|scripts|स्क्रिप्ट)\s*[:\-–][\s\S]*$/i,
            ""
        );

        cleaned = cleaned.replace(
            /(?:\s*#[\p{L}\p{N}_]+){2,}\s*$/gu,
            ""
        );

        return sanitizeMarkdown(
            cleaned,
            false
        ).trim();
    }

    /* =========================================================
       CTA CLEANER
    ========================================================= */

    function cleanCTAOutput(rawText) {
        if (!rawText) return "";

        let section = extractSection(
            rawText,
            "cta"
        );

        if (section) {
            const lines = section.split("\n");
            const ctas = [];

            for (const rawLine of lines) {
                const cleaned = sanitizeMarkdown(
                    rawLine,
                    false
                ).trim();

                if (!cleaned) continue;

                let ctaText = cleaned.replace(
                    /^(?:CTA\s*\d*[\s:.-]+|\d+[\).]\s*)/i,
                    ""
                ).trim();

                if (!ctaText) continue;

                if (
                    /^(?:script|body|outro|caption|captions|hashtags?|hook|hooks)/i.test(
                        ctaText
                    )
                ) {
                    continue;
                }

                ctas.push(
                    `${ctas.length + 1}. ${ctaText}`
                );

                if (ctas.length >= 7) break;
            }

            if (ctas.length) {
                return ctas.join("\n");
            }
        }

        /*
         Fallback for numbered CTA output.
        */
        const lines = normalizeText(rawText).split("\n");
        const ctas = [];

        for (const rawLine of lines) {
            const cleaned = sanitizeMarkdown(
                rawLine,
                false
            ).trim();

            if (!cleaned) continue;

            if (
                /^(?:script|body|outro|caption|captions|hashtags?|hook|hooks)/i.test(
                    cleaned
                )
            ) {
                continue;
            }

            const match = cleaned.match(
                /^(?:CTA\s*\d*[\s:.-]+|\d+[\).]\s+)(.+)$/i
            );

            if (!match) continue;

            const ctaText = match[1].trim();

            if (!ctaText) continue;

            ctas.push(
                `${ctas.length + 1}. ${ctaText}`
            );

            if (ctas.length >= 7) break;
        }

        return ctas.join("\n").trim();
    }

    /* =========================================================
       MAIN MODE CLEANER
    ========================================================= */

    function cleanAIOutputByMode(rawText, mode) {
        if (!rawText) return "";

        switch (mode) {
            case "scripts":
                return cleanScriptsOutput(rawText);

            case "hooks":
                return cleanHooksOutput(rawText);

            case "captions":
                return cleanCaptionsOutput(rawText);

            case "hashtags":
                return extractHashtagsOnly(rawText);

            case "cta":
                return cleanCTAOutput(rawText);

            default:
                return sanitizeMarkdown(
                    rawText,
                    false
                );
        }
    }

    /* =========================================================
       OUTPUT FORMATTER
    ========================================================= */

    function formatAIText(text, mode = "general") {
        if (!text) return "";

        const processed = cleanAIOutputByMode(
            text,
            mode
        );

        if (mode === "hashtags") {
            const safeTags = escapeHTML(processed);

            if (!safeTags.trim()) {
                return `
                    <p style="color:#d93025;margin:8px 0;">
                        No valid hashtags found. Please try generating again.
                    </p>
                `;
            }

            return `
                <div
                    class="ai-hashtags-output"
                    style="
                        line-height:2;
                        font-size:15px;
                        color:#1677ff;
                        word-wrap:break-word;
                        white-space:normal;
                        padding:6px 2px;
                    "
                >
                    ${safeTags}
                </div>
            `;
        }

        if (
            (
                mode === "hooks" ||
                mode === "cta"
            ) &&
            !processed.trim()
        ) {
            return `
                <p style="color:#d93025;margin:8px 0;">
                    No valid ${mode.toUpperCase()} lines found.
                    Please try generating again.
                </p>
            `;
        }

        if (
            mode === "scripts" &&
            !processed.trim()
        ) {
            return `
                <p style="color:#d93025;margin:8px 0;">
                    No valid script was generated.
                    Please try again.
                </p>
            `;
        }

        if (
            mode === "captions" &&
            !processed.trim()
        ) {
            return `
                <p style="color:#d93025;margin:8px 0;">
                    No valid caption was generated.
                    Please try again.
                </p>
            `;
        }

        const lines = processed.split("\n");

        let htmlOutput = "";

        lines.forEach(line => {
            const trimmed = line.trim();

            if (!trimmed) {
                htmlOutput +=
                    '<div style="margin:8px 0;"></div>';
                return;
            }

            const safeLine = escapeHTML(trimmed);

            if (
                /^(?:Hook|Body|Outro|Main Script|Target Duration|Topic|हुक|बॉडी|आउट्रो)[\s:-]/i.test(
                    trimmed
                )
            ) {
                htmlOutput += `
                    <p style="
                        margin:10px 0 4px;
                        font-weight:700;
                        color:#102c57;
                        line-height:1.6;
                    ">
                        ${safeLine}
                    </p>
                `;
            } else if (
                /^\d+[\).]\s*/.test(trimmed)
            ) {
                htmlOutput += `
                    <p style="
                        margin:4px 0 6px;
                        line-height:1.6;
                        color:#17304f;
                    ">
                        ${safeLine}
                    </p>
                `;
            } else {
                htmlOutput += `
                    <p style="
                        margin:4px 0 8px;
                        line-height:1.65;
                        color:#17304f;
                    ">
                        ${safeLine}
                    </p>
                `;
            }
        });

        return `
            <div
                class="ai-clean-output"
                style="
                    text-align:left;
                    word-break:break-word;
                "
            >
                ${htmlOutput}
            </div>
        `;
    }

    /* =========================================================
       MESSAGE
    ========================================================= */

    function showMessage(
        element,
        message,
        type = "normal"
    ) {
        if (!element) return;

        const safeMessage = escapeHTML(message);

        let color = "";

        if (type === "error") {
            color = "#d93025";
        }

        if (type === "success") {
            color = "#188038";
        }

        element.innerHTML = `
            <div style="${color ? `color:${color};` : ""}">
                ${safeMessage}
            </div>
        `;
    }

    /* =========================================================
       MODE PROMPTS
    ========================================================= */

    function getModePrompt(topic, mode) {
        switch (mode) {
            case "scripts":
                return `
OUTPUT_MODE: SCRIPTS

Topic: "${topic}"

Generate ONLY a short video script.

Required structure:
Hook
Body
Outro

STRICT RULES:
- Output ONLY the script.
- Do NOT generate a caption.
- Do NOT generate hashtags.
- Do NOT generate CTA.
- Do NOT generate separate hooks.
- Do NOT generate explanations.
- Do NOT add any content outside the script.

Return only the script.
`;

            case "hooks":
                return `
OUTPUT_MODE: HOOKS

Topic: "${topic}"

Generate ONLY 5 to 7 catchy opening hooks.

STRICT RULES:
- Numbered list only.
- One hook per line.
- Each line must be a hook.
- No full script.
- No body.
- No outro.
- No caption.
- No hashtags.
- No CTA.
- No explanation.

Return ONLY the hooks.
`;

            case "captions":
                return `
OUTPUT_MODE: CAPTION

Topic: "${topic}"

Generate ONLY ONE clean social media caption.

STRICT RULES:
- Caption only.
- No script.
- No hook list.
- No hashtags.
- No separate CTA.
- No headings.
- No explanation.

Return ONLY the caption.
`;

            case "hashtags":
                return `
OUTPUT_MODE: HASHTAGS

Topic: "${topic}"

Generate ONLY relevant hashtags.

STRICT RULES:
- Generate 15 to 25 hashtags.
- Every item MUST start with #.
- Separate hashtags with spaces.
- Hindi hashtags must remain complete.
- No normal sentences.
- No caption.
- No script.
- No hooks.
- No CTA.
- No headings.
- No explanation.

Example:
#LIC #LifeInsurance #Savings #FinancialPlanning

Return ONLY hashtags.
`;

            case "cta":
                return `
OUTPUT_MODE: CTA

Topic: "${topic}"

Generate ONLY 5 to 7 strong Call To Action lines.

STRICT RULES:
- Numbered list only.
- One CTA per line.
- CTA text only.
- No full script.
- No caption.
- No hashtags.
- No hooks.
- No explanation.

Return ONLY CTA lines.
`;

            default:
                return topic;
        }
    }

    /* =========================================================
       MAIN CONTENT GENERATION
    ========================================================= */

    if (generateBtn) {
        generateBtn.addEventListener(
            "click",
            async () => {
                const topic = topicInput
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

                const activeMode =
                    activeContentMode;

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

                const finalTopicPayload =
                    getModePrompt(
                        topic,
                        activeMode
                    );

                setButtonLoading(
                    generateBtn,
                    "✨ Generating...",
                    "✨ Generate Content"
                );

                if (result) {
                    result.innerHTML = `
                        <div style="text-align:center;">
                            <div style="
                                font-size:24px;
                                margin-bottom:8px;
                            ">
                                ✨
                            </div>
                            <div>
                                Creating your content...
                            </div>
                        </div>
                    `;
                }

                try {
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
                                    topic:
                                        finalTopicPayload,

                                    /*
                                     IMPORTANT:
                                     Send mode separately so backend
                                     can also understand which card
                                     was selected.
                                    */
                                    mode: activeMode,
                                    contentMode:
                                        activeMode,

                                    contentType:
                                        selectedContentType,

                                    language:
                                        selectedLanguage
                                })
                            }
                        );

                    const responseText =
                        await response.text();

                    let data = null;

                    try {
                        data =
                            JSON.parse(
                                responseText
                            );
                    } catch (jsonErr) {
                        if (
                            responseText.includes("502") ||
                            responseText.includes("504") ||
                            responseText.includes("Bad Gateway") ||
                            responseText.includes("Gateway Timeout")
                        ) {
                            throw new Error(
                                "Server sleep mode me hai ya start ho raha hai. Kripya 20 seconds intezar karke dubara click karein."
                            );
                        }

                        if (
                            responseText &&
                            responseText
                                .trim()
                                .length > 0 &&
                            !responseText
                                .trim()
                                .startsWith("<")
                        ) {
                            data = {
                                success: true,
                                result:
                                    responseText.trim()
                            };
                        } else {
                            throw new Error(
                                "Server is waking up. Please try again in a few moments."
                            );
                        }
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
                        (
                            data &&
                            (
                                data.result ||
                                data.content ||
                                data.reply ||
                                data.output ||
                                data.text
                            )
                        ) || "";

                    if (
                        !String(
                            generatedText
                        ).trim()
                    ) {
                        throw new Error(
                            "AI returned an empty response."
                        );
                    }

                    /*
                     IMPORTANT:
                     Even if backend sends mixed content,
                     cleanAIOutputByMode() will isolate the
                     selected mode before displaying it.
                    */
                    const finalCleanOutput =
                        cleanAIOutputByMode(
                            generatedText,
                            activeMode
                        );

                    if (
                        !String(
                            finalCleanOutput
                        ).trim()
                    ) {
                        throw new Error(
                            `AI ne valid ${activeMode.toUpperCase()} output nahi diya. Please try again.`
                        );
                    }

                    if (result) {
                        result.innerHTML = `
                            <div class="ai-generated-content">
                                ${formatAIText(
                                    generatedText,
                                    activeMode
                                )}
                            </div>
                        `;
                    }

                } catch (error) {
                    console.error(
                        "Content Generation Error:",
                        error
                    );

                    showMessage(
                        result,
                        error.message ||
                            "Something went wrong while generating content.",
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
                        <div style="text-align:center;">
                            <div style="
                                font-size:24px;
                                margin-bottom:8px;
                            ">
                                💡
                            </div>
                            <div>
                                Generating fresh content ideas...
                            </div>
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
                                    topic: topic,
                                    language:
                                        selectedLanguage,
                                    count: count
                                })
                            }
                        );

                    const responseText =
                        await response.text();

                    let data = null;

                    try {
                        data =
                            JSON.parse(
                                responseText
                            );
                    } catch (jsonErr) {
                        throw new Error(
                            "Ideas server response error. Server wake up ho raha ho sakta hai."
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
                            data &&
                            (
                                data.ideas ||
                                data.result
                            )
                        )
                            ? (
                                data.ideas ||
                                data.result
                            )
                            : [];

                    if (
                        ideas.length === 0
                    ) {
                        throw new Error(
                            "No ideas were generated. Please try again."
                        );
                    }

                    renderIdeas(ideas);

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
                const item =
                    document.createElement(
                        "div"
                    );

                item.className =
                    "idea-item";

                const number =
                    document.createElement(
                        "div"
                    );

                number.className =
                    "idea-number";

                number.textContent =
                    index + 1;

                const content =
                    document.createElement(
                        "div"
                    );

                content.className =
                    "idea-content";

                const text =
                    document.createElement(
                        "div"
                    );

                text.className =
                    "idea-text";

                text.textContent =
                    String(idea);

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

                useButton.addEventListener(
                    "click",
                    () => {
                        useIdea(
                            String(idea),
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
            top: Math.max(
                0,
                topicInput
                    .getBoundingClientRect()
                    .top +
                    window.scrollY -
                    120
            ),

            behavior: "smooth"
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
                                    prompt: prompt,
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

                    let data = null;

                    try {
                        data =
                            JSON.parse(
                                responseText
                            );
                    } catch (jsonErr) {
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

                    const imgData =
                        data &&
                        (
                            data.image ||
                            data.imageUrl ||
                            data.url
                        );

                    if (!imgData) {
                        throw new Error(
                            "No image was returned by the server."
                        );
                    }

                    renderGeneratedImage(
                        imgData
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
            event => {
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
            event => {
                if (
                    event.ctrlKey &&
                    event.key === "Enter"
                ) {
                    event.preventDefault();

                    if (
                        generateIdeasBtn
                    ) {
                        generateIdeasBtn.click();
                    }
                }
            }
        );
    }

    if (imagePrompt) {
        imagePrompt.addEventListener(
            "keydown",
            event => {
                if (
                    event.ctrlKey &&
                    event.key === "Enter"
                ) {
                    event.preventDefault();

                    if (
                        generateImageBtn
                    ) {
                        generateImageBtn.click();
                    }
                }
            }
        );
    }

    /* =========================================================
       CARD MODE SELECTION
    ========================================================= */

    function attachCardMode(
        cardElement,
        modeName,
        defaultContentType
    ) {
        if (!cardElement) return;

        cardElement.addEventListener(
            "click",
            () => {
                activeContentMode =
                    modeName;

                if (
                    contentType &&
                    defaultContentType
                ) {
                    /*
                     Only change select value if
                     that option actually exists.
                    */
                    const optionExists =
                        Array.from(
                            contentType.options
                        ).some(
                            option =>
                                option.value ===
                                defaultContentType
                        );

                    if (optionExists) {
                        contentType.value =
                            defaultContentType;
                    }
                }

                if (topicInput) {
                    topicInput.placeholder =
                        `Enter topic for ${modeName.toUpperCase()}...`;
                }

                console.log(
                    "Active content mode:",
                    activeContentMode
                );
            }
        );
    }

    attachCardMode(
        scriptsCard,
        "scripts",
        "Instagram Reel"
    );

    attachCardMode(
        hooksCard,
        "hooks",
        "Instagram Post"
    );

    attachCardMode(
        captionsCard,
        "captions",
        "Caption"
    );

    attachCardMode(
        hashtagsCard,
        "hashtags",
        "Instagram Post"
    );

    attachCardMode(
        ctaCard,
        "cta",
        "Ad Copy"
    );

    console.log(
        "AI Content Agent frontend loaded successfully."
    );
});
