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

        button.textContent =
            button.dataset.originalText || button.textContent;

        button.style.opacity = "1";
        button.style.cursor = "pointer";
    }

    function escapeHTML(value) {
        if (value === null || value === undefined) {
            return "";
        }

        const div = document.createElement("div");
        div.textContent = String(value);

        return div.innerHTML;
    }

    // ==========================================
    // MARKDOWN / SYMBOL CLEANER
    // ==========================================

    function sanitizeMarkdown(rawText, preserveHashtags = false) {
        if (!rawText) return "";

        let text = String(rawText)
            .replace(/\r\n/g, "\n")
            .replace(/\r/g, "\n");

        text = text.replace(/```[\s\S]*?```/g, "");
        text = text.replace(/`([^`]+)`/g, "$1");
        text = text.replace(/`/g, "");

        text = text.replace(
            /^[ \t]*\\?[-—_*]{3,}[ \t]*$/gm,
            ""
        );

        text = text.replace(
            /\\([#*_`\[\]()\-+!.]|[—–])/g,
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

        text = text.replace(
            /\n{3,}/g,
            "\n\n"
        );

        return text.trim();
    }

    // ==========================================
    // HEADER HELPERS
    // ==========================================

    function normalizeHeader(line) {
        return String(line || "")
            .replace(/^[\s>*•\-–—#`*_~]+/, "")
            .replace(/[`*_~]/g, "")
            .trim();
    }

    function isHashtagHeader(line) {
        const n = normalizeHeader(line);

        return /^(?:hashtags?|हैशटैग|tags?|टैग्स?)(?:\s*\([^)]*\))?\s*[:\-–]?\s*(?:#.*)?$/i.test(n);
    }

    function isNextSection(line) {
        const n = normalizeHeader(line);

        return /^(?:script|scripts|स्क्रिप्ट|hooks?|हुक्स?|caption|कैप्शन|cta|call to action|कॉल टू एक्शन|outro|body|scene|दृश्य|conclusion|निष्कर्ष)(?:\s*\([^)]*\))?\s*[:\-–]?(?:\s|$)/i.test(n);
    }

    // ==========================================
    // HASHTAG ONLY CLEANER
    // ==========================================

    function extractHashtagsOnly(rawText) {
        if (!rawText) return "";

        const lines = String(rawText)
            .replace(/\r\n?/g, "\n")
            .split("\n");

        let inBlock = false;
        const blockLines = [];

        for (const rawLine of lines) {
            const line = rawLine.trim();

            if (!line) continue;

            if (isHashtagHeader(line)) {
                inBlock = true;

                const n = normalizeHeader(line);

                const rest = n.replace(
                    /^(?:hashtags?|हैशटैग|tags?|टैग्स?)(?:\s*\([^)]*\))?\s*[:\-–]?\s*/i,
                    ""
                );

                if (rest) {
                    blockLines.push(rest);
                }

                continue;
            }

            if (inBlock) {
                if (isNextSection(line)) {
                    break;
                }

                blockLines.push(line);
            }
        }

        let targetText = blockLines.join(" ");

        // Fallback:
        // Only accept lines that are practically pure hashtags.
        if (!targetText) {
            const hashtagOnlyLines = lines.filter((rawLine) => {
                const line = rawLine.trim();

                if (!line) return false;

                const tags =
                    line.match(/#[\p{L}\p{N}_]+/gu) || [];

                if (!tags.length) return false;

                const remainder = line
                    .replace(
                        /#[\p{L}\p{N}_]+/gu,
                        ""
                    )
                    .replace(
                        /[`*_~\\]/g,
                        ""
                    )
                    .replace(
                        /[|,;:·•\-–—()[\]{}.!?]+/g,
                        ""
                    )
                    .trim();

                return remainder === "";
            });

            targetText = hashtagOnlyLines.join(" ");
        }

        const matches =
            targetText.match(
                /#[\p{L}\p{N}_]+/gu
            ) || [];

        const seen = new Set();
        const output = [];

        for (const tag of matches) {
            const key = tag.toLocaleLowerCase();

            if (!seen.has(key)) {
                seen.add(key);
                output.push(tag);
            }

            if (output.length >= 25) {
                break;
            }
        }

        return output.join(" ");
    }

    // ==========================================
    // SCRIPT CLEANER
    // ==========================================

    function cleanScriptsOutput(rawText) {
        if (!rawText) return "";

        const raw = String(rawText)
            .replace(/\r\n?/g, "\n");

        const lines = raw.split("\n");
        const kept = [];

        const stopSection =
            /^\s*(?:[#*`_~\\•\-–—📌📝💬📢🎯#️⃣]*)\s*(?:caption|कैप्शन|post caption|hashtags?|हैशटैग|cta|call to action|कॉल टू एक्शन|निष्कर्ष|conclusion)\s*[:\-–]/i;

        for (const rawLine of lines) {
            const line = rawLine.trim();

            if (stopSection.test(line)) {
                break;
            }

            const tags =
                line.match(/#[\p{L}\p{N}_]+/gu) || [];

            if (tags.length >= 2) {
                const remainder = line
                    .replace(
                        /#[\p{L}\p{N}_]+/gu,
                        ""
                    )
                    .replace(
                        /[`*_~\\\s,;:|•\-–—]+/g,
                        ""
                    )
                    .trim();

                if (!remainder) {
                    break;
                }
            }

            kept.push(rawLine);
        }

        return sanitizeMarkdown(
            kept.join("\n"),
            false
        ).trim();
    }

    // ==========================================
    // DEDICATED BLOCK EXTRACTOR
    // ==========================================

    function extractDedicatedBlock(
        rawText,
        headerRegex,
        stopRegex
    ) {
        const lines = String(rawText || "")
            .replace(/\r\n?/g, "\n")
            .split("\n");

        let inBlock = false;
        const output = [];

        for (const rawLine of lines) {
            const line = rawLine.trim();

            if (!line) {
                if (inBlock) {
                    output.push("");
                }

                continue;
            }

            const clean = normalizeHeader(line);

            if (headerRegex.test(clean)) {
                inBlock = true;

                const rest =
                    clean
                        .replace(headerRegex, "")
                        .trim();

                if (rest) {
                    output.push(rest);
                }

                continue;
            }

            if (inBlock && stopRegex.test(clean)) {
                break;
            }

            if (inBlock) {
                output.push(rawLine);
            }
        }

        return output.join("\n").trim();
    }

    // ==========================================
    // HOOKS CLEANER
    // ==========================================

    function cleanHooksOutput(rawText) {
        if (!rawText) return "";

        const dedicated =
            extractDedicatedBlock(
                rawText,

                /^(?:hooks?|हुक्स?)(?:\s*\([^)]*\))?\s*[:\-–]?\s*/i,

                /^(?:script|scripts|स्क्रिप्ट|caption|कैप्शन|hashtags?|हैशटैग|cta|call to action|कॉल टू एक्शन)\b/i
            );

        let source =
            dedicated || String(rawText);

        source =
            sanitizeMarkdown(
                source,
                false
            );

        const lines =
            source
                .split("\n")
                .map(x => x.trim())
                .filter(Boolean);

        const output = [];

        for (const line of lines) {
            const cleaned =
                line
                    .replace(
                        /^\d+\s*[.)\-:]\s*/,
                        ""
                    )
                    .replace(
                        /^hook\s*\d*\s*[:\-–]?\s*/i,
                        ""
                    )
                    .trim();

            if (!cleaned) continue;

            if (cleaned.length > 220) {
                continue;
            }

            if (
                /^(?:body|outro|scene|दृश्य|caption|कैप्शन|hashtags?|हैशटैग|cta)\b/i.test(
                    cleaned
                )
            ) {
                continue;
            }

            output.push(cleaned);

            if (output.length >= 7) {
                break;
            }
        }

        return output
            .map((x, i) => `${i + 1}. ${x}`)
            .join("\n");
    }

    // ==========================================
    // CAPTION CLEANER
    // ==========================================

    function cleanCaptionsOutput(rawText) {
        if (!rawText) return "";

        let source =
            extractDedicatedBlock(
                rawText,

                /^(?:caption|कैप्शन|post caption)(?:\s*\([^)]*\))?\s*[:\-–]?\s*/i,

                /^(?:hashtags?|हैशटैग|cta|call to action|कॉल टू एक्शन|script|scripts|स्क्रिप्ट)\b/i
            );

        if (!source) {
            source = String(rawText);
        }

        source = source.replace(
            /(?:^|\n)\s*(?:hashtags?|हैशटैग)\s*[:\-–].*$/gim,
            ""
        );

        source = source.replace(
            /(?:^|\n)\s*(?:cta|call to action|कॉल टू एक्शन)\s*[:\-–].*$/gim,
            ""
        );

        source = source.replace(
            /(?:^|\n)(?:#[\p{L}\p{N}_]+\s*){2,}$/gu,
            ""
        );

        return sanitizeMarkdown(
            source,
            false
        ).trim();
    }

    // ==========================================
    // CTA CLEANER
    // ==========================================

    function cleanCTAOutput(rawText) {
        if (!rawText) return "";

        const dedicated =
            extractDedicatedBlock(
                rawText,

                /^(?:cta|call to action|कॉल टू एक्शन)(?:\s*\([^)]*\))?\s*[:\-–]?\s*/i,

                /^(?:script|scripts|स्क्रिप्ट|caption|कैप्शन|hashtags?|हैशटैग|hooks?|हुक्स?)\b/i
            );

        let source =
            sanitizeMarkdown(
                dedicated || String(rawText),
                false
            );

        const lines =
            source
                .split("\n")
                .map(x => x.trim())
                .filter(Boolean);

        const output = [];

        for (const line of lines) {
            const cleaned =
                line
                    .replace(
                        /^\d+\s*[.)\-:]\s*/,
                        ""
                    )
                    .replace(
                        /^cta\s*\d*\s*[:\-–]?\s*/i,
                        ""
                    )
                    .trim();

            if (!cleaned) continue;

            if (cleaned.length > 220) {
                continue;
            }

            if (
                /^(?:body|outro|scene|दृश्य|caption|कैप्शन|hashtags?|हैशटैग)\b/i.test(
                    cleaned
                )
            ) {
                continue;
            }

            output.push(cleaned);

            if (output.length >= 7) {
                break;
            }
        }

        return output
            .map((x, i) => `${i + 1}. ${x}`)
            .join("\n");
    }

    // ==========================================
    // MODE CLEANER
    // ==========================================

    function cleanAIOutputByMode(
        rawText,
        mode
    ) {
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

    // ==========================================
    // FORMAT OUTPUT
    // ==========================================

    function formatAIText(
        text,
        mode = activeContentMode
    ) {
        if (!text) return "";

        const clean =
            cleanAIOutputByMode(
                text,
                mode
            );

        if (!clean) return "";

        if (mode === "hashtags") {
            return `
                <div class="hashtags-output">
                    ${escapeHTML(clean)}
                </div>
            `;
        }

        const lines =
            clean.split("\n");

        return lines
            .map(line => {
                const safe =
                    escapeHTML(
                        line.trim()
                    );

                if (!safe) {
                    return '<div class="content-spacer"></div>';
                }

                return `<p>${safe}</p>`;
            })
            .join("");
    }

    // ==========================================
    // MESSAGE
    // ==========================================

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
                    : "inherit";

        element.innerHTML = `
            <div style="color:${color};padding:12px;">
                ${escapeHTML(message)}
            </div>
        `;
    }

    // ==========================================
    // MODE PROMPTS
    // ==========================================

    function getModePrompt(
        topic,
        mode
    ) {
        const rules = {

            scripts:
                `Topic: "${topic}". OUTPUT ONLY a short video script. Format exactly as simple text with Hook, Body and Outro. Do not include caption, hashtags, CTA list, notes or explanations. No markdown symbols.`,

            hooks:
                `Topic: "${topic}". OUTPUT ONLY 5 to 7 catchy opening hooks. Number them 1 to 7. No full script, no caption, no hashtags and no CTA. No markdown symbols.`,

            captions:
                `Topic: "${topic}". OUTPUT ONLY one clean social-media caption. No script, no hashtag list and no separate CTA options. No markdown symbols.`,

            hashtags:
                `Topic: "${topic}". OUTPUT ONLY 15 to 25 relevant hashtags separated by spaces. Every item must start with #. Do not write any sentence, title, explanation or CTA.`,

            cta:
                `Topic: "${topic}". OUTPUT ONLY 5 to 7 short CTA lines. Number them 1 to 7. No script, caption or hashtags. No markdown symbols.`
        };

        return rules[mode] || topic;
    }

    // ==========================================
    // SAFE SERVER RESPONSE
    // ==========================================

    async function readServerResponse(
        response
    ) {
        const raw =
            await response.text();

        if (
            !raw ||
            !raw.trim()
        ) {
            throw new Error(
                `Server returned an empty response (${response.status}).`
            );
        }

        let data = null;

        try {
            data = JSON.parse(raw);

        } catch (_) {

            if (
                /502|503|504|bad gateway|service unavailable|temporarily unavailable/i.test(
                    raw
                )
            ) {
                throw new Error(
                    "Server is waking up. Please wait a few seconds and try again."
                );
            }

            if (
                /<html|<!doctype/i.test(
                    raw
                )
            ) {
                throw new Error(
                    `Server returned an unexpected page (${response.status}).`
                );
            }

            return {
                success: response.ok,
                result: raw
            };
        }

        if (
            !response.ok ||
            data.success === false
        ) {
            throw new Error(
                data.error ||
                data.message ||
                `Request failed (${response.status}).`
            );
        }

        return data;
    }

    // ==========================================
    // MAIN CONTENT GENERATOR
    // ==========================================

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
                        <div style="text-align:center;padding:16px;">
                            ✨<br>
                            Creating your content...
                        </div>
                    `;
                }

                try {

                    const finalTopicPayload =
                        activeContentMode === "general"
                            ? topic
                            : getModePrompt(
                                topic,
                                activeContentMode
                            );

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

                                    contentType:
                                        selectedContentType,

                                    language:
                                        selectedLanguage
                                })
                            }
                        );

                    const data =
                        await readServerResponse(
                            response
                        );

                    const generatedText =
                        data.result ||
                        data.content ||
                        data.reply ||
                        data.output ||
                        data.text ||
                        "";

                    if (
                        !String(
                            generatedText
                        ).trim()
                    ) {
                        throw new Error(
                            "AI returned an empty response."
                        );
                    }

                    const cleaned =
                        cleanAIOutputByMode(
                            generatedText,
                            activeContentMode
                        );

                    if (!cleaned) {
                        throw new Error(
                            "AI returned no usable content for this section."
                        );
                    }

                    if (result) {
                        result.innerHTML = `
                            <div class="ai-generated-content">
                                ${formatAIText(
                                    generatedText,
                                    activeContentMode
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

    // ==========================================
    // CONTENT IDEAS
    // ==========================================

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
                        ) || 10
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
                        <div style="text-align:center;padding:16px;">
                            💡<br>
                            Generating fresh content ideas...
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
                                    topic:
                                        topic,

                                    language:
                                        selectedLanguage,

                                    count:
                                        count
                                })
                            }
                        );

                    const data =
                        await readServerResponse(
                            response
                        );

                    const ideas =
                        Array.isArray(
                            data.ideas
                        )
                            ? data.ideas
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

    // ==========================================
    // RENDER IDEAS
    // ==========================================

    function renderIdeas(
        ideas
    ) {
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

    // ==========================================
    // USE IDEA
    // ==========================================

    function useIdea(
        idea,
        button
    ) {
        if (topicInput) {
            topicInput.value =
                idea;
        }

        if (button) {

            const oldText =
                button.textContent;

            button.textContent =
                "✓ Added";

            button.disabled =
                true;

            setTimeout(
                () => {

                    button.textContent =
                        oldText;

                    button.disabled =
                        false;

                },
                1200
            );
        }

        if (topicInput) {
            topicInput.focus();
        }
    }

    // ==========================================
    // IMAGE GENERATOR
    // ==========================================

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
                        : "Social Media Post";

                const selectedStyle =
                    imageStyle
                        ? imageStyle.value
                        : "Modern";

                const selectedSize =
                    imageSize
                        ? imageSize.value
                        : "1024x1024";

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
                        <div style="text-align:center;padding:16px;">
                            🎨<br>
                            Creating your image...
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

                                    prompt:
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

                    const data =
                        await readServerResponse(
                            response
                        );

                    const imageUrl =
                        data.image ||
                        data.imageUrl ||
                        data.url ||
                        (
                            data.data &&
                            data.data.image
                        ) ||
                        (
                            data.data &&
                            data.data.imageUrl
                        );

                    if (!imageUrl) {
                        throw new Error(
                            "Image generation returned no image."
                        );
                    }

                    renderGeneratedImage(
                        imageUrl
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

    // ==========================================
    // RENDER GENERATED IMAGE
    // ==========================================

    function renderGeneratedImage(
        imageUrl
    ) {
        if (!imageResult) return;

        const safeUrl =
            escapeHTML(
                imageUrl
            );

        imageResult.innerHTML = `
            <div class="generated-image-wrap">

                <img
                    src="${safeUrl}"
                    alt="Generated AI image"
                    style="
                        max-width:100%;
                        height:auto;
                        border-radius:16px;
                        display:block;
                        margin:0 auto;
                    "
                >

                <div
                    style="
                        display:flex;
                        gap:10px;
                        justify-content:center;
                        margin-top:12px;
                        flex-wrap:wrap;
                    "
                >

                    <a
                        href="${safeUrl}"
                        target="_blank"
                        rel="noopener"
                        class="download-image-btn"
                    >
                        🖼️ Open Image
                    </a>

                    <button
                        type="button"
                        class="download-image-btn"
                        id="downloadGeneratedImageBtn"
                    >
                        ⬇️ Download
                    </button>

                </div>

            </div>
        `;

        const downloadBtn =
            document.getElementById(
                "downloadGeneratedImageBtn"
            );

        if (downloadBtn) {

            downloadBtn.addEventListener(
                "click",
                () => {
                    downloadImage(
                        imageUrl
                    );
                }
            );
        }
    }

    // ==========================================
    // DOWNLOAD IMAGE
    // ==========================================

    async function downloadImage(
        url
    ) {
        try {

            const response =
                await fetch(url);

            if (!response.ok) {
                throw new Error(
                    "Download failed"
                );
            }

            const blob =
                await response.blob();

            const objectUrl =
                URL.createObjectURL(
                    blob
                );

            const a =
                document.createElement(
                    "a"
                );

            a.href =
                objectUrl;

            a.download =
                `ai-content-agent-${Date.now()}.png`;

            document.body.appendChild(
                a
            );

            a.click();

            a.remove();

            URL.revokeObjectURL(
                objectUrl
            );

        } catch (error) {

            window.open(
                url,
                "_blank",
                "noopener"
            );
        }
    }

    // ==========================================
    // SPECIAL CONTENT CARDS
    // ==========================================

    function attachCardMode(
        card,
        mode,
        defaultContentType
    ) {
        if (!card) return;

        card.addEventListener(
            "click",
            () => {

                activeContentMode =
                    mode;

                if (
                    contentType &&
                    defaultContentType
                ) {
                    contentType.value =
                        defaultContentType;
                }

                if (result) {
                    result.innerHTML =
                        "";
                }

                if (topicInput) {
                    topicInput.focus();
                }
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

    // ==========================================
    // GENERAL INPUT RESET
    // ==========================================

    if (topicInput) {

        topicInput.addEventListener(
            "input",
            () => {

                if (
                    !topicInput.value.trim()
                ) {
                    activeContentMode =
                        "general";
                }
            }
        );
    }

    // ==========================================
    // CTRL + ENTER
    // ==========================================

    document.addEventListener(
        "keydown",
        (event) => {

            if (
                (event.ctrlKey ||
                    event.metaKey) &&
                event.key === "Enter"
            ) {

                if (
                    document.activeElement ===
                        topicInput &&
                    generateBtn &&
                    !generateBtn.disabled
                ) {
                    generateBtn.click();
                }
            }
        }
    );

    console.log(
        "AI Content Agent script loaded successfully."
    );
});