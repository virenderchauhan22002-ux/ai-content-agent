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

    /*
     * Remove old separate content cards.
     * HTML ko manually edit karne ki zarurat nahi.
     */
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

    function removeMarkdown(text) {
        return cleanText(text)
            .replace(/^\s*#{1,6}\s*/gm, "")
            .replace(/\*\*([^*]+)\*\*/g, "$1")
            .replace(/__([^_]+)__/g, "$1")
            .replace(/\*([^*\n]+)\*/g, "$1")
            .replace(/_([^_\n]+)_/g, "$1")
            .replace(/^[\s]*[•*+]\s+/gm, "")
            .replace(/^[\s]*-\s+(?!\d)/gm, "")
            .replace(/^\s*[-=_]{3,}\s*$/gm, "")
            .trim();
    }

    /* =========================================================
       COMPLETE CONTENT CLEANER
    ========================================================= */

    function cleanGeneratedContent(rawText) {
        let text = removeMarkdown(rawText);

        if (!text) {
            return "";
        }

        /*
         * Remove accidental outer labels that the AI may add.
         */
        text = text.replace(
            /^\s*(?:AI\s*)?(?:generated\s*)?(?:content|answer)\s*[:\-]?\s*/i,
            ""
        );

        /*
         * Normalize section names.
         */
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

        /*
         * Remove duplicate blank lines.
         */
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

    function cleanHashtags(text) {
        const matches =
            String(text || "").match(
                /#[\p{L}\p{N}_]+/gu
            ) || [];

        const unique = [];
        const seen = new Set();

        matches.forEach((tag) => {
            const cleanTag = tag.trim();
            const key = cleanTag.toLowerCase();

            if (!seen.has(key)) {
                seen.add(key);
                unique.push(cleanTag);
            }
        });

        return unique.slice(0, 25).join(" ");
    }

    /* =========================================================
       FINAL OUTPUT
    ========================================================= */

    function buildFinalOutput(rawText) {
        const text = cleanGeneratedContent(rawText);

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

        /*
         * Fallback:
         * Agar AI headings properly nahi deta, complete response
         * ko Script ke roop mein use karenge.
         */
        if (!hook && !script && !caption && !hashtags && !cta) {
            script = text;
        }

        hashtags = cleanHashtags(
            hashtags || text
        );

        /*
         * Hashtags ko script/caption se hatao.
         */
        if (script) {
            script = script
                .replace(/#[\p{L}\p{N}_]+/gu, "")
                .trim();
        }

        if (caption) {
            caption = caption
                .replace(/#[\p{L}\p{N}_]+/gu, "")
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

        const data = buildFinalOutput(rawText);

        let html = "";

        if (data.hook) {
            html += `
                <div style="margin-bottom:18px;">
                    <div style="
                        font-weight:700;
                        color:#102c57;
                        margin-bottom:6px;
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
                        font-weight:700;
                        color:#102c57;
                        margin-bottom:6px;
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
                        font-weight:700;
                        color:#102c57;
                        margin-bottom:6px;
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
                        font-weight:700;
                        color:#102c57;
                        margin-bottom:6px;
                    ">
                        Hashtags
                    </div>
                    <div style="
                        color:#1677ff;
                        line-height:2;
                        word-break:break-word;
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
                        font-weight:700;
                        color:#102c57;
                        margin-bottom:6px;
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
                style="
                    text-align:left;
                    word-break:break-word;
                "
            >
                ${html}
            </div>
        `;
    }

    /* =========================================================
       ERROR MESSAGE
    ========================================================= */

    function showMessage(element, message, type = "normal") {
        if (!element) return;

        const color =
            type === "error"
                ? "#d93025"
                : type === "success"
                    ? "#188038"
                    : "";

        element.innerHTML = `
            <div style="${color ? `color:${color};` : ""}">
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
Write 15 to 25 relevant hashtags. Every hashtag must start with #.

CTA:
Write 3 strong call-to-action lines.

STRICT RULES:
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
        generateBtn.addEventListener("click", async () => {
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
                const response = await fetch(
                    `${API_BASE_URL}/generate`,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify({
                            topic: getMainPrompt(
                                topic,
                                selectedContentType,
                                selectedLanguage
                            ),

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
                    data = JSON.parse(
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
        });
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

        topicInput.value = idea;
        topicInput.focus();

        window.scrollTo({
            top:
                Math.max(
                    0,
                    topicInput.getBoundingClientRect()
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