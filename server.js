const express = require("express");
const cors = require("cors");
require("dotenv").config();

const { GoogleGenAI } = require("@google/genai");
const { InferenceClient } = require("@huggingface/inference");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));
const authOtpRouter = require("./auth-otp");
app.use("/api/auth", authOtpRouter);

const websiteBuilderRouter = require("./website-builder");
app.use("/api/websites", websiteBuilderRouter);

// Unknown /api routes and body-parse errors must return JSON, not HTML.
app.use("/api", (req, res) => {
    res.status(404).json({
        success: false,
        message: "API route not found: " + req.method + " " + req.originalUrl
    });
});

app.use((err, req, res, next) => {
    if (res.headersSent) {
        return next(err);
    }
    console.error("Request error:", err.message);
    res.status(err.status || 500).json({
        success: false,
        message: err.status === 400
            ? "Invalid request data."
            : "Unexpected server error."
    });
});

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});

const hf = new InferenceClient(process.env.HF_TOKEN);


// ===============================
// WAIT HELPER
// ===============================

function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}


// ===============================
// ERROR MESSAGE HELPER
// ===============================

function getErrorMessage(error) {
    if (!error) {
        return "Unknown error";
    }

    if (typeof error.message === "string") {
        return error.message;
    }

    if (typeof error === "string") {
        return error;
    }

    try {
        return JSON.stringify(error);
    } catch {
        return "Unknown error";
    }
}


// ===============================
// TEMPORARY GEMINI ERROR CHECK
// ===============================

function isTemporaryGeminiError(error) {
    const message = getErrorMessage(error).toLowerCase();

    const status =
        error?.status ||
        error?.code ||
        error?.response?.status ||
        "";

    return (
        String(status).includes("503") ||
        String(status).toLowerCase().includes("unavailable") ||
        message.includes("503") ||
        message.includes("unavailable") ||
        message.includes("high demand") ||
        message.includes("overloaded") ||
        message.includes("temporarily unavailable") ||
        message.includes("service unavailable") ||
        message.includes("resource exhausted") ||
        message.includes("too many requests") ||
        message.includes("429")
    );
}


// ===============================
// GEMINI TEXT GENERATOR
// ===============================

async function generateGeminiText(prompt, model) {

    const maxRetries = 2;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {

        try {

            console.log(
                `Gemini request: ${model} | attempt ${attempt}`
            );

            const response = await ai.models.generateContent({
                model: model,
                contents: prompt
            });

            const text = response?.text || "";

            if (!text.trim()) {
                throw new Error(
                    `${model} returned an empty response.`
                );
            }

            return text;

        } catch (error) {

            const message = getErrorMessage(error);

            console.error(
                `${model} attempt ${attempt} failed:`,
                message
            );

            const temporary =
                isTemporaryGeminiError(error);

            // If it is not a temporary error,
            // immediately move to the next fallback model.
            if (!temporary) {
                throw error;
            }

            // Last retry for this model
            if (attempt === maxRetries) {
                throw error;
            }

            const delay =
                attempt === 1
                    ? 2500
                    : 5000;

            console.log(
                `Retrying ${model} in ${delay / 1000} seconds...`
            );

            await wait(delay);
        }
    }

    throw new Error(
        `${model} request failed.`
    );
}


// ===============================
// GEMINI WITH MULTI-MODEL FALLBACK
// ===============================

async function generateWithFallback(prompt) {

    const models = [
        "gemini-3.5-flash-lite",
        "gemini-3.1-flash-lite",
        "gemini-3.8-flash"
    ];

    let lastError = null;

    for (const model of models) {

        try {

            console.log(
                `Trying Gemini model: ${model}`
            );

            const result =
                await generateGeminiText(
                    prompt,
                    model
                );

            console.log(
                `Gemini success: ${model}`
            );

            return result;

        } catch (error) {

            lastError = error;

            console.error(
                `${model} failed:`,
                getErrorMessage(error)
            );

            console.log(
                `Moving to next Gemini fallback model...`
            );
        }
    }

    console.error(
        "All Gemini fallback models failed."
    );

    throw new Error(
        "AI service is temporarily busy. Please try again in a few seconds."
    );
}


// ===============================

// WEBSITE BUILDER: GEMINI + GROQ FALLBACK
async function generateWebsiteWithFallback(prompt) {

    try {
        console.log("Website Builder: Trying Gemini...");
        return await generateWithFallback(prompt);

    } catch (error) {
        console.warn(
            "Website Builder: Gemini unavailable. Trying Groq Qwen...",
            getErrorMessage(error)
        );
    }

    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
        throw new Error("Groq API key is not configured.");
    }

    const response = await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
            method: "POST",
            headers: {
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "qwen/qwen3.8-27b",
                messages: [{ role: "user", content: prompt }],
                temperature: 0.2,
                max_tokens: 6000
            })
        }
    );

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        console.error("Groq error:", response.status, data.error?.message);
        throw new Error("Website Builder AI providers are temporarily unavailable.");
    }

    const result = data?.choices?.[0]?.message?.content;

    if (typeof result !== "string" || !result.trim()) {
        throw new Error("Groq returned an empty response.");
    }

    console.log("Website Builder: Groq Qwen generation successful.");
    return result.trim();
}

websiteBuilderRouter.setWebsiteGenerator(generateWebsiteWithFallback);

// HOME
// ===============================

app.get("/", (req, res) => {

    res.sendFile(
        __dirname + "/index.html"
    );
});


// ===============================
// GENERATE CONTENT
// ===============================

app.post("/generate", async (req, res) => {

    try {

        const {
            topic,
            contentType,
            language
        } = req.body;

        if (!topic || !String(topic).trim()) {

            return res.status(400).json({
                success: false,
                error: "Please enter a topic."
            });
        }

        const prompt = `
You are an expert content creator.

Create high-quality ${contentType} content about:

Topic: ${topic}

Language: ${language}

Requirements:
- Make the content useful and engaging.
- Keep it natural and easy to understand.
- Avoid unnecessary English words when the requested language is Hindi.
- Give only the requested content.
`;

        const result =
            await generateWithFallback(prompt);

        res.json({
            success: true,
            result: result
        });

    } catch (error) {

        console.error(
            "Generate Error:",
            getErrorMessage(error)
        );

        res.status(503).json({
            success: false,
            error:
                "AI service is temporarily busy. Please try again in a few seconds."
        });
    }
});


// ===============================
// GENERATE CONTENT IDEAS
// ===============================

app.post("/generate-ideas", async (req, res) => {

    try {

        const {
            topic,
            language,
            count
        } = req.body;

        if (!topic || !String(topic).trim()) {

            return res.status(400).json({
                success: false,
                error: "Please enter a topic."
            });
        }

        const ideaCount =
            Number(count) || 10;

        const prompt = `
Generate ${ideaCount} fresh and practical content ideas.

Topic:
${topic}

Language:
${language}

Rules:
- Every idea must be unique.
- Ideas should be useful for social media content.
- Keep them interesting and practical.
- Number each idea from 1 to ${ideaCount}.
- Do not add unnecessary explanations.
`;

        const text =
            await generateWithFallback(prompt);

        const ideas = text
            .split("\n")
            .map(line =>
                line
                    .replace(
                        /^\s*(?:\d+[\.\)\-:]|\*+|\-)\s*/,
                        ""
                    )
                    .trim()
            )
            .filter(
                line => line.length > 0
            )
            .slice(0, ideaCount);

        res.json({
            success: true,
            ideas: ideas
        });

    } catch (error) {

        console.error(
            "Ideas Error:",
            getErrorMessage(error)
        );

        res.status(503).json({
            success: false,
            error:
                "AI service is temporarily busy. Please try again in a few seconds."
        });
    }
});


// ===============================
// AI CHAT
// ===============================

app.post("/chat", async (req, res) => {

    try {

        const {
            messages,
            language
        } = req.body;

        const recentMessages =
            Array.isArray(messages)
                ? messages.slice(-20)
                : [];

        const conversation =
            recentMessages
                .map(message => {

                    const role =
                        message.role || "user";

                    const content =
                        message.content || "";

                    return `${role.toUpperCase()}: ${content}`;
                })
                .join("\n");

        const prompt = `
You are AI Content Agent, a friendly and helpful AI assistant. You chat like a normal
conversational assistant, and you are also very good at content creation (reels, captions,
scripts, hooks, ideas, websites and code).

User's preferred language:
${language || "Hindi"}

Conversation:
${conversation}

Instructions:
- Reply to the latest USER message directly and naturally, like a normal chat.
- Do not repeat the question, do not write a long introduction, and never start with "ASSISTANT:".
- Reply in the same language and style the user writes in (Hindi, English or Hinglish).
  Use the preferred language above only when the user's language is unclear.
- Understand the previous conversation and keep the context.
- Give practical, clear and accurate answers. Keep casual messages short.
- Use Markdown only when it helps: short bullet lists, **bold** for key words and code blocks
  for code. Do not use big headings for short answers.
- If the user asks about content creation, give ready-to-use suggestions.
`;

        const reply =
            await generateWithFallback(prompt);

        res.json({
            success: true,
            reply: reply
        });

    } catch (error) {

        console.error(
            "Chat Error:",
            getErrorMessage(error)
        );

        res.status(503).json({
            success: false,
            error:
                "AI service is temporarily busy. Please try again in a few seconds."
        });
    }
});


// ===============================
// AI IMAGE GENERATOR
// ===============================

app.post("/generate-image-replicate", async (req, res) => {
    try {
        const {
            prompt,
            imageType,
            style,
            imageSize
        } = req.body || {};

        const token = process.env.REPLICATE_API_TOKEN;

        if (!token) {
            return res.status(500).json({
                success: false,
                error: "REPLICATE_API_TOKEN is not configured on the server."
            });
        }

        if (typeof prompt !== "string" || !prompt.trim()) {
            return res.status(400).json({
                success: false,
                error: "Please enter an image prompt."
            });
        }

        if (prompt.trim().length > 4000) {
            return res.status(400).json({
                success: false,
                error: "Prompt is too long. Maximum 4000 characters."
            });
        }

        if (imageSize && imageSize !== "1K") {
            return res.status(400).json({
                success: false,
                error: "Currently only 1K image generation is supported."
            });
        }

        const aspectRatios = {
            "Instagram Post": "4:5",
            "Instagram Story": "9:16",
            "YouTube Thumbnail": "16:9",
            "Poster": "3:4",
            "Square Post": "1:1"
        };

        const aspectRatio = aspectRatios[imageType] || "1:1";

        const finalPrompt = `${prompt.trim()}

Image type: ${imageType || "Square Post"}
Visual style: ${style || "Modern Premium"}

Create a high-quality image suitable for social media content.`;

        const replicateResponse = await fetch(
            "https://api.replicate.com/v1/models/black-forest-labs/flux-schnell/predictions",
            {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json",
                    "Prefer": "wait"
                },
                body: JSON.stringify({
                    input: {
                        prompt: finalPrompt,
                        go_fast: true,
                        megapixels: "1",
                        num_outputs: 1,
                        aspect_ratio: aspectRatio,
                        output_format: "png",
                        num_inference_steps: 4
                    }
                })
            }
        );

        let prediction = await replicateResponse.json();

        if (!replicateResponse.ok) {
            console.error("Replicate API error:", prediction.detail || prediction.error || replicateResponse.status);
            return res.status(502).json({
                success: false,
                error: prediction.detail || prediction.error || "Replicate image generation request failed."
            });
        }

        if (prediction.status !== "succeeded") {
            const predictionUrl = prediction.urls?.get;

            if (!predictionUrl) {
                throw new Error("Replicate did not return a prediction status URL.");
            }

            const parsedPredictionUrl = new URL(predictionUrl);

            if (
                parsedPredictionUrl.protocol !== "https:" ||
                parsedPredictionUrl.hostname !== "api.replicate.com"
            ) {
                throw new Error("Invalid Replicate prediction URL.");
            }

            for (let attempt = 0; attempt < 20; attempt++) {
                if (
                    prediction.status === "failed" ||
                    prediction.status === "canceled"
                ) {
                    throw new Error(prediction.error || "Image generation did not complete.");
                }

                await new Promise(resolve => setTimeout(resolve, 1500));

                const statusResponse = await fetch(predictionUrl, {
                    headers: {
                        "Authorization": `Bearer ${token}`
                    }
                });

                prediction = await statusResponse.json();

                if (!statusResponse.ok) {
                    throw new Error("Could not check Replicate prediction status.");
                }

                if (prediction.status === "succeeded") {
                    break;
                }
            }
        }

        if (prediction.status !== "succeeded") {
            throw new Error(
                prediction.error || "Image generation timed out. Please try again."
            );
        }

        const outputUrl = Array.isArray(prediction.output)
            ? prediction.output[0]
            : prediction.output;

        if (typeof outputUrl !== "string") {
            throw new Error("Replicate did not return an image URL.");
        }

        const parsedOutputUrl = new URL(outputUrl);

        if (
            parsedOutputUrl.protocol !== "https:" ||
            !(
                parsedOutputUrl.hostname === "replicate.delivery" ||
                parsedOutputUrl.hostname.endsWith(".replicate.delivery")
            )
        ) {
            throw new Error("Invalid generated image URL.");
        }

        const imageResponse = await fetch(outputUrl);

        if (!imageResponse.ok) {
            throw new Error("Could not download the generated image.");
        }

        const contentType = imageResponse.headers.get("content-type") || "";

        if (!contentType.toLowerCase().startsWith("image/png")) {
            throw new Error("Replicate returned an unexpected image format.");
        }

        const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());

        if (!imageBuffer.length || imageBuffer.length > 20 * 1024 * 1024) {
            throw new Error("Generated image is empty or exceeds the allowed size.");
        }

        const imageBase64 = imageBuffer.toString("base64");

        return res.json({
            success: true,
            image: "data:image/png;base64," + imageBase64
        });

    } catch (error) {
        console.error("Image Error:", getErrorMessage(error));

        return res.status(500).json({
            success: false,
            error: getErrorMessage(error) || "Failed to generate image."
        });
    }
});

// ===============================
app.post("/generate-image", async (req, res) => {
    try {
        const { prompt, imageType, style, imageSize } = req.body || {};
        const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
        const apiToken = process.env.CLOUDFLARE_API_TOKEN;

        if (!accountId || !apiToken) {
            return res.status(500).json({ success: false, error: "Cloudflare configuration is missing." });
        }

        if (typeof prompt !== "string" || !prompt.trim()) {
            return res.status(400).json({ success: false, error: "Please enter an image prompt." });
        }

        if (prompt.trim().length > 1800) {
            return res.status(400).json({ success: false, error: "Prompt is too long. Maximum 1800 characters." });
        }

        if (imageSize && imageSize !== "1K") {
            return res.status(400).json({ success: false, error: "Currently only 1K image generation is supported." });
        }

        const allowedTypes = ["Instagram Post", "Instagram Story", "YouTube Thumbnail", "Poster", "Square Post"];
        const allowedStyles = ["Modern Premium", "Clean Minimal", "Professional", "Realistic", "Cinematic", "Creative"];

        const safeImageType = allowedTypes.includes(imageType) ? imageType : "Square Post";
        const safeStyle = allowedStyles.includes(style) ? style : "Modern Premium";

        const finalPrompt = `${prompt.trim()}\n\nImage type: ${safeImageType}\nVisual style: ${safeStyle}\n\nCreate a high-quality image suitable for social media content.`;

        const response = await fetch(
            `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/@cf/black-forest-labs/flux-1-schnell`,
            {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${apiToken}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ prompt: finalPrompt, steps: 4 }),
                signal: AbortSignal.timeout(120000)
            }
        );

        const result = await response.json();

        if (!response.ok || !result.success) {
            console.error("Cloudflare image API error:", result.errors || result);
            return res.status(502).json({ success: false, error: "Image generation service failed." });
        }

        const imageBase64 = result.result?.image;

        if (typeof imageBase64 !== "string" || !imageBase64 || imageBase64.length > 20 * 1024 * 1024) {
            return res.status(502).json({ success: false, error: "Image service returned an invalid image." });
        }

        return res.json({
            success: true,
            image: "data:image/jpeg;base64," + imageBase64
        });

    } catch (error) {
        console.error("Image generation error:", error.message);
        return res.status(500).json({ success: false, error: "Image generation failed. Please try again." });
    }
});
// SERVER
// ===============================

const PORT =
    process.env.PORT || 3000;

const server =
    app.listen(
        PORT,
        "0.0.0.0",
        () => {

            console.log(
                "Server running on port " +
                PORT
            );
        }
    );

server.on(
    "error",
    (error) => {

        console.error(
            "Server Error:",
            error
        );
    }
);