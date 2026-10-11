const API_BASE_URL = "https://ai-content-agent-3hb3.onrender.com";

document.addEventListener("DOMContentLoaded", () => {

    // =========================================================
    // DOM ELEMENTS
    // =========================================================

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

    // =========================================================
    // ACTIVE CONTENT MODE (Window synced to avoid index.html collision)
    // =========================================================

    window.currentGeneratorMode = "general";

    // =========================================================
    // BUTTON HELPERS
    // =========================================================

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
            button.dataset.originalText ||
            button.textContent;

        button.textContent = originalText;

        button.style.opacity = "1";
        button.style.cursor = "pointer";
    }

    // =========================================================
    // HTML ESCAPE
    // =========================================================

    function escapeHTML(value) {
        if (value === null || value === undefined) {
            return "";
        }

        const div = document.createElement("div");
        div.textContent = String(value);

        return div.innerHTML;
    }

    // =========================================================
    // BASIC MARKDOWN CLEANER
    // =========================================================

    function sanitizeMarkdown(rawText, preserveHashtags = false) {

        if (!rawText) return "";

        let text = String(rawText)
            .replace(/\r\n/g, "\n")
            .replace(/\r/g, "\n");

        // Remove fenced code blocks & backticks
        text = text.replace(/```[\s\S]*?```/g, "");
        text = text.replace(/`([^`]+)`/g, "$1");
        text = text.replace(/`/g, "");

        // Remove horizontal rules
        text = text.replace(/^[ \t]*\\?[-—_*]{3,}[ \t]*$/gm, "");

        // Remove escaped markdown
        text = text.replace(/\\([#*_`[\]()\-+!.]|[—–])/g, "$1");

        // Remove headings (#, ##, ###, ####)
        text = text.replace(/^[ \t]*#{1,6}[ \t]*/gm, "");

        // Bold & italic marks
        text = text.replace(/\*\*\*([^*]+)\*\*\*/g, "$1");
        text = text.replace(/\*\*([^*]+)\*\*/g, "$1");
        text = text.replace(/__([^_]+)__/g, "$1");
        text = text.replace(/\*([^*\n]+)\*/g, "$1");
        text = text.replace(/_([^_\n]+)_/g, "$1");
        text = text.replace(/[*_]{1,3}/g, "");

        // Remove bullet prefixes
        text = text.replace(/^[ \t]*[•*+–—][ \t]+/gm, "");
        text = text.replace(/^[ \t]*-[ \t]+(?!\d)/gm, "");

        // Remove stray hashtags when not in hashtag mode
        if (!preserveHashtags) {
            text = text.replace(/(^|\s)#(?!\w)/g, "$1");
            text = text.replace(/#/g, "");
        }

        text = text.replace(/\n{3,}/g, "\n\n");
        return text.trim();
    }

    // =========================================================
    // HASHTAG EXTRACTION - ONLY HASHTAGS (HINDI + ENGLISH)
    // =========================================================

    function extractHashtagsOnly(rawText) {

        if (!rawText) return "";

        const text = String(rawText).replace(/\r\n?/g, "\n");
        const lines = text.split("\n");

        function cleanLineHeader(str) {
            return str
                .replace(/^[\s>*•\-–—#`*_~#️⃣🏷️]+/, "")
                .replace(/[`*_~]/g, "")
                .trim();
        }

        const isHashtagHeader = (l) => {
            const h = cleanLineHeader(l);
            return /^(?:hashtags?|हैशटैग|tags?|टैग्स?)(?:\s*\([^)]*\))?\s*[:\-–]?/i.test(h);
        };

        const isOtherSection = (l) => {
            const h = cleanLineHeader(l);
            return /^(?:script|स्क्रिप्ट|hooks?|हुक्स?|caption|कैप्शन|cta|call to action|कॉल टू एक्शन|outro|body|scene|दृश्य|conclusion|निष्कर्ष)(?:\s*\([^)]*\))?\s*[:\-–]/i.test(h);
        };

        let inHashtagBlock = false;
        const collectedLines = [];

        for (const rawLine of lines) {
            const line = rawLine.trim();
            if (!line) continue;

            if (isHashtagHeader(line)) {
                inHashtagBlock = true;
                const rest = cleanLineHeader(line).replace(/^(?:hashtags?|हैशटैग|tags?|टैग्स?)(?:\s*\([^)]*\))?\s*[:\-–]?\s*/i, "");
                if (rest) collectedLines.push(rest);
                continue;
            }

            if (inHashtagBlock) {
                if (isOtherSection(line)) {
                    inHashtagBlock = false;
                    break;
                }
                collectedLines.push(line);
            }
        }

        let targetContent = collectedLines.join(" ");

        // Fallback: Agar explicit header na ho toh hashtag lines ko collect karo
        if (!targetContent) {
            const pureLines = lines.filter(rawLine => {
                const line = rawLine.trim();
                if (!line || isOtherSection(line)) return false;
                const tags = line.match(/#[\p{L}\p{N}_\u0900-\u097F]+/gu) || [];
                return tags.length >= 1;
            });
            targetContent = pureLines.join(" ");
        }

        // Final tag extraction
        const tagRegex = /#([\p{L}\p{N}_\u0900-\u097F]+)/gu;
        const matches = targetContent.match(tagRegex) || [];

        const seen = new Set();
        const finalTags = [];

        for (const tag of matches) {
            const cleanTag = tag.replace(/[*_`~\\#]+$/, "").trim();
            if (!cleanTag || cleanTag === "#") continue;

            const key = cleanTag.toLowerCase();
            if (!seen.has(key)) {
                seen.add(key);
                finalTags.push(cleanTag);
            }

            if (finalTags.length >= 25) {
                break;
            }
        }

        return finalTags.join(" ");
    }

    // =========================================================
    // SCRIPT CLEANER - ONLY SCRIPT (CUTS AT CAPTION/HASHTAG/CTA)
    // =========================================================

    function cleanScriptsOutput(rawText) {

        if (!rawText) return "";

        const text = String(rawText).replace(/\r\n?/g, "\n");
        const lines = text.split("\n");
        const scriptLines = [];

        const stopRegex = /^(?:[#*`_~\\•\-\s📌📝💬📢🎯#️⃣]*)?(?:caption|कैप्शन|post caption|hashtags?|हैशटैग|cta|call to action|कॉल टू एक्शन|निष्कर्ष|conclusion)\s*[:\-–]/i;

        for (const rawLine of lines) {
            const line = rawLine.trim();
            if (stopRegex.test(line)) {
                break;
            }
            // Agar ek saath hashtags aane lagein toh wahi par cut karo
            const tags = line.match(/#[\p{L}\p{N}_\u0900-\u097F]+/gu) || [];
            if (tags.length >= 2 && line.startsWith("#")) {
                break;
            }
            scriptLines.push(rawLine);
        }

        let cleaned = sanitizeMarkdown(scriptLines.join("\n"), false);
        return cleaned.replace(/\n{3,}/g, "\n\n").trim();
    }

    // =========================================================
    // HOOKS CLEANER - ONLY 5 TO 7 HOOKS
    // =========================================================

    function cleanHooksOutput(rawText) {

        if (!rawText) return "";

        const text = String(rawText).replace(/\r\n?/g, "\n");
        const lines = text.split("\n");
        const hookLines = [];

        const hookHeaderRegex = /^(?:[#*`_~\\•\-\s]|🪝)*\b(?:hooks?|हुक्स?)(?:\s*\([^)]*\))?[\s:*_`~\\-]*$/i;
        const nextSectionRegex = /^(?:[#*`_~\\•\-\s]|📌|📝|💬|📢|🎯)*\b(?:script|स्क्रिप्ट|body|outro|caption|कैप्शन|hashtags?|हैशटैग|cta|call to action|कॉल टू एक्शन|scene|दृश्य|conclusion|निष्कर्ष)[\s:*_`~\\-]/i;

        let inHookBlock = false;
        const blockLines = [];

        for (const rawLine of lines) {
            const line = rawLine.trim();
            if (!line) continue;

            if (hookHeaderRegex.test(line)) {
                inHookBlock = true;
                continue;
            }

            if (inHookBlock) {
                if (nextSectionRegex.test(line)) {
                    inHookBlock = false;
                    break;
                }
                blockLines.push(line);
            }
        }

        const sourceLines = blockLines.length > 0 ? blockLines : lines;

        for (const line of sourceLines) {
            const cleaned = sanitizeMarkdown(line, false).trim();
            if (!cleaned) continue;

            if (/^(?:hooks?|हुक्स?|topic|विषय|script|caption|hashtags?|cta|intro|outro|body|conclusion)[\s:-]/i.test(cleaned)) continue;

            const match = cleaned.match(/^(?:Hook\s*\d*[\s:-]+|\d+[\).]\s+)(.*)/i);
            if (match && match[1].trim()) {
                hookLines.push(`${hookLines.length + 1}. ${match[1].trim()}`);
            } else if (blockLines.length > 0 && cleaned.length < 200 && !cleaned.startsWith("#")) {
                hookLines.push(`${hookLines.length + 1}. ${cleaned}`);
            }

            if (hookLines.length >= 7) break;
        }

        return hookLines.join("\n").trim();
    }

    // =========================================================
    // CAPTION CLEANER - ONLY CAPTION
    // =========================================================

    function cleanCaptionsOutput(rawText) {

        if (!rawText) return "";

        let cleaned = sanitizeMarkdown(rawText, false);

        const captionBlockMatch = cleaned.match(
            /(?:caption|कैप्शन|post caption)[\s:-]+([\s\S]*?)(?=\n\s*(?:(?:#️⃣|📢|🎯)?\s*(?:hashtags?|हैशटैग|cta|call to action|script)|$))/i
        );

        if (captionBlockMatch && captionBlockMatch[1].trim()) {
            cleaned = captionBlockMatch[1].trim();
        }

        cleaned = cleaned.replace(/^(?:caption|कैप्शन|post caption)[\s:-]+/i, "");
        cleaned = cleaned.replace(/\n\s*(?:(?:#️⃣|📢|🎯)?\s*(?:hashtags?|हैशटैग|cta|call to action)[\s:-][\s\S]*$)/i, "");
        cleaned = cleaned.replace(/(?:\s*#[a-zA-Z0-9_\u0900-\u097F]+){2,}\s*$/u, "");

        return cleaned.trim();
    }

    // =========================================================
    // CTA CLEANER - ONLY 5 TO 7 CTA LINES
    // =========================================================

    function cleanCTAOutput(rawText) {

        if (!rawText) return "";

        const text = String(rawText).replace(/\r\n?/g, "\n");
        const lines = text.split("\n");
        const ctaLines = [];

        const ctaHeaderRegex = /^(?:[#*`_~\\•\-\s]|📢|🎯)*\b(?:cta|call to action|कॉल टू एक्शन)(?:\s*\([^)]*\))?[\s:*_`~\\-]*$/i;
        const nextSectionRegex = /^(?:[#*`_~\\•\-\s]|📌|📝|💬)*\b(?:script|स्क्रिप्ट|hook|हुक|caption|कैप्शन|hashtags?|हैशटैग|body|outro|scene|दृश्य|conclusion|निष्कर्ष)[\s:*_`~\\-]/i;

        let inCtaBlock = false;
        const blockLines = [];

        for (const rawLine of lines) {
            const line = rawLine.trim();
            if (!line) continue;

            if (ctaHeaderRegex.test(line)) {
                inCtaBlock = true;
                continue;
            }

            if (inCtaBlock) {
                if (nextSectionRegex.test(line)) {
                    inCtaBlock = false;
                    break;
                }
                blockLines.push(line);
            }
        }

        const sourceLines = blockLines.length > 0 ? blockLines : lines;

        for (const line of sourceLines) {
            const cleaned = sanitizeMarkdown(line, false).trim();
            if (!cleaned) continue;

            if (/^(?:cta|call to action|कॉल टू एक्शन|निष्कर्ष|conclusion|actions?|topic|विषय|script|caption|hook|hashtags?|intro|outro|body)[\s:-]/i.test(cleaned)) continue;
            if (cleaned.startsWith("#")) continue;

            const match = cleaned.match(/^(?:CTA\s*\d*[\s:-]+|\d+[\).]\s+)(.*)/i);
            if (match && match[1].trim()) {
                ctaLines.push(`${ctaLines.length + 1}. ${match[1].trim()}`);
            } else if (blockLines.length > 0 && cleaned.length < 160) {
                ctaLines.push(`${ctaLines.length + 1}. ${cleaned}`);
            }

            if (ctaLines.length >= 7) break;
        }

        return ctaLines.join("\n").trim();
    }

    // =========================================================
    // MODE CLEANER ROUTER
    // =========================================================

    function cleanAIOutputByMode(rawText, mode) {

        if (!rawText) return "";

        switch (mode) {
            case "hashtags":
                return extractHashtagsOnly(rawText);

            case "scripts":
                return cleanScriptsOutput(rawText);

            case "hooks":
                return cleanHooksOutput(rawText);

            case "captions":
                return cleanCaptionsOutput(rawText);

            case "cta":
                return cleanCTAOutput(rawText);

            default:
                return sanitizeMarkdown(rawText, false);
        }
    }

    // =========================================================
    // FORMAT AI OUTPUT
    // =========================================================

    function formatAIText(text, mode = "general") {

        if (!text) return "";

        const processed = cleanAIOutputByMode(text, mode);

        if (mode === "hashtags") {
            const safeTags = escapeHTML(processed);
            if (!safeTags.trim()) {
                return `<p style="color:#d93025;margin:8px 0;">No valid hashtags found. Please try generating again.</p>`;
            }
            return `
                <div class="ai-hashtags-output" style="line-height:2;font-size:15px;color:#1677ff;word-wrap:break-word;white-space:normal;padding:6px 2px;">
                    ${safeTags}
                </div>
            `;
        }

        if ((mode === "hooks" || mode === "cta") && !processed.trim()) {
            return `
                <p style="color:#d93025;margin:8px 0;">
                    No valid ${mode.toUpperCase()} lines found. Please try generating again.
                </p>
            `;
        }

        const lines = processed.split("\n");
        let htmlOutput = "";

        lines.forEach(line => {
            const trimmed = line.trim();
            if (!trimmed) {
                htmlOutput += '<div style="margin:8px 0;"></div>';
                return;
            }

            const safeLine = escapeHTML(trimmed);

            if (/^(?:Hook|Body|Outro|Main Script|Target Duration|Topic|हुक|बॉडी|आउट्रो)[\s:-]/i.test(trimmed)) {
                htmlOutput += `
                    <p style="margin:10px 0 4px;font-weight:700;color:#102c57;line-height:1.6;">
                        ${safeLine}
                    </p>
                `;
            } else if (/^\d+[\).]\s*/.test(trimmed)) {
                htmlOutput += `
                    <p style="margin:4px 0 6px;line-height:1.6;color:#17304f;">
                        ${safeLine}
                    </p>
                `;
            } else {
                htmlOutput += `
                    <p style="margin:4px 0 8px;line-height:1.65;color:#17304f;">
                        ${safeLine}
                    </p>
                `;
            }
        });

        return `
            <div class="ai-clean-output" style="text-align:left;word-break:break-word;">
                ${htmlOutput}
            </div>
        `;
    }

    // =========================================================
    // MESSAGE
    // =========================================================

    function showMessage(element, message, type = "normal") {

        if (!element) return;
        const safeMessage = escapeHTML(message);

        let color = "";
        if (type === "error") color = "#d93025";
        if (type === "success") color = "#188038";

        element.innerHTML = `<div style="${color ? `color:${color};` : ""}">${safeMessage}</div>`;
    }

    // =========================================================
    // MODE PROMPTS
    // =========================================================

    function getModePrompt(topic, mode) {

        switch (mode) {

            case "scripts":
                return `
Topic: "${topic}"

IMPORTANT:
Output ONLY the short video script.

Include:
1. Hook
2. Body
3. Outro

Do NOT include Caption, Hashtags or CTA options. Return only the script.
`;

            case "hooks":
                return `
Topic: "${topic}"

IMPORTANT:
Output ONLY 5 to 7 catchy opening hooks as a numbered list.
No full script, no caption, no hashtags, no CTA.
`;

            case "captions":
                return `
Topic: "${topic}"

IMPORTANT:
Output ONLY one clean social media caption.
No video script, no hooks, no hashtags, no CTA.
`;

            case "hashtags":
                return `
Topic: "${topic}"

IMPORTANT:
Output ONLY 15 to 25 relevant hashtags separated by spaces.
Every item MUST start with #.
No sentences, no script, no caption, no CTA, no explanation.

Example:
#LIC #LifeInsurance #Savings #FinancialPlanning
`;

            case "cta":
                return `
Topic: "${topic}"

IMPORTANT:
Output ONLY 5 to 7 strong Call To Action lines as a numbered list.
No full script, no caption, no hashtags, no hooks.
`;

            default:
                return topic;
        }
    }

    // =========================================================
    // MAIN CONTENT GENERATOR
    // =========================================================

    if (generateBtn) {

        generateBtn.addEventListener("click", async () => {

            const topic = topicInput ? topicInput.value.trim() : "";
            const selectedContentType = contentType ? contentType.value : "Instagram Reel";
            const selectedLanguage = language ? language.value : "Hindi";

            // Pick synced mode
            const activeMode = window.currentGeneratorMode || "general";

            if (!topic) {
                showMessage(result, "Please enter a topic first.", "error");
                if (topicInput) topicInput.focus();
                return;
            }

            const finalTopicPayload = getModePrompt(topic, activeMode);

            setButtonLoading(generateBtn, "✨ Generating...", "✨ Generate Content");

            if (result) {
                result.innerHTML = `
                    <div style="text-align:center;">
                        <div style="font-size:24px;margin-bottom:8px;">✨</div>
                        <div>Creating your content...</div>
                    </div>
                `;
            }

            try {

                const response = await fetch(`${API_BASE_URL}/generate`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        topic: finalTopicPayload,
                        contentType: selectedContentType,
                        language: selectedLanguage
                    })
                });

                const responseText = await response.text();
                let data = null;

                try {
                    data = JSON.parse(responseText);
                } catch (jsonErr) {
                    if (
                        responseText.includes("502") ||
                        responseText.includes("504") ||
                        responseText.includes("Bad Gateway") ||
                        responseText.includes("Gateway Timeout")
                    ) {
                        throw new Error("Server sleep mode me hai ya start ho raha hai. Kripya 20 seconds intezar karke dubara click karein.");
                    }

                    if (responseText && responseText.trim().length > 0 && !responseText.trim().startsWith("<")) {
                        data = { success: true, result: responseText.trim() };
                    } else {
                        throw new Error("Server is waking up. Please try again in a few moments.");
                    }
                }

                if (!response.ok || (data && data.success === false)) {
                    throw new Error(data && data.error ? data.error : "Content generation failed.");
                }

                const generatedText = (data && (data.result || data.content || data.reply || data.output || data.text)) || "";

                if (!String(generatedText).trim()) {
                    throw new Error("AI returned an empty response.");
                }

                if (result) {
                    result.innerHTML = `
                        <div class="ai-generated-content">
                            ${formatAIText(generatedText, activeMode)}
                        </div>
                    `;
                }

            } catch (error) {

                console.error("Content Generation Error:", error);
                showMessage(result, error.message || "Something went wrong while generating content.", "error");

            } finally {

                resetButton(generateBtn);
            }
        });
    }

    // =========================================================
    // CONTENT IDEAS
    // =========================================================

    if (generateIdeasBtn) {

        generateIdeasBtn.addEventListener("click", async () => {

            const topic = ideasTopic ? ideasTopic.value.trim() : "";
            const selectedLanguage = ideasLanguage ? ideasLanguage.value : "Hindi";
            const count = ideasCount ? parseInt(ideasCount.value, 10) : 10;

            if (!topic) {
                showMessage(ideasResult, "Please enter a topic first.", "error");
                if (ideasTopic) ideasTopic.focus();
                return;
            }

            setButtonLoading(generateIdeasBtn, "✨ Generating...", "✨ Generate Ideas");

            if (ideasResult) {
                ideasResult.innerHTML = `
                    <div style="text-align:center;">
                        <div style="font-size:24px;margin-bottom:8px;">💡</div>
                        <div>Generating fresh content ideas...</div>
                    </div>
                `;
            }

            try {

                const response = await fetch(`${API_BASE_URL}/generate-ideas`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        topic: topic,
                        language: selectedLanguage,
                        count: count
                    })
                });

                const responseText = await response.text();
                let data = null;

                try {
                    data = JSON.parse(responseText);
                } catch (jsonErr) {
                    throw new Error("Ideas server response error. Server wake up ho raha ho sakta hai.");
                }

                if (!response.ok || (data && data.success === false)) {
                    throw new Error(data && data.error ? data.error : "Idea generation failed.");
                }

                const ideas = Array.isArray(data && (data.ideas || data.result)) ? (data.ideas || data.result) : [];

                if (ideas.length === 0) {
                    throw new Error("No ideas were generated. Please try again.");
                }

                renderIdeas(ideas);

            } catch (error) {

                console.error("Ideas Generation Error:", error);
                showMessage(ideasResult, error.message || "Something went wrong while generating ideas.", "error");

            } finally {

                resetButton(generateIdeasBtn);
            }
        });
    }

    // =========================================================
    // RENDER IDEAS
    // =========================================================

    function renderIdeas(ideas) {

        if (!ideasResult) return;
        ideasResult.innerHTML = "";

        ideas.forEach((idea, index) => {

            const item = document.createElement("div");
            item.className = "idea-item";

            const number = document.createElement("div");
            number.className = "idea-number";
            number.textContent = index + 1;

            const content = document.createElement("div");
            content.className = "idea-content";

            const text = document.createElement("div");
            text.className = "idea-text";
            text.textContent = String(idea);

            const useButton = document.createElement("button");
            useButton.className = "use-idea-btn";
            useButton.type = "button";
            useButton.textContent = "✨ Use This Idea";

            useButton.addEventListener("click", () => {
                useIdea(String(idea), useButton);
            });

            content.appendChild(text);
            content.appendChild(useButton);
            item.appendChild(number);
            item.appendChild(content);
            ideasResult.appendChild(item);
        });
    }

    // =========================================================
    // USE IDEA
    // =========================================================

    function useIdea(idea, button) {

        if (!topicInput) return;
        topicInput.value = idea;
        topicInput.focus();

        window.scrollTo({
            top: Math.max(0, topicInput.getBoundingClientRect().top + window.scrollY - 120),
            behavior: "smooth"
        });

        if (button) {
            const originalText = button.textContent;
            button.textContent = "✓ Added";
            button.disabled = true;

            setTimeout(() => {
                button.textContent = originalText;
                button.disabled = false;
            }, 1500);
        }
    }

    // =========================================================
    // IMAGE GENERATOR
    // =========================================================

    if (generateImageBtn) {

        generateImageBtn.addEventListener("click", async () => {

            const prompt = imagePrompt ? imagePrompt.value.trim() : "";
            const selectedImageType = imageType ? imageType.value : "Instagram Post";
            const selectedStyle = imageStyle ? imageStyle.value : "Modern Premium";
            const selectedSize = imageSize ? imageSize.value : "1K";

            if (!prompt) {
                showMessage(imageResult, "Please enter an image prompt first.", "error");
                if (imagePrompt) imagePrompt.focus();
                return;
            }

            setButtonLoading(generateImageBtn, "🎨 Generating Image...", "✨ Generate Image");

            if (imageResult) {
                imageResult.innerHTML = `
                    <div class="image-placeholder">
                        <span>🎨</span>
                        <p>Creating your image...</p>
                    </div>
                `;
            }

            try {

                const response = await fetch(`${API_BASE_URL}/generate-image`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        prompt: prompt,
                        imageType: selectedImageType,
                        style: selectedStyle,
                        imageSize: selectedSize
                    })
                });

                const responseText = await response.text();
                let data = null;

                try {
                    data = JSON.parse(responseText);
                } catch (jsonErr) {
                    throw new Error("Image server se invalid response mila.");
                }

                if (!response.ok || (data && data.success === false)) {
                    throw new Error(data && data.error ? data.error : "Image generation failed.");
                }

                const imgData = data && (data.image || data.imageUrl || data.url);

                if (!imgData) {
                    throw new Error("No image was returned by the server.");
                }

                renderGeneratedImage(imgData);

            } catch (error) {

                console.error("Image Generation Error:", error);
                showMessage(imageResult, error.message || "Something went wrong while generating the image.", "error");

            } finally {

                resetButton(generateImageBtn);
            }
        });
    }

    // =========================================================
    // RENDER GENERATED IMAGE
    // =========================================================

    function renderGeneratedImage(imageData) {

        if (!imageResult) return;
        imageResult.innerHTML = "";

        const wrapper = document.createElement("div");
        wrapper.style.width = "100%";
        wrapper.style.textAlign = "center";

        const image = document.createElement("img");
        image.className = "generated-image";
        image.alt = "AI generated image";
        image.loading = "lazy";
        image.src = imageData;

        const downloadButton = document.createElement("button");
        downloadButton.type = "button";
        downloadButton.className = "download-image-btn";
        downloadButton.textContent = "⬇ Download Image";

        downloadButton.addEventListener("click", () => {
            downloadImage(imageData);
        });

        wrapper.appendChild(image);
        wrapper.appendChild(downloadButton);
        imageResult.appendChild(wrapper);
    }

    // =========================================================
    // DOWNLOAD IMAGE
    // =========================================================

    function downloadImage(imageData) {

        try {
            const link = document.createElement("a");
            link.href = imageData;
            link.download = "ai-content-agent-image.png";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error("Image Download Error:", error);
            alert("Image download failed. Please try again.");
        }
    }

    // =========================================================
    // CTRL + ENTER
    // =========================================================

    if (topicInput) {
        topicInput.addEventListener("keydown", event => {
            if (event.ctrlKey && event.key === "Enter") {
                event.preventDefault();
                if (generateBtn) generateBtn.click();
            }
        });
    }

    if (ideasTopic) {
        ideasTopic.addEventListener("keydown", event => {
            if (event.ctrlKey && event.key === "Enter") {
                event.preventDefault();
                if (generateIdeasBtn) generateIdeasBtn.click();
            }
        });
    }

    if (imagePrompt) {
        imagePrompt.addEventListener("keydown", event => {
            if (event.ctrlKey && event.key === "Enter") {
                event.preventDefault();
                if (generateImageBtn) generateImageBtn.click();
            }
        });
    }

    // =========================================================
    // CARD MODE CONTROL & GLOBAL SYNC
    // =========================================================

    function attachCardMode(cardElement, modeName, defaultContentType) {

        if (!cardElement) return;

        cardElement.addEventListener("click", () => {

            window.currentGeneratorMode = modeName;

            if (contentType && defaultContentType) {
                contentType.value = defaultContentType;
            }

            if (topicInput) {
                topicInput.placeholder = `Enter topic for ${modeName.toUpperCase()}...`;
            }
        });
    }

    attachCardMode(scriptsCard, "scripts", "Instagram Reel");
    attachCardMode(hooksCard, "hooks", "Instagram Post");
    attachCardMode(captionsCard, "captions", "Caption");
    attachCardMode(hashtagsCard, "hashtags", "Instagram Post");
    attachCardMode(ctaCard, "cta", "Ad Copy");

    // Helper method called if index.html triggers custom mode
    window.triggerSpecificContentMode = function(modeName, defaultContentType) {
        window.currentGeneratorMode = modeName;
        if (contentType && defaultContentType) {
            contentType.value = defaultContentType;
        }
    };

    console.log("AI Content Agent frontend loaded successfully.");
});