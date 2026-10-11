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

    // Window-level synced active mode
    window.currentGeneratorMode = "general";
 
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
    // STRICT EXTRACTION & CLEANING PIPELINE
    // ========================================== 

    function sanitizeMarkdown(rawText, preserveHashtags = false) {
        if (!rawText) return "";

        let text = String(rawText);

        text = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
        text = text.replace(/```[\s\S]*?```/g, "");
        text = text.replace(/`([^`]+)`/g, "$1");
        text = text.replace(/`/g, "");

        // Remove horizontal rules & escapes
        text = text.replace(/^[ \t]*\\?[-—_*]{3,}[ \t]*$/gm, "");
        text = text.replace(/\\([#*_`[\]()\-+!.]|[—–])/g, "$1");

        // Remove heading marks (#, ##, ###, ####)
        text = text.replace(/^[ \t]*#{1,6}[ \t]*/gm, "");

        // Remove bold and italics
        text = text.replace(/\*\*\*([^*]+)\*\*\*/g, "$1");
        text = text.replace(/\*\*([^*]+)\*\*/g, "$1");
        text = text.replace(/__([^_]+)__/g, "$1");
        text = text.replace(/\*([^*\n]+)\*/g, "$1");
        text = text.replace(/_([^_\n]+)_/g, "$1");
        text = text.replace(/[*_]{1,3}/g, "");

        // Remove list bullets
        text = text.replace(/^[ \t]*[•*+–—][ \t]+/gm, "");
        text = text.replace(/^[ \t]*-[ \t]+(?!\d)/gm, "");

        // Strip lone # symbols unless in hashtags mode
        if (!preserveHashtags) {
            text = text.replace(/(^|\s)#(?!\w)/g, "$1");
            text = text.replace(/#/g, "");
        }

        text = text.replace(/\n{3,}/g, "\n\n");
        return text.trim();
    }

    // 1. HASHTAGS: # ke sath aur bina # ke bhejey gaye tags dono ko properly handle karega
    function extractHashtagsOnly(rawText) {
        if (!rawText) return "";

        const text = String(rawText).replace(/\r\n/g, "\n");

        // Pehle check karo agar direct # tags mojood hain
        const directMatches = text.match(/#([\p{L}\p{N}_\u0900-\u097F]+)/gu);
        if (directMatches && directMatches.length > 0) {
            const seen = new Set();
            const uniqueHashtags = [];
            for (let tag of directMatches) {
                const cleanTag = tag.trim();
                const key = cleanTag.toLowerCase();
                if (!seen.has(key)) {
                    seen.add(key);
                    uniqueHashtags.push(cleanTag);
                }
                if (uniqueHashtags.length === 25) break;
            }
            return uniqueHashtags.join(" ");
        }

        // Agar AI ne bina # ke text ke end me tag list daali hai (jaise tere response me tha)
        const lines = text.split("\n");
        let candidateText = "";

        // Caption ya CTA ke baad aane wali last lines dhoondo
        for (let i = lines.length - 1; i >= 0; i--) {
            const line = lines[i].trim();
            if (!line) continue;
            if (/^(?:कैप्शन|caption|स्क्रिप्ट|script|संवाद|दृश्य)/i.test(line)) break;
            if (line.includes("hashtag") || line.includes("हैशटैग") || /[\u0900-\u097F]+/.test(line)) {
                candidateText = line + " " + candidateText;
            }
        }

        if (candidateText) {
            // Words ko extract karke filter karo
            const words = candidateText
                .replace(/^(?:कैप्शन|caption|hashtags?|हैशटैग|cta|script)[\s:-]*/gi, "")
                .replace(/[\(\),\.!?:;\/\\|]/g, " ")
                .split(/\s+/)
                .filter(w => w.length > 2 && !/^(?:और|या|का|की|के|में|से|को|है|हैं|यह|वह|video|hashtag|cta|script)$/i.test(w));

            const seen = new Set();
            const uniqueHashtags = [];

            for (let word of words) {
                const cleanWord = word.replace(/^[#_]+|[#_]+$/g, "");
                if (!cleanWord) continue;
                const tag = "#" + cleanWord;
                const key = tag.toLowerCase();
                if (!seen.has(key)) {
                    seen.add(key);
                    uniqueHashtags.push(tag);
                }
                if (uniqueHashtags.length === 25) break;
            }

            if (uniqueHashtags.length > 0) {
                return uniqueHashtags.join(" ");
            }
        }

        return "";
    }

    // 2. SCRIPTS: 'कैप्शन (Caption):' ya hashtags aate hi aage ka sab stop
    function cleanScriptsOutput(rawText) {
        if (!rawText) return "";

        let text = sanitizeMarkdown(rawText, false);
        const lines = text.split("\n");
        const scriptLines = [];

        // Exact Hindi triggers
        const stopTriggers = /^(?:कैप्शन|caption|post caption|हैशटैग|hashtags?|कॉल टू एक्शन|cta|call to action|निष्कर्ष|conclusion)(?:\s*\([^)]*\))?\s*[:\-–]?/i;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();

            if (stopTriggers.test(line)) {
                break;
            }

            // Agar achanak se plain tag list shuru ho jaye
            if (line.includes("hashtag cta script") || /(?:#[a-zA-Z0-9_\u0900-\u097F]+\s*){2,}/.test(line)) {
                break;
            }

            scriptLines.push(lines[i]);
        }

        let cleaned = scriptLines.join("\n").trim();
        const hardCutRegex = /\n\s*(?:(?:📌|📝|💬|📢|🎯|#️⃣)?\s*(?:कैप्शन|caption|हैशटैग|hashtags?|cta|call to action)(?:\s*\([^)]*\))?[\s:-][\s\S]*$)/i;
        cleaned = cleaned.replace(hardCutRegex, "");

        return cleaned.trim();
    }

    // 3. HOOKS: Script ke shuru ka Hook part ya numbered hooks extract karega
    function cleanHooksOutput(rawText) {
        if (!rawText) return "";

        const text = String(rawText);
        const lines = text.split(/\r?\n/);
        const hookLines = [];

        // Tere AI format me: (० से ३ सेकंड - हुक) ke baad ka samvaad
        let captureNext = false;
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (/हुक|hook/i.test(line)) {
                captureNext = true;
                continue;
            }
            if (captureNext && line) {
                const cleanDialogue = line.replace(/^(?:संवाद|dialogue)[\s:-]*/i, "").trim();
                hookLines.push(`1. ${cleanDialogue}`);
                captureNext = false;
                break;
            }
        }

        // Agar standard numbered hooks aaye hon
        if (hookLines.length === 0) {
            lines.forEach(line => {
                const trimmed = sanitizeMarkdown(line, false).trim();
                if (!trimmed) return;
                const match = trimmed.match(/^(?:Hook\s*\d*[\s:-]+|\d+[\).]\s*)(.*)/i);
                if (match && match[1].trim() && hookLines.length < 7) {
                    hookLines.push(`${hookLines.length + 1}. ${match[1].trim()}`);
                }
            });
        }

        return hookLines.join("\n").trim();
    }

    // 4. CAPTIONS: Sirf 'कैप्शन (Caption):' ke baad ka text, tags nahi
    function cleanCaptionsOutput(rawText) {
        if (!rawText) return "";

        let text = sanitizeMarkdown(rawText, false);

        // Find caption block
        const captionMatch = text.match(/(?:कैप्शन|caption)(?:\s*\([^)]*\))?\s*[:\-–]+([\s\S]*?)(?=\n\s*(?:एलआईसी|#|हैशटैग|hashtags?|cta|call to action|$))/i);
        if (captionMatch && captionMatch[1].trim()) {
            let cap = captionMatch[1].trim();
            // Remove ending tag sentence
            cap = cap.replace(/\n\s*[\u0900-\u097F\s]+(?:hashtag|cta|script)[\s\S]*$/i, "");
            return cap.trim();
        }

        return text.trim();
    }

    // 5. CTA: Caption me se ya text me se action lines (comment karein, share karein, DM karein)
    function cleanCTAOutput(rawText) {
        if (!rawText) return "";

        const text = sanitizeMarkdown(rawText, false);
        const lines = text.split("\n");
        const ctaLines = [];

        const actionWords = /(?:कमेंट|टिप्पणी|शेयर|share|संपर्क|contact|dm|फॉलो|follow|शुरुआत कीजिए|देर मत कीजिए|क्लिक करें|call)/i;

        lines.forEach(line => {
            const trimmed = line.trim();
            if (!trimmed) return;
            if (/^(?:कैप्शन|caption|संवाद|दृश्य|अवधि|विषय|रिफ़्रेश)/i.test(trimmed)) return;

            // Agar line me action word hai aur choti actionable line hai
            if (actionWords.test(trimmed) && trimmed.length < 160) {
                ctaLines.push(`${ctaLines.length + 1}. ${trimmed}`);
            }
        });

        if (ctaLines.length > 0) {
            return ctaLines.slice(0, 5).join("\n");
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

            if (/^(?:Hook|Body|Outro|Main Script|Target Duration|Topic|विषय|अवधि|संवाद|दृश्य|हुक|बॉडी|आउट्रो)[\s:-]/i.test(trimmed)) {
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
                return `Topic: "${topic}". [RULE: Output ONLY 15 to 25 relevant hashtags separated by spaces starting with #. Do NOT include scripts, captions, intros, or CTAs.]`;
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
            const selectedContentType = contentType ? contentType.value : "Instagram Reel"; 
            const selectedLanguage = language ? language.value : "Hindi"; 
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
                        <div style="font-size:24px; margin-bottom:8px;">✨</div> 
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
                    if (responseText.includes("502") || responseText.includes("504") || responseText.includes("Bad Gateway") || responseText.includes("Gateway Timeout")) {
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
 
                if (!generatedText.trim()) { 
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
 
    // ========================================== 
    // CONTENT IDEAS GENERATOR 
    // ========================================== 
 
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
                        <div style="font-size:24px; margin-bottom:8px;">💡</div> 
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
 
    // ========================================== 
    // RENDER CONTENT IDEAS 
    // ========================================== 
 
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
 
    // ========================================== 
    // USE CONTENT IDEA 
    // ========================================== 
 
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
 
    // ========================================== 
    // AI IMAGE GENERATOR 
    // ========================================== 
 
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
 
    // ========================================== 
    // RENDER GENERATED IMAGE 
    // ========================================== 
 
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
 
    // ========================================== 
    // DOWNLOAD IMAGE 
    // ========================================== 
 
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
 
    // ========================================== 
    // ENTER / SHORTCUT SUPPORT 
    // ========================================== 
 
    if (topicInput) { 
        topicInput.addEventListener("keydown", (event) => { 
            if (event.ctrlKey && event.key === "Enter") { 
                event.preventDefault(); 
                if (generateBtn) generateBtn.click(); 
            } 
        }); 
    } 
 
    if (ideasTopic) { 
        ideasTopic.addEventListener("keydown", (event) => { 
            if (event.ctrlKey && event.key === "Enter") { 
                event.preventDefault(); 
                if (generateIdeasBtn) generateIdeasBtn.click(); 
            } 
        }); 
    } 
 
    if (imagePrompt) { 
        imagePrompt.addEventListener("keydown", (event) => { 
            if (event.ctrlKey && event.key === "Enter") { 
                event.preventDefault(); 
                if (generateImageBtn) generateImageBtn.click(); 
            } 
        }); 
    } 

    // ========================================== 
    // DASHBOARD CARDS MODE ATTACHMENT 
    // ========================================== 

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

    // Global helper taaki index.html ka script bhi mode ko correctly set kare
    window.triggerSpecificContentMode = function(modeName, defaultContentType) {
        window.currentGeneratorMode = modeName;
        if (contentType && defaultContentType) {
            contentType.value = defaultContentType;
        }
    };
 
    console.log("AI Content Agent frontend loaded successfully."); 
});