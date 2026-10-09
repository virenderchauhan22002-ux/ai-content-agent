const express = require("express");
const cors = require("cors");
require("dotenv").config();

const { GoogleGenAI } = require("@google/genai");
const { InferenceClient } = require("@huggingface/inference");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});

const hf = new InferenceClient(process.env.HF_TOKEN);


// ===============================
// GEMINI TEXT GENERATOR
// ===============================

async function generateGeminiText(
    prompt,
    model = "gemini-3.8-flash"
) {
    const response = await ai.models.generateContent({
        model: model,
        contents: prompt
    });

    return response.text || "";
}


// ===============================
// HOME
// ===============================

app.get("/", (req, res) => {
    res.sendFile(__dirname + "/index.html");
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

        let result = "";

        try {
            result = await generateGeminiText(
                prompt,
                "gemini-3.8-flash"
            );
        } catch (primaryError) {
            console.log(
                "Primary generate model failed, trying fallback model..."
            );

            result = await generateGeminiText(
                prompt,
                "gemini-3.7-flash"
            );
        }

        res.json({
            success: true,
            result: result
        });

    } catch (error) {
        console.error("Generate Error:", error);

        res.status(500).json({
            success: false,
            error: error.message || "Failed to generate content."
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

        const ideaCount = count || 10;

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

        let text = "";

        try {
            text = await generateGeminiText(
                prompt,
                "gemini-3.8-flash"
            );
        } catch (primaryError) {
            console.log(
                "Primary model failed, trying fallback model..."
            );

            text = await generateGeminiText(
                prompt,
                "gemini-3.7-flash"
            );
        }

        const ideas = text
            .split("\n")
            .map(line =>
                line.replace(/^\s*\d+[\.\)\-:]\s*/, "").trim()
            )
            .filter(line => line.length > 0)
            .slice(0, ideaCount);

        res.json({
            success: true,
            ideas: ideas
        });

    } catch (error) {
        console.error("Ideas Error:", error);

        res.status(500).json({
            success: false,
            error: error.message || "Failed to generate ideas."
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

        const recentMessages = Array.isArray(messages)
            ? messages.slice(-20)
            : [];

        const conversation = recentMessages
            .map(message => {
                const role = message.role || "user";
                const content = message.content || "";

                return `${role.toUpperCase()}: ${content}`;
            })
            .join("\n");

        const prompt = `
You are AI Content Agent, a helpful AI assistant.

Language:
${language || "Hindi"}

Conversation:
${conversation}

Instructions:
- Reply naturally and helpfully.
- Understand the previous conversation.
- Give practical answers.
- If the user asks about content creation, provide useful suggestions.
- Keep the answer clear and easy to understand.
`;

        let reply = "";

        try {
            reply = await generateGeminiText(
                prompt,
                "gemini-3.8-flash"
            );
        } catch (primaryError) {
            console.log(
                "Primary chat model failed, trying fallback model..."
            );

            reply = await generateGeminiText(
                prompt,
                "gemini-3.7-flash"
            );
        }

        res.json({
            success: true,
            reply: reply
        });

    } catch (error) {
        console.error("Chat Error:", error);

        res.status(500).json({
            success: false,
            error: error.message || "Failed to generate chat response."
        });
    }
});


// ===============================
// AI IMAGE GENERATOR
// ===============================

app.post("/generate-image", async (req, res) => {
    try {
        const {
            prompt,
            imageType,
            style,
            imageSize
        } = req.body;

        if (!process.env.HF_TOKEN) {
            return res.status(500).json({
                success: false,
                error: "HF_TOKEN is not configured on the server."
            });
        }

        let width = 1024;
        let height = 1024;

        if (imageType === "portrait") {
            width = 768;
            height = 1024;
        }

        if (imageType === "landscape") {
            width = 1024;
            height = 768;
        }

        if (imageType === "square") {
            width = 1024;
            height = 1024;
        }

        if (imageSize === "small") {
            width = 512;
            height = 512;
        }

        if (imageSize === "medium") {
            width = 768;
            height = 768;
        }

        if (imageSize === "large") {
            width = 1024;
            height = 1024;
        }

        const finalPrompt = `
${prompt}

Image type: ${imageType || "square"}
Style: ${style || "realistic"}

Create a high-quality image suitable for social media content.
`;

        const image = await hf.textToImage({
            model: "black-forest-labs/FLUX.1-schnell",
            provider: "fal-ai",
            inputs: finalPrompt,
            parameters: {
                width: width,
                height: height,
                num_inference_steps: 4
            }
        });

        const arrayBuffer = await image.arrayBuffer();

        const buffer = Buffer.from(arrayBuffer);

        const imageBase64 = buffer.toString("base64");

        res.json({
            success: true,
            image: "data:image/png;base64," + imageBase64
        });

    } catch (error) {
        console.error("Image Error:", error);

        res.status(500).json({
            success: false,
            error: error.message || "Failed to generate image."
        });
    }
});


// ===============================
// SERVER
// ===============================

const PORT = process.env.PORT || 3000;

const server = app.listen(
    PORT,
    "0.0.0.0",
    () => {
        console.log(
            "Server running on port " + PORT
        );
    }
);

server.on("error", (error) => {
    console.error("Server Error:", error);
});