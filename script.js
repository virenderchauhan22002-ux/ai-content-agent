const API_BASE_URL = "https://ai-content-agent-3hb3.onrender.com";

document.addEventListener("DOMContentLoaded", () => { 
 
    // ========================================== 
    // ELEMENTS 
    // ========================================== 
 
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

    // Tool Cards from index.html
    const scriptsCard = document.getElementById("scriptsCard");
    const hooksCard = document.getElementById("hooksCard");
    const captionsCard = document.getElementById("captionsCard");
    const hashtagsCard = document.getElementById("hashtagsCard");
    const ctaCard = document.getElementById("ctaCard");

    // Track active specialized mode
    let activeContentMode = "general";
 
    // ========================================== 
    // HELPER FUNCTIONS 
    // ========================================== 
 
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
 
 
    function escapeHTML(value) { 
        if (value === null || value === undefined) { 
            return ""; 
        } 
 
        const div = document.createElement("div"); 
        div.textContent = String(value); 
 
        return div.innerHTML; 
    } 

    // ========================================== 
    // STRICT OUTPUT CLEANING FUNCTIONS
    // ========================================== 

    function sanitizeMarkdown(rawText, preserveHashtags = false) {
        if (!rawText) return "";

        let text = String(rawText);

        // Standardize newlines
        text = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

        // Code fences and backticks
        text = text.replace(/```[\s\S]*?```/g, "");
        text = text.replace(/`([^`]+)`/g, "$1");
        text = text.replace(/`/g, "");

        // Horizontal rules: ---, \---, ____, ***, etc.
        text = text.replace(/^[ \t]*\\?[-—_*]{3,}[ \t]*$/gm, "");

        // Markdown escaped sequences
        text = text.replace(/\\([#*_`[\]()\-+!.]|[—–])/g, "$1");

        // Markdown headings: ####, ###, ##, #
        text = text.replace(/^[ \t]*#{1,6}[ \t]*/gm, "");

        // Bold and italics: ***, **, *, __, _
        text = text.replace(/\*\*\*([^*]+)\*\*\*/g, "$1");
        text = text.replace(/\*\*([^*]+)\*\*/g, "$1");
        text = text.replace(/__([^_]+)__/g, "$1");
        text = text.replace(/\*([^*\n]+)\*/g, "$1");
        text = text.replace(/_([^_\n]+)_/g, "$1");

        // Stray asterisks or underscores
        text = text.replace(/[*_]{1,3}/g, "");

        // Bullet symbols at beginning of lines
        text = text.replace(/^[ \t]*[•*+–—][ \t]+/gm, "");
        text = text.replace(/^[ \t]*-[ \t]+(?!\d)/gm, "");

        // Remove non-hashtag standalone #
        if (!preserveHashtags) {
            text = text.replace(/(^|\s)#(?!\w)/g, "$1");
            text = text.replace(/#/g, "");
        }

        // Collapse excess blank lines
        text = text.replace(/\n{3,}/g, "\n\n");

        return text.trim();
    }

    // 1. HASHTAGS: All unique hashtags, no extra text, # preserved, Devnagari + English
    function extractHashtagsOnly(text) {
        if (!text) return "";

        const hashtagRegex = /#([\p{L}\p{N}_\u0900-\u097F]+)/gu;
        const matches = text.match(hashtagRegex);

        if (!matches || matches.length === 0) {
            return "";
        }

        const seen = new Set();
        const uniqueHashtags = [];

        matches.forEach(tag => {
            const cleanTag = tag.trim();
            const lowerTag = cleanTag.toLowerCase();
            if (!seen.has(lowerTag)) {
                seen.add(lowerTag);
                uniqueHashtags.push(cleanTag);
            }
        });

        return uniqueHashtags.join(" ");
    }

    // 2. SCRIPTS: Only script content. Remove trailing Caption, Hashtags, CTA, Conclusion
    function cleanScriptsOutput(text) {
        let cleaned = sanitizeMarkdown(text, false);

        const trailingSplit = /\n\s*(?:(?:📌|📝|💬|📢|🎯|#️⃣)?\s*(?:caption|कैप्शन|hashtags?|हैशटैग|cta|call to action|निष्कर्ष|conclusion)[\s:-][\s\S]*$)/i;
        cleaned = cleaned.replace(trailingSplit, "");

        // Remove trailing hashtag-only lines
        cleaned = cleaned.replace(/\n\s*(?:#[^\s#]+\s*)+$/g, "");

        return cleaned.trim();
    }

    // 3. HOOKS: Strict - Only actual hook lines, maximum 7. Never number normal paragraphs
    function cleanHooksOutput(text) {
        const cleaned = sanitizeMarkdown(text, false);
        const lines = cleaned.split("\n");
        const hookLines = [];

        let inHookBlock = false;
        let blockLines = [];

        // Check for dedicated Hooks block
        for (let i = 0; i < lines.length; i++) {
            const l = lines[i].trim();
            if (/^(?:hooks?|हुक्स?)[\s:-]/i.test(l)) {
                inHookBlock = true;
                continue;
            }
            if (inHookBlock && /^(?:script|body|outro|caption|hashtags?|cta|call to action|scene|दृश्य)[\s:-]/i.test(l)) {
                inHookBlock = false;
                break;
            }
            if (inHookBlock && l) {
                blockLines.push(l);
            }
        }

        const targetLines = blockLines.length > 0 ? blockLines : lines;

        targetLines.forEach(line => {
            const trimmed = line.trim();
            if (!trimmed) return;

            // Reject headings, explanations, structural labels
            if (/^(?:hooks?|हुक्स?|topic|विषय|script|caption|hashtags?|cta|intro|outro|body|conclusion)[\s:-]/i.test(trimmed)) return;
            if (/^(?:दृश्य|सीन|scene|dialogue|action|visual|audio)[\s:-]/i.test(trimmed)) return;

            // STRICT: Must be a legitimate numbered hook format (1., 1), Hook 1:)
            const match = trimmed.match(/^(?:Hook\s*\d+[\s:-]+|\d+[\).]\s*)(.*)/i);
            if (match) {
                const hookText = match[1].trim();
                // Reject if the line is just a heading or section name
                if (hookText && !/^(?:Hook|Script|Body|Outro|Caption|Hashtags|CTA)[\s:-]/i.test(hookText)) {
                    if (hookLines.length < 7) {
                        hookLines.push(`${hookLines.length + 1}. ${hookText}`);
                    }
                }
            }
        });

        // Strict: If no explicit numbered hooks found, return empty rather than fabricating hooks from paragraphs
        if (hookLines.length > 0) {
            return hookLines.join("\n");
        }

        return "";
    }

    // 4. CAPTIONS: Pure caption text only. Strip script, hook, hashtags, and CTA
    function cleanCaptionsOutput(text) {
        let cleaned = sanitizeMarkdown(text, false);

        // If explicitly labeled caption block exists, take only that
        const captionBlockMatch = cleaned.match(/(?:caption|कैप्शन|post caption)[\s:-]+([\s\S]*?)(?=\n\s*(?:(?:#️⃣|📢|🎯)?\s*(?:hashtags?|हैशटैग|cta|call to action|script)|$))/i);
        if (captionBlockMatch && captionBlockMatch[1].trim()) {
            cleaned = captionBlockMatch[1].trim();
        }

        cleaned = cleaned.replace(/^(?:caption|कैप्शन|post caption)[\s:-]+/i, "");

        // Cut trailing hashtag or CTA sections
        const cutPattern = /\n\s*(?:(?:#️⃣|📢|🎯)?\s*(?:hashtags?|हैशटैग|cta|call to action)[\s:-][\s\S]*$)/i;
        cleaned = cleaned.replace(cutPattern, "");

        // Remove trailing hashtags cluster
        cleaned = cleaned.replace(/(?:\s*#[a-zA-Z0-9_\u0900-\u097F]+){2,}\s*$/, "");

        return cleaned.trim();
    }

    // 5. CTA: Strict - Only actual CTA lines, maximum 7. Never number normal paragraphs
    function cleanCTAOutput(text) {
        const cleaned = sanitizeMarkdown(text, false);
        const lines = cleaned.split("\n");
        const ctaLines = [];

        let inCtaBlock = false;
        let blockLines = [];

        // Check for dedicated CTA block
        for (let i = 0; i < lines.length; i++) {
            const l = lines[i].trim();
            if (/^(?:cta|call to action|कॉल टू एक्शन)[\s:-]/i.test(l)) {
                inCtaBlock = true;
                continue;
            }
            if (inCtaBlock && /^(?:script|caption|hashtags?|hook|body|outro|scene|दृश्य)[\s:-]/i.test(l)) {
                inCtaBlock = false;
                break;
            }
            if (inCtaBlock && l) {
                blockLines.push(l);
            }
        }

        const targetLines = blockLines.length > 0 ? blockLines : lines;

        targetLines.forEach(line => {
            const trimmed = line.trim();
            if (!trimmed) return;

            // Reject headings, explanations, structural labels
            if (/^(?:cta|call to action|कॉल टू एक्शन|निष्कर्ष|conclusion|actions?|topic|विषय|script|caption|hook|hashtags?|intro|outro|body)[\s:-]/i.test(trimmed)) return;
            if (trimmed.startsWith("#")) return;

            // STRICT: Must be a legitimate numbered CTA format (1., 1), CTA 1:)
            const match = trimmed.match(/^(?:CTA\s*\d+[\s:-]+|\d+[\).]\s*)(.*)/i);
            if (match) {
                const ctaText = match[1].trim();
                if (ctaText && !/^(?:CTA|Hook|Script|Body|Outro|Caption|Hashtags)[\s:-]/i.test(ctaText)) {
                    if (ctaLines.length < 7) {
                        ctaLines.push(`${ctaLines.length + 1}. ${ctaText}`);
                    }
                }
            }
        });

        // Strict: Return only real CTA lines; never number unrelated paragraphs
        if (ctaLines.length > 0) {
            return ctaLines.join("\n");
        }

        return "";
    }

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
 
    function formatAIText(text, mode = "general") { 
        if (!text) return ""; 

        const processed = cleanAIOutputByMode(text, mode);

        // Strict Hashtags Presentation
        if (mode === "hashtags") {
            const safeTags = escapeHTML(processed);
            if (!safeTags.trim()) {
                return `<p style="color:#d93025;margin:8px 0;">No valid hashtags found. Please try generating again.</p>`;
            }
            return `
                <div class="ai-hashtags-output" style="line-height:2.0;font-size:15px;color:#1677ff;word-wrap:break-word;white-space:normal;padding:6px 2px;">
                    ${safeTags}
                </div>
            `;
        }

        // Handle empty safe results for strictly filtered modes
        if ((mode === "hooks" || mode === "cta") && !processed.trim()) {
            return `<p style="color:#d93025;margin:8px 0;">No valid ${mode.toUpperCase()} lines found in response. Please try generating again.</p>`;
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

            // Highlight structural labels cleanly
            if (/^(?:Hook|Body|Outro|Main Script|Target Duration|Topic|हुक|बॉडी|आउट्रो)[\s:-]/i.test(trimmed)) {
                htmlOutput += `<p style="margin:10px 0 4px;font-weight:700;color:#102c57;line-height:1.6;">${safeLine}</p>`;
            } else if (/^\d+[\).]\s*/.test(trimmed)) {
                htmlOutput += `<p style="margin:4px 0 6px;line-height:1.6;color:#17304f;">${safeLine}</p>`;
            } else {
                htmlOutput += `<p style="margin:4px 0 8px;line-height:1.65;color:#17304f;">${safeLine}</p>`;
            }
        });

        return `<div class="ai-clean-output" style="text-align:left;word-break:break-word;">${htmlOutput}</div>`;
    } 
 
    function showMessage(element, message, type = "normal") { 
        if (!element) return; 
 
        const safeMessage = escapeHTML(message); 
 
        let color = ""; 
 
        if (type === "error") { 
            color = "#d93025"; 
        } else if (type === "success") { 
            color = "#188038"; 
        } 
 
        element.innerHTML = ` 
            <div style="${color ? `color:${color};` : ""}"> 
                ${safeMessage} 
            </div> 
        `; 
    } 

    function getModePrompt(topic, mode) {
        switch (mode) {
            case "scripts":
                return `Topic: "${topic}". [RULE: Output ONLY a short video script with Hook, Body, and Outro dialogue. Do NOT include captions, do NOT include hashtags, and do NOT add separate CTA options.]`;
            case "hooks":
                return `Topic: "${topic}". [RULE: Output ONLY 5 to 7 catchy opening hooks as a numbered list. Do NOT output a full script, captions, hashtags, or CTAs.]`;
            case "captions":
                return `Topic: "${topic}". [RULE: Output ONLY a clean social media post caption. Do NOT include video scripts, do NOT include hashtag lists, and do NOT include CTA bullet options.]`;
            case "hashtags":
                return `Topic: "${topic}". [RULE: Output ONLY 15 to 25 relevant hashtags separated by spaces. Do NOT include scripts, captions, intros, or CTAs. Do not truncate Hindi hashtags.]`;
            case "cta":
                return `Topic: "${topic}". [RULE: Output ONLY 5 to 7 strong Call To Action (CTA) lines as a numbered list. Do NOT output scripts, captions, or hashtags.]`;
            default:
                return topic;
        }
    }
 
 
    // ========================================== 
    // MAIN CONTENT GENERATOR 
    // ========================================== 
 
    if (generateBtn) { 
 
        generateBtn.addEventListener("click", async () => { 
 
            const topic = topicInput ? topicInput.value.trim() : ""; 
            const selectedContentType = 
                contentType ? contentType.value : "Instagram Reel"; 
            const selectedLanguage = 
                language ? language.value : "Hindi"; 
            const activeMode = activeContentMode;
 
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
 
            const finalTopicPayload = getModePrompt(topic, activeMode);
 
            setButtonLoading( 
                generateBtn, 
                "✨ Generating...", 
                "✨ Generate Content" 
            ); 
 
 
            if (result) { 
 
                result.innerHTML = ` 
                    <div style="text-align:center;"> 
                        <div style="font-size:24px; margin-bottom:8px;"> 
                            ✨ 
                        </div> 
 
                        <div> 
                            Creating your content... 
                        </div> 
                    </div> 
                `; 
 
            } 
 
 
            try { 
 
                const response = await fetch(`${API_BASE_URL}/generate`, { 
 
                    method: "POST", 
 
                    headers: { 
                        "Content-Type": "application/json" 
                    }, 
 
                    body: JSON.stringify({ 
 
                        topic: finalTopicPayload, 
 
                        contentType: 
                            selectedContentType, 
 
                        language: 
                            selectedLanguage 
 
                    }) 
 
                }); 
 
 
                let data; 
 
                try { 
                    data = await response.json(); 
                } catch (jsonError) { 
                    throw new Error( 
                        "Invalid response received from server." 
                    ); 
                } 
 
 
                if (!response.ok || !data.success) { 
 
                    throw new Error( 
                        data.error || 
                        "Content generation failed." 
                    ); 
 
                } 
 
 
                const generatedText = 
                    data.result || ""; 
 
 
                if (!generatedText.trim()) { 
 
                    throw new Error( 
                        "AI returned an empty response." 
                    ); 
 
                } 
 
 
                if (result) { 
 
                    result.innerHTML = ` 
                        <div class="ai-generated-content"> 
                            ${formatAIText(generatedText, activeMode)} 
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
 
                resetButton(generateBtn); 
 
            } 
 
        }); 
 
    } 
 
 
 
    // ========================================== 
    // CONTENT IDEAS GENERATOR 
    // ========================================== 
 
    if (generateIdeasBtn) { 
 
        generateIdeasBtn.addEventListener("click", async () => { 
 
            const topic = 
                ideasTopic ? ideasTopic.value.trim() : ""; 
 
            const selectedLanguage = 
                ideasLanguage ? 
                ideasLanguage.value : 
                "Hindi"; 
 
            const count = 
                ideasCount ? 
                parseInt(ideasCount.value, 10) : 
                10; 
 
 
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
 
 
            if (ideasResult) 
                ideasResult.innerHTML = ` 
                    <div style="text-align:center;"> 
                        <div style="font-size:24px; margin-bottom:8px;"> 
                            💡 
                        </div> 
 
                        <div> 
                            Generating fresh content ideas... 
                        </div> 
                    </div> 
                `; 
 
 
            try { 
 
                const response = await fetch( 
                    `${API_BASE_URL}/generate-ideas`, 
                    { 
 
                        method: "POST", 
 
                        headers: { 
                            "Content-Type": "application/json" 
                        }, 
 
                        body: JSON.stringify({ 
 
                            topic: topic, 
 
                            language: 
                                selectedLanguage, 
 
                            count: 
                                count 
 
                        }) 
 
                    } 
                ); 
 
 
                let data; 
 
                try { 
                    data = await response.json(); 
                } catch (jsonError) { 
                    throw new Error( 
                        "Invalid response received from server." 
                    ); 
                } 
 
 
                if (!response.ok || !data.success) { 
 
                    throw new Error( 
                        data.error || 
                        "Idea generation failed." 
                    ); 
 
                } 
 
 
                const ideas = 
                    Array.isArray(data.ideas) ? 
                    data.ideas : 
                    []; 
 
 
                if (ideas.length === 0) { 
 
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
 
                resetButton(generateIdeasBtn); 
 
            } 
 
        }); 
 
    } 
 
 
 
    // ========================================== 
    // RENDER CONTENT IDEAS 
    // ========================================== 
 
    function renderIdeas(ideas) { 
 
        if (!ideasResult) return; 
 
 
        ideasResult.innerHTML = ""; 
 
 
        ideas.forEach((idea, index) => { 
 
            const item = 
                document.createElement("div"); 
 
            item.className = "idea-item"; 
 
 
            const number = 
                document.createElement("div"); 
 
            number.className = "idea-number"; 
 
            number.textContent = 
                index + 1; 
 
 
            const content = 
                document.createElement("div"); 
 
            content.className = 
                "idea-content"; 
 
 
            const text = 
                document.createElement("div"); 
 
            text.className = 
                "idea-text"; 
 
            text.textContent = 
                String(idea); 
 
 
            const useButton = 
                document.createElement("button"); 
 
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
 
 
            content.appendChild(text); 
 
            content.appendChild(useButton); 
 
            item.appendChild(number); 
 
            item.appendChild(content); 
 
            ideasResult.appendChild(item); 
 
        }); 
 
    } 
 
 
 
    // ========================================== 
    // USE CONTENT IDEA 
    // ========================================== 
 
    function useIdea(idea, button) { 
 
        if (!topicInput) return; 
 
 
        topicInput.value = 
            idea; 
 
 
        topicInput.focus(); 
 
 
        window.scrollTo({ 
 
            top: 
                Math.max( 
                    0, 
                    topicInput.getBoundingClientRect().top + 
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
 
 
            setTimeout(() => { 
 
                button.textContent = 
                    originalText; 
 
                button.disabled = 
                    false; 
 
            }, 1500); 
 
        } 
 
    } 
 
 
 
    // ========================================== 
    // AI IMAGE GENERATOR 
    // ========================================== 
 
    if (generateImageBtn) { 
 
        generateImageBtn.addEventListener( 
            "click", 
            async () => { 
 
                const prompt = 
                    imagePrompt ? 
                    imagePrompt.value.trim() : 
                    ""; 
 
                const selectedImageType = 
                    imageType ? 
                    imageType.value : 
                    "Instagram Post"; 
 
                const selectedStyle = 
                    imageStyle ? 
                    imageStyle.value : 
                    "Modern Premium"; 
 
                const selectedSize = 
                    imageSize ? 
                    imageSize.value : 
                    "1K"; 
 
 
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
 
 
                    let data; 
 
                    try { 
                        data = 
                            await response.json(); 
                    } catch (jsonError) { 
 
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
                            "Image generation failed." 
                        ); 
 
                    } 
 
 
                    if (!data.image) { 
 
                        throw new Error( 
                            "No image was returned by the server." 
                        ); 
 
                    } 
 
 
                    renderGeneratedImage( 
                        data.image 
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
 
    function renderGeneratedImage(imageData) { 
 
        if (!imageResult) return; 
 
 
        imageResult.innerHTML = ""; 
 
 
        const wrapper = 
            document.createElement("div"); 
 
        wrapper.style.width = 
            "100%"; 
 
        wrapper.style.textAlign = 
            "center"; 
 
 
        const image = 
            document.createElement("img"); 
 
        image.className = 
            "generated-image"; 
 
        image.alt = 
            "AI generated image"; 
 
        image.loading = 
            "lazy"; 
 
        image.src = 
            imageData; 
 
 
        const downloadButton = 
            document.createElement("button"); 
 
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
 
 
        wrapper.appendChild(image); 
 
        wrapper.appendChild(downloadButton); 
 
        imageResult.appendChild(wrapper); 
 
    } 
 
 
 
    // ========================================== 
    // DOWNLOAD IMAGE 
    // ========================================== 
 
    function downloadImage(imageData) { 
 
        try { 
 
            const link = 
                document.createElement("a"); 
 
            link.href = 
                imageData; 
 
            link.download = 
                "ai-content-agent-image.png"; 
 
            document.body.appendChild(link); 
 
            link.click(); 
 
            document.body.removeChild(link); 
 
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
 
 
 
    // ========================================== 
    // ENTER / SHORTCUT SUPPORT 
    // ========================================== 
 
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

    // ========================================== 
    // DASHBOARD CARDS MODE ATTACHMENT 
    // ========================================== 

    function attachCardMode(cardElement, modeName, defaultContentType) {
        if (!cardElement) return;

        cardElement.addEventListener("click", () => {
            activeContentMode = modeName;
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
 
    console.log( 
        "AI Content Agent frontend loaded successfully." 
    ); 
 
});