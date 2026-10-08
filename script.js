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


    function formatAIText(text) {
        if (!text) {
            return "";
        }

        return escapeHTML(text)
            .replace(/\r\n/g, "\n")
            .replace(/\r/g, "\n")
            .replace(/\n/g, "<br>");
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

                const response = await fetch("/generate", {

                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({

                        topic: topic,

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
                            ${formatAIText(generatedText)}
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


            if (ideasResult) {

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

            }


            try {

                const response = await fetch(
                    "/generate-ideas",
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
                            "/generate-image",
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


    console.log(
        "AI Content Agent frontend loaded successfully."
    );

});