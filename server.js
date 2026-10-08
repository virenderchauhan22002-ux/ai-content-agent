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

app.get("/", (req, res) => {
    res.sendFile(__dirname + "/index.html");
});


// ==========================================
// AI CONTENT GENERATOR
// ==========================================

app.post("/generate", async (req, res) => {
    try {
        const topic = req.body.topic;
        const contentType = req.body.contentType;
        const language = req.body.language;

        if (!topic || !topic.trim()) {
            return res.status(400).json({
                error: "Topic is required."
            });
        }

        console.log("Generating content for:", topic);
        console.log("Content Type:", contentType);
        console.log("Language:", language);

        const prompt =
            "You are an expert social media content creator.\n\n" +
            "Create content based on the following:\n\n" +
            "Topic:\n" + topic +
            "\n\nContent Type:\n" + (contentType || "Instagram Reel") +
            "\n\nLanguage:\n" + (language || "Hindi") +
            "\n\nIMPORTANT:\n" +
            "Write the complete response in the selected language.\n\n" +
            "Create content specifically suitable for the selected content type.\n\n" +
            "Give me:\n\n" +
            "1. Hook\n" +
            "2. Main Content / Script\n" +
            "3. CTA\n" +
            "4. Caption\n" +
            "5. Hashtags\n\n" +
            "Keep the content practical, engaging, natural and easy to understand.\n\n" +
            "Do not mention that you are an AI.\n" +
            "Do not add unnecessary explanations.";

        const interaction = await ai.interactions.create({
            model: "gemini-3.8-flash",
            input: prompt
        });

        console.log("AI response received.");

        res.json({
            success: true,
            result: interaction.output_text || ""
        });

    } catch (error) {
        console.error("Gemini Error:", error);

        res.status(500).json({
            success: false,
            error: error.message || "AI generation failed."
        });
    }
});


// ==========================================
// CONTENT IDEAS
// ==========================================

app.post("/generate-ideas", async (req, res) => {
    try {
        const topic = req.body.topic;
        const language = req.body.language;
        const count = req.body.count;

        if (!topic || !topic.trim()) {
            return res.status(400).json({
                error: "Topic is required."
            });
        }

        console.log("Generating content ideas for:", topic);
        console.log("Language:", language);
        console.log("Ideas Count:", count);

        const prompt =
            "You are an expert social media content strategist.\n\n" +
            "Generate " + (count || 10) + " fresh and useful content ideas.\n\n" +
            "Topic:\n" + topic +
            "\n\nLanguage:\n" + (language || "Hindi") +
            "\n\nIMPORTANT:\n" +
            "- Write every idea in the selected language.\n" +
            "- Make every idea different.\n" +
            "- Keep ideas practical and engaging.\n" +
            "- Ideas should be suitable for social media content.\n" +
            "- Avoid repetitive ideas.\n" +
            "- Do not add unnecessary explanations.\n" +
            "- Do not mention that you are an AI.\n\n" +
            "For financial, insurance, tax, legal or government-related topics:\n" +
            "- Do not invent facts, guarantees or legal claims.\n" +
            "- Do not automatically claim that returns are guaranteed.\n" +
            "- Do not automatically claim that maturity or returns are tax-free.\n" +
            "- Do not automatically claim government or sovereign guarantees.\n" +
            "- If a claim depends on a specific plan, policy, law or eligibility condition, keep the idea general or mention that conditions apply.\n" +
            "- Avoid misleading statements such as 100% safe, guaranteed profit or guaranteed returns unless the user has provided the exact basis for that claim.\n\n" +
            "Return ONLY the ideas.\n\n" +
            "Format:\n" +
            "1. Idea\n" +
            "2. Idea\n" +
            "3. Idea\n" +
            "4. Idea\n" +
            "5. Idea";

        let interaction;

        try {
            console.log("Trying model: gemini-3.8-flash");

            interaction = await ai.interactions.create({
                model: "gemini-3.8-flash",
                input: prompt
            });

        } catch (firstError) {

            console.error(
                "Primary model failed:",
                firstError.message
            );

            console.log(
                "Trying fallback model: gemini-3.7-flash"
            );

            interaction = await ai.interactions.create({
                model: "gemini-3.7-flash",
                input: prompt
            });
        }

        console.log("Content ideas response received.");

        const output = interaction.output_text || "";

        const ideas = output
            .split("\n")
            .map(line => line.trim())
            .filter(line => line.length > 0)
            .map(line =>
                line.replace(/^\d+[.**\)\-**]\s\*/, "")
            )
            .filter(line => line.length > 0);

        res.json({
            success: true,
            ideas: ideas
        });

    } catch (error) {

        console.error(
            "Gemini Ideas Error:",
            error
        );

        res.status(500).json({
            success: false,
            error: error.message ||
                "AI idea generation failed."
        });
    }
});


// ==========================================
// AI CHAT
// ==========================================

app.post("/chat", async (req, res) => {
    try {

        const messages = Array.isArray(req.body.messages)
            ? req.body.messages
            : [];

        const language =
            req.body.language || "Hindi";

        if (messages.length === 0) {
            return res.status(400).json({
                success: false,
                error: "Message is required."
            });
        }

        // Keep only recent conversation messages
        // so the request does not become unnecessarily large.
        const recentMessages = messages.slice(-20);

        let conversation = "";

        recentMessages.forEach((message) => {

            const role =
                message.role === "assistant"
                    ? "Assistant"
                    : "User";

            const content =
                typeof message.content === "string"
                    ? message.content.trim()
                    : "";

            if (content) {
                conversation +=
                    role + ": " + content + "\n\n";
            }
        });

        if (!conversation.trim()) {
            return res.status(400).json({
                success: false,
                error: "Please enter a message."
            });
        }

        const prompt =
            "You are the AI assistant inside an application called AI Content Agent.\n\n" +

            "Your job is to have a natural, helpful conversation with the user.\n" +
            "You can answer normal questions, explain things, help with ideas, " +
            "content creation, social media, business, learning, technology and everyday tasks.\n\n" +

            "IMPORTANT BEHAVIOR:\n" +
            "- Be natural and conversational.\n" +
            "- Understand the previous conversation and maintain context.\n" +
            "- Answer the user's actual question directly.\n" +
            "- Do not unnecessarily repeat the user's question.\n" +
            "- Do not mention that you are reading a conversation transcript.\n" +
            "- Do not say that you are an AI unless the user specifically asks.\n" +
            "- If the user asks for content, create useful ready-to-use content.\n" +
            "- If the user asks for coding help, explain clearly and provide correct code when needed.\n" +
            "- If the user asks something you are unsure about, be honest rather than inventing facts.\n" +
            "- For financial, legal, medical or other high-stakes topics, avoid pretending to be a professional and avoid unsupported guarantees.\n" +
            "- Keep answers reasonably concise unless the user asks for detail.\n\n" +

            "Preferred response language:\n" +
            language +
            "\n\n" +

            "Conversation:\n\n" +
            conversation +

            "\nRespond to the user's latest message naturally.";

        let interaction;

        try {

            console.log(
                "Trying chat model: gemini-3.8-flash"
            );

            interaction = await ai.interactions.create({
                model: "gemini-3.8-flash",
                input: prompt
            });

        } catch (firstError) {

            console.error(
                "Chat primary model failed:",
                firstError.message
            );

            console.log(
                "Trying chat fallback model: gemini-3.7-flash"
            );

            interaction = await ai.interactions.create({
                model: "gemini-3.7-flash",
                input: prompt
            });
        }

        const reply =
            interaction.output_text || "";

        if (!reply.trim()) {
            throw new Error(
                "AI returned an empty response."
            );
        }

        console.log("AI Chat response received.");

        res.json({
            success: true,
            reply: reply
        });

    } catch (error) {

        console.error(
            "AI Chat Error:",
            error
        );

        res.status(500).json({
            success: false,
            error:
                error.message ||
                "AI chat failed."
        });
    }
});


// ==========================================
// AI IMAGE GENERATOR
// ==========================================

app.post("/generate-image", async (req, res) => {
    try {

        const prompt = req.body.prompt;

        const imageType =
            req.body.imageType ||
            "Instagram Post";

        const style =
            req.body.style ||
            "Modern Premium";

        const imageSize =
            req.body.imageSize ||
            "1K";

        if (!prompt || !prompt.trim()) {
            return res.status(400).json({
                success: false,
                error: "Image prompt is required."
            });
        }

        if (!process.env.HF_TOKEN) {
            return res.status(500).json({
                success: false,
                error:
                    "Hugging Face token is missing. Check your .env file."
            });
        }

        console.log("=================================");
        console.log(
            "Generating image with Hugging Face..."
        );

        console.log("Image Type:", imageType);
        console.log("Style:", style);
        console.log("Image Size:", imageSize);

        let width = 1024;
        let height = 1024;

        if (
            imageType === "Instagram Story" ||
            imageType === "Poster"
        ) {
            width = 768;
            height = 1344;

        } else if (
            imageType === "YouTube Thumbnail"
        ) {
            width = 1344;
            height = 768;

        } else if (
            imageType === "Square Post"
        ) {
            width = 1024;
            height = 1024;

        } else if (
            imageType === "Instagram Post"
        ) {
            width = 1024;
            height = 1024;
        }

        const imagePrompt =
            "Create a high-quality social media image.\n\n" +

            "User's Image Request:\n" +
            prompt +

            "\n\nImage Type:\n" +
            imageType +

            "\n\nVisual Style:\n" +
            style +

            "\n\nAspect Ratio:\n" +
            width +
            " x " +
            height +

            "\n\nImportant Instructions:\n" +
            "- Make the composition visually attractive.\n" +
            "- Make the subject clear and easy to understand.\n" +
            "- Use professional lighting and composition.\n" +
            "- Keep the design suitable for social media.\n" +
            "- Avoid unnecessary objects.\n" +
            "- Avoid distorted faces, hands or objects.\n" +
            "- Do not add random text.\n" +
            "- If the user explicitly requests text, render it clearly and accurately.\n" +
            "- Do not include watermarks or logos unless specifically requested.\n";

        console.log(
            "Calling Hugging Face provider: fal-ai"
        );

        const imageBlob = await hf.textToImage({
            model:
                "black-forest-labs/FLUX.1-schnell",

            provider: "fal-ai",

            inputs: imagePrompt,

            parameters: {
                width: width,
                height: height,
                num_inference_steps: 4
            }
        });

        console.log(
            "Hugging Face image response received."
        );

        const imageBuffer =
            Buffer.from(
                await imageBlob.arrayBuffer()
            );

        const imageBase64 =
            imageBuffer.toString("base64");

        console.log(
            "Hugging Face image generated successfully."
        );

        console.log("=================================");

        res.json({
            success: true,
            image:
                "data:image/png;base64," +
                imageBase64
        });

    } catch (error) {

        console.error(
            "Hugging Face Image Generation Error:"
        );

        console.error(error);

        res.status(500).json({
            success: false,
            error:
                error.message ||
                "Image generation failed."
        });
    }
});


// ==========================================
// SERVER
// ==========================================

const PORT = 3000;

const server = app.listen(
    PORT,
    () => {
        console.log(
            "Server running at http://localhost:" +
            PORT
        );
    }
);

server.on("error", (error) => {
    console.error(
        "SERVER ERROR:",
        error
    );
});

process.on("uncaughtException", (error) => {
    console.error(
        "UNCAUGHT ERROR:",
        error
    );
});

process.on("unhandledRejection", (error) => {
    console.error(
        "UNHANDLED REJECTION:",
        error
    );
});