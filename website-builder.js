const express = require("express");
const crypto = require("crypto");
const { getAuth } = require("firebase-admin/auth");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");

const router = express.Router();

let websiteGenerator = null;

router.setWebsiteGenerator = function (generator) {
    if (typeof generator !== "function") {
        throw new Error("Website generator must be a function.");
    }
    websiteGenerator = generator;
};


const db = getFirestore();
const firebaseAuth = getAuth();

const MAX_PROJECT_BYTES = 70 * 1024;

function requireFirebaseUser(req, res, next) {
    const authorization = req.headers.authorization || "";
    const match = authorization.match(/^Bearer\s+(.+)$/i);

    if (!match) {
        return res.status(401).json({
            success: false,
            message: "Authentication required."
        });
    }

    firebaseAuth.verifyIdToken(match[1])
        .then((decodedToken) => {
            req.user = decodedToken;
            next();
        })
        .catch(() => {
            res.status(401).json({
                success: false,
                message: "Invalid or expired login session."
            });
        });
}

function validateFiles(files) {
    if (!files || typeof files !== "object" || Array.isArray(files)) {
        return "Website files must be an object.";
    }

    const allowed = ["html", "css", "js"];

    for (const key of Object.keys(files)) {
        if (!allowed.includes(key) || typeof files[key] !== "string") {
            return "Only HTML, CSS and JavaScript text files are supported.";
        }
    }

    const size = Buffer.byteLength(JSON.stringify(files), "utf8");

    if (size > MAX_PROJECT_BYTES) {
        return "Website files are too large. Maximum size is 70 KB.";
    }

    return null;
}

function cleanTitle(value) {
    if (typeof value !== "string") return "";
    return value.trim().slice(0, 80);
}

router.use(requireFirebaseUser);

// ==========================================
// WEBSITE PLANNING CHAT API
// ==========================================

router.post("/plan-chat", async (req, res) => {
    try {
        if (!websiteGenerator) {
            return res.status(503).json({
                success: false,
                message: "Website planning AI is not ready."
            });
        }

        const message =
            typeof req.body.message === "string"
                ? req.body.message.trim()
                : "";

        const requestedPlanId =
            typeof req.body.planId === "string"
                ? req.body.planId.trim()
                : "";

        if (!message || message.length > 4000) {
            return res.status(400).json({
                success: false,
                message: "Message is required and must be under 4000 characters."
            });
        }

        if (
            requestedPlanId &&
            !/^[a-zA-Z0-9_-]{1,100}$/.test(requestedPlanId)
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid planning session ID."
            });
        }

        let planId = requestedPlanId;
        let existingPlan = null;

        if (planId) {
            const planRef = db.collection("websitePlans").doc(planId);
            const snapshot = await planRef.get();

            if (!snapshot.exists || snapshot.data().ownerUid !== req.user.uid) {
                return res.status(404).json({
                    success: false,
                    message: "Planning session not found."
                });
            }

            existingPlan = snapshot.data();

            if (existingPlan.status !== "draft") {
                return res.status(409).json({
                    success: false,
                    message: "This planning session is locked and cannot be edited."
                });
            }
        } else {
            planId = crypto.randomUUID();
        }

        const previousPlan =
            existingPlan?.plan || {
                purpose: "",
                targetAudience: "",
                pages: [],
                sections: [],
                design: "",
                content: "",
                features: [],
                adminPanel: [],
                additionalRequirements: []
            };

        const aiPrompt = `
You are the Website Planning Consultant for AI Content Agent.

Your job is to understand the user's website requirements through conversation.
DO NOT generate website code during this planning stage.

Discuss these areas when relevant:
- Website purpose and target audience
- Required pages and sections
- Design, colors, layout and visual style
- Website content
- Features and functionality
- Login, signup and payment requirements
- Admin panel and what the administrator should manage

If the user is unsure, recommend useful options and explain why.
Ask only relevant questions about missing requirements.
Do not force unnecessary features.
Preserve previously confirmed requirements unless the user changes them.

PREVIOUS PLAN:
${JSON.stringify(previousPlan)}

LATEST USER MESSAGE:
${message}

Return ONLY valid JSON in this exact structure:
{
  "assistantMessage": "Natural conversational reply to the user",
  "plan": {
    "purpose": "",
    "targetAudience": "",
    "pages": [],
    "sections": [],
    "design": "",
    "content": "",
    "features": [],
    "adminPanel": [],
    "additionalRequirements": []
  },
  "readyForApproval": false
}

Set readyForApproval to true only when the important requirements are sufficiently clear
and the plan can be summarized for the user's review.

IMPORTANT:
- Never claim that the plan is approved.
- Never claim that the website has been generated.
- The user must explicitly approve the plan in a separate action.
- Keep assistantMessage friendly and in the user's language.
`;

        const raw = await websiteGenerator(aiPrompt, { responseType: "planning" });

        const cleaned = raw.trim()
            .replace(/^\x60{3}(?:json)?\s*/i, "")
            .replace(/\s*\x60{3}\s*$/, "");

        const result = JSON.parse(cleaned);

        if (
            !result ||
            typeof result.assistantMessage !== "string" ||
            !result.plan ||
            typeof result.plan !== "object" ||
            Array.isArray(result.plan)
        ) {
            return res.status(502).json({
                success: false,
                message: "AI returned an invalid planning response."
            });
        }

        const plan = {
            purpose: typeof result.plan.purpose === "string"
                ? result.plan.purpose.slice(0, 2000) : "",
            targetAudience: typeof result.plan.targetAudience === "string"
                ? result.plan.targetAudience.slice(0, 2000) : "",
            pages: Array.isArray(result.plan.pages)
                ? result.plan.pages.slice(0, 30) : [],
            sections: Array.isArray(result.plan.sections)
                ? result.plan.sections.slice(0, 50) : [],
            design: typeof result.plan.design === "string"
                ? result.plan.design.slice(0, 3000) : "",
            content: typeof result.plan.content === "string"
                ? result.plan.content.slice(0, 3000) : "",
            features: Array.isArray(result.plan.features)
                ? result.plan.features.slice(0, 50) : [],
            adminPanel: Array.isArray(result.plan.adminPanel)
                ? result.plan.adminPanel.slice(0, 50) : [],
            additionalRequirements: Array.isArray(result.plan.additionalRequirements)
                ? result.plan.additionalRequirements.slice(0, 50) : []
        };

        const planDocument = {
            planId,
            ownerUid: req.user.uid,
            plan,
            status: "draft",
            readyForApproval: result.readyForApproval === true,
            assistantMessage: result.assistantMessage.slice(0, 5000),
            updatedAt: FieldValue.serverTimestamp()
        };

        if (!existingPlan) {
            planDocument.createdAt = FieldValue.serverTimestamp();
        }

        await db.collection("websitePlans")
            .doc(planId)
            .set(planDocument, { merge: true });

        return res.json({
            success: true,
            planId,
            assistantMessage: planDocument.assistantMessage,
            plan,
            readyForApproval: planDocument.readyForApproval,
            status: "draft"
        });

    } catch (error) {
        console.error("Website planning error:", error.message);

        return res.status(502).json({
            success: false,
            message: "Website planning failed. Please try again."
        });
    }
});




// Retrieve an existing planning session for transfer between Chat and Website Builder.
router.get("/plans/:planId", async (req, res) => {
    try {
        const planId = req.params.planId;

        if (!/^[a-f0-9-]{36}$/i.test(planId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid planning session ID."
            });
        }

        const snapshot = await db.collection("websitePlans").doc(planId).get();

        if (!snapshot.exists || snapshot.data().ownerUid !== req.user.uid) {
            return res.status(404).json({
                success: false,
                message: "Planning session not found."
            });
        }

        const saved = snapshot.data();

        return res.json({
            success: true,
            planId,
            plan: saved.plan || {},
            status: saved.status || "draft",
            readyForApproval: saved.readyForApproval === true,
            assistantMessage: saved.assistantMessage || "",
            generatedProjectId: saved.generatedProjectId || null
        });
    } catch (error) {
        console.error("Website plan retrieval error:", error.message);
        return res.status(500).json({
            success: false,
            message: "Could not load the website plan."
        });
    }
});

router.post("/plans/:planId/approve", async (req, res) => {
    try {
        const planId = req.params.planId;

        if (
            typeof planId !== "string" ||
            !/^[a-f0-9-]{36}$/i.test(planId)
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid planning session ID."
            });
        }

        if (req.body.confirmApproval !== true) {
            return res.status(400).json({
                success: false,
                message: "Explicit plan approval is required."
            });
        }

        const planRef = db.collection("websitePlans").doc(planId);

        const result = await db.runTransaction(async (transaction) => {
            const snapshot = await transaction.get(planRef);

            if (!snapshot.exists) {
                return { error: "not_found" };
            }

            const savedPlan = snapshot.data();

            if (savedPlan.ownerUid !== req.user.uid) {
                return { error: "not_found" };
            }

            if (savedPlan.status === "approved") {
                return { approved: true, alreadyApproved: true };
            }

            if (
                savedPlan.status !== "draft" ||
                savedPlan.readyForApproval !== true
            ) {
                return { error: "not_ready" };
            }

            transaction.update(planRef, {
                status: "approved",
                approvedBy: req.user.uid,
                approvedAt: FieldValue.serverTimestamp(),
                updatedAt: FieldValue.serverTimestamp()
            });

            return { approved: true, alreadyApproved: false };
        });

        if (result.error === "not_found") {
            return res.status(404).json({
                success: false,
                message: "Planning session not found."
            });
        }

        if (result.error === "not_ready") {
            return res.status(409).json({
                success: false,
                message: "This plan is not ready for approval."
            });
        }

        return res.json({
            success: true,
            message: "Website plan approved successfully.",
            planId,
            status: "approved",
            alreadyApproved: result.alreadyApproved
        });

    } catch (error) {
        console.error("Website plan approval error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Plan approval failed. Please try again."
        });
    }
});

// ==========================================
// GENERATE WEBSITE FROM APPROVED PLAN
// ==========================================
router.post("/plans/:planId/generate", async (req, res) => {
    let reservedProjectId = null;
    let planRef = null;

    try {
        const planId = req.params.planId;

        if (!/^[a-f0-9-]{36}$/i.test(planId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid planning session ID."
            });
        }

        if (req.body.confirmGeneration !== true) {
            return res.status(400).json({
                success: false,
                message: "Explicit generation confirmation is required."
            });
        }

        if (!websiteGenerator) {
            return res.status(503).json({
                success: false,
                message: "Website generation service is not ready."
            });
        }

        planRef = db.collection("websitePlans").doc(planId);
        reservedProjectId = crypto.randomUUID();

        const reservation = await db.runTransaction(async (transaction) => {
            const snapshot = await transaction.get(planRef);

            if (!snapshot.exists) {
                return { error: "not_found" };
            }

            const saved = snapshot.data();

            if (saved.ownerUid !== req.user.uid) {
                return { error: "not_found" };
            }

            if (saved.status === "generated") {
                return {
                    error: "already_generated",
                    projectId: saved.generatedProjectId || null
                };
            }

            if (saved.status === "generating") {
                return { error: "generating" };
            }

            if (
                saved.status !== "approved" ||
                saved.readyForApproval !== true ||
                !saved.plan ||
                typeof saved.plan !== "object"
            ) {
                return { error: "not_approved" };
            }

            transaction.update(planRef, {
                status: "generating",
                generationProjectId: reservedProjectId,
                updatedAt: FieldValue.serverTimestamp()
            });

            return { plan: saved.plan };
        });

        if (reservation.error === "not_found") {
            return res.status(404).json({
                success: false,
                message: "Approved planning session not found."
            });
        }

        if (reservation.error === "already_generated") {
            return res.status(409).json({
                success: false,
                message: "This plan has already generated a website.",
                projectId: reservation.projectId
            });
        }

        if (reservation.error === "generating") {
            return res.status(409).json({
                success: false,
                message: "Website generation is already in progress."
            });
        }

        if (reservation.error === "not_approved") {
            return res.status(409).json({
                success: false,
                message: "Approve the completed website plan before generating."
            });
        }

        const approvedPlan = reservation.plan;

        const aiPrompt = [
            "You are an award-winning senior web designer, UX specialist and full-stack website developer.",
            "Create a production-quality, visually impressive and complete website from the approved requirements.",
            "The FIRST generated version must already look polished and professional. Do not create a wireframe, rough draft, plain HTML demo or generic template.",
            "",
            "DESIGN QUALITY:",
            "- Create a distinctive visual identity that matches the business, audience and approved design direction.",
            "- Use a strong visual hierarchy, beautiful typography, balanced whitespace, consistent spacing, refined colors and polished components.",
            "- Design an impressive hero section with a clear headline, supporting text, relevant visual and meaningful call-to-action.",
            "- Use attractive navigation, well-designed buttons, elegant cards, section backgrounds and a professional footer.",
            "- Make every approved page feel complete, intentional and visually consistent.",
            "- Avoid excessive empty space, default browser styling, crude layouts and repetitive generic sections.",
            "",
            "IMAGES AND VISUAL ASSETS:",
            "- Include suitable, relevant photography automatically in the first generation. The user must NOT have to upload images to get a complete website.",
            "- Use direct, valid HTTPS image URLs from reliable public image sources, preferably images.unsplash.com, when suitable.",
            "- Choose images that match the actual business and the content of each section.",
            "- For product cards, include relevant product photography wherever appropriate.",
            "- Never display grey boxes, empty image placeholders, broken-image icons or text pretending to be an image.",
            "- If an image cannot be loaded, provide an attractive designed fallback background rather than a blank or grey placeholder.",
            "- Use appropriate image dimensions, object-fit, responsive sizing and descriptive alt text.",
            "- Do not make image upload a prerequisite. Uploading personal images is an optional later customization.",
            "",
            "PAGES AND FUNCTIONALITY:",
            "- Implement every approved page, section, feature and stated restriction.",
            "- Add meaningful, realistic page content instead of filler text or repeated generic paragraphs.",
            "- Ensure navigation links, buttons, forms and interactive elements work as intended.",
            "- Implement responsive layouts for mobile phones, tablets and desktop screens.",
            "- Use accessible semantic HTML, keyboard-friendly controls and clear focus states.",
            "- Use clean, organized vanilla JavaScript and avoid unnecessary dependencies.",
            "- Do not add online payments, customer accounts, ordering or other features that the user explicitly rejected.",
            "",
            "ADMIN PANEL AND HONEST FUNCTIONALITY:",
            "- Implement the admin-panel features explicitly included in the approved plan.",
            "- Do not pretend that a front-end-only password check provides secure authentication.",
            "- Do not claim that data is securely saved, uploaded or managed by a backend unless a real supported backend integration exists.",
            "- Where backend services are unavailable, clearly separate the interface from unfinished backend functionality. Never create fake success messages.",
            "",
            "TECHNICAL REQUIREMENTS:",
            "- Use HTML, CSS and vanilla JavaScript only. Do not use external build tools.",
            "- Return complete, self-contained HTML, CSS and JavaScript in the requested files.",
            "- Ensure the website works inside a sandboxed iframe preview.",
            "- Do not use document.write, browser popups or unsafe inline event-handler attributes.",
            "- Do not omit content or functionality to save tokens.",
            "- Do not invent major features that were not approved.",
            "",
            "OUTPUT FORMAT:",
            "Return ONLY valid JSON. Do not use Markdown fences or explanations.",
            'Required JSON format: {"title":"Website title","files":{"html":"complete HTML","css":"complete CSS","js":"JavaScript code"}}.',
            "Approved website requirements:",
            JSON.stringify(approvedPlan, null, 2)
        ].join("\n\n");

        const raw = await websiteGenerator(aiPrompt);

        if (typeof raw !== "string") {
            throw new Error("AI_INVALID_RESPONSE");
        }

        const cleaned = raw.trim()
            .replace(/^\x60{3}(?:json)?\s*/i, "")
            .replace(/\s*\x60{3}\s*$/, "");

        const generated = JSON.parse(cleaned);
        const files = generated.files;

        const filesError = validateFiles(files);

        if (filesError || !files.html || !files.css || !files.js) {
            throw new Error("AI_INVALID_FILES");
        }

        const title = cleanTitle(
            generated.title || approvedPlan.purpose || "AI Website"
        );

        if (!title) {
            throw new Error("AI_INVALID_TITLE");
        }

        const project = {
            projectId: reservedProjectId,
            ownerUid: req.user.uid,
            title,
            files,
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp()
        };

        const projectRef = db.collection("websiteProjects")
            .doc(reservedProjectId);

        await db.runTransaction(async (transaction) => {
            const currentPlanSnapshot = await transaction.get(planRef);
            const existingProjectSnapshot = await transaction.get(projectRef);

            if (!currentPlanSnapshot.exists) {
                throw new Error("PLAN_RESERVATION_LOST");
            }

            const currentPlan = currentPlanSnapshot.data();

            if (
                currentPlan.ownerUid !== req.user.uid ||
                currentPlan.status !== "generating" ||
                currentPlan.generationProjectId !== reservedProjectId
            ) {
                throw new Error("PLAN_RESERVATION_LOST");
            }

            if (existingProjectSnapshot.exists) {
                throw new Error("PROJECT_ALREADY_EXISTS");
            }

            transaction.set(projectRef, project);

            transaction.update(planRef, {
                status: "generated",
                generatedProjectId: reservedProjectId,
                generatedAt: FieldValue.serverTimestamp(),
                updatedAt: FieldValue.serverTimestamp()
            });
        });

        return res.status(201).json({
            success: true,
            message: "Website generated and saved successfully.",
            planId,
            project: {
                projectId: reservedProjectId,
                title,
                files
            }
        });

    } catch (error) {
        console.error("Approved website generation error:", {
            name: error.name,
            message: error.message,
            stack: error.stack
        });

        if (planRef && reservedProjectId) {
            try {
                await db.runTransaction(async (transaction) => {
                    const snapshot = await transaction.get(planRef);

                    if (!snapshot.exists) return;

                    const current = snapshot.data();

                    if (
                        current.ownerUid === req.user.uid &&
                        current.status === "generating" &&
                        current.generationProjectId === reservedProjectId
                    ) {
                        transaction.update(planRef, {
                            status: "approved",
                            generationProjectId: FieldValue.delete(),
                            updatedAt: FieldValue.serverTimestamp()
                        });
                    }
                });
            } catch (resetError) {
                console.error(
                    "Website generation reservation reset error:",
                    resetError.message
                );
            }
        }

        return res.status(502).json({
            success: false,
            message: "Website generation failed. Your approved plan can be retried."
        });
    }
});

router.post("/generate", async (req, res) => {
    try {
        if (!websiteGenerator) {
            return res.status(503).json({
                success: false,
                message: "Website generation service is not ready."
            });
        }

        const userPrompt =
            typeof req.body.prompt === "string"
                ? req.body.prompt.trim()
                : "";

        if (!userPrompt || userPrompt.length > 4000) {
            return res.status(400).json({
                success: false,
                message: "Prompt is required and must be under 4000 characters."
            });
        }

        const aiPrompt = [
            "You are an award-winning senior web designer and front-end developer.",
            "Create a complete, polished, professional, responsive website from the user's request.",
            "The FIRST version must already look finished. Do not produce a wireframe, a plain HTML demo or a generic template.",
            "",
            "BRIEF HANDLING:",
            "- The user's request may be short. Silently infer sensible defaults for anything not stated (audience, tone, pages, sections, colors).",
            "- Never contradict anything the user explicitly asked for. Defaults apply only to what is missing.",
            "- Write real, specific copy for this business. Never use lorem ipsum or filler.",
            "- Write the copy in the language of the user's request.",
            "",
            "DESIGN RULES:",
            "- One cohesive palette: one primary color, one accent, neutral backgrounds. Define them as CSS variables on :root.",
            "- At most two fonts (system font stack, or Google Fonts via a <link>). Clear type scale and strong visual hierarchy.",
            "- Consistent spacing scale, generous whitespace, consistent border radius and shadows.",
            "- Impressive hero: one headline (max 8 words), one supporting line, one clear call-to-action button.",
            "- Include a sticky or clear navigation, well-designed cards and buttons with hover and focus states, and a complete footer.",
            "- Use 5 to 7 purposeful sections that fit the business (for example hero, about, services or products, testimonials, FAQ, contact).",
            "- Fully responsive for phone, tablet and desktop. Mobile navigation must work.",
            "",
            "IMAGES:",
            "- Do not invent photo URLs. Only use an image URL if you are certain it exists.",
            "- Otherwise use designed CSS gradients, inline SVG shapes or icons and decorative backgrounds. Never leave grey boxes, broken-image icons or empty placeholders.",
            "",
            "TECHNICAL RULES:",
            "- HTML, CSS and vanilla JavaScript only. No build tools and no external JavaScript libraries.",
            "- The site must work inside a sandboxed iframe: no document.write, no popups, no inline event-handler attributes.",
            "- Use semantic, accessible HTML. Forms must not pretend to send data to a server that does not exist.",
            "- Return complete content in each file. Do not shorten or omit anything to save space.",
            "",
            "OUTPUT FORMAT:",
            "Return ONLY valid JSON. Do not use Markdown fences or explanations.",
            'Required JSON format: {"title":"Website title","files":{"html":"complete HTML","css":"complete CSS","js":"JavaScript code"}}.',
            "User website request:",
            userPrompt
        ].join("\n");

        const raw = await websiteGenerator(aiPrompt);
        const cleaned = raw.trim()
            .replace(/^\x60{3}(?:json)?\s*/i, "")
            .replace(/\s*\x60{3}\s*$/, "");

        const generated = JSON.parse(cleaned);
        const files = generated.files;

        const filesError = validateFiles(files);

        if (filesError || !files.html || !files.css || !files.js) {
            return res.status(502).json({
                success: false,
                message: "AI returned invalid website files. Please try again."
            });
        }

        const title = cleanTitle(
            generated.title || req.body.title || "AI Website"
        );

        if (!title) {
            return res.status(502).json({
                success: false,
                message: "AI returned an invalid website title."
            });
        }

        const projectId = crypto.randomUUID();

        const project = {
            projectId,
            ownerUid: req.user.uid,
            title,
            files,
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp()
        };

        await db.collection("websiteProjects").doc(projectId).create(project);

        return res.status(201).json({
            success: true,
            message: "Website generated and saved successfully.",
            project: {
                projectId,
                title,
                files
            }
        });
    } catch (error) {
        console.error("Website generation error:", error.message);

        return res.status(502).json({
            success: false,
            message: "Website generation failed. Please try again."
        });
    }
});

// AI edit an existing website and return an unsaved draft
router.post("/:projectId/edit", async (req, res) => {
    try {
        if (!websiteGenerator) {
            return res.status(503).json({
                success: false,
                message: "Website editing service is not ready."
            });
        }

        const editPrompt = req.body.prompt;

        if (
            typeof editPrompt !== "string" ||
            !editPrompt.trim() ||
            editPrompt.trim().length > 2000
        ) {
            return res.status(400).json({
                success: false,
                message: "Edit instructions must be between 1 and 2000 characters."
            });
        }

        const projectRef = db.collection("websiteProjects").doc(req.params.projectId);
        const projectSnapshot = await projectRef.get();

        if (!projectSnapshot.exists) {
            return res.status(404).json({
                success: false,
                message: "Website project not found."
            });
        }

        const existingProject = projectSnapshot.data();

        if (existingProject.ownerUid !== req.user.uid) {
            return res.status(403).json({
                success: false,
                message: "You are not allowed to edit this website."
            });
        }

        const existingFilesError = validateFiles(existingProject.files);

        if (existingFilesError) {
            return res.status(400).json({
                success: false,
                message: "Existing website files are invalid."
            });
        }

        const existingCss = typeof existingProject.files.css === "string"
            ? existingProject.files.css
            : "";

        if (existingCss.length > 18000) {
            return res.status(413).json({
                success: false,
                message: "This website's CSS is too large for the current AI Edit limit. Manual editing is still available."
            });
        }

        const aiPrompt = `
You are an expert CSS website designer.

Update ONLY the existing CSS according to the user's instructions.

Rules:
1. Make only the requested visual changes.
2. Preserve all unrelated existing CSS.
3. Do not generate or modify HTML or JavaScript.
4. Return the COMPLETE updated CSS.
5. Return ONLY valid JSON without Markdown fences.
6. Required structure: {"css":"complete updated CSS"}

Website title:
${existingProject.title}

Existing CSS:
${existingCss}

User's requested changes:
${editPrompt.trim()}
`;

        const aiResult = await websiteGenerator(aiPrompt);

        const cleanedResult = aiResult
            .trim()
            .replace(/^```(?:json)?\s*/i, "")
            .replace(/\s*```$/, "");

        const updatedWebsite = JSON.parse(cleanedResult);

        if (
            !updatedWebsite ||
            typeof updatedWebsite !== "object" ||
            typeof updatedWebsite.css !== "string" ||
            !updatedWebsite.css.trim()
        ) {
            throw new Error("Invalid AI CSS response.");
        }

        const title = existingProject.title;
        const files = {
            ...existingProject.files,
            css: updatedWebsite.css
        };

        const filesError = validateFiles(files);

        if (
            !title ||
            filesError ||
            typeof files.html !== "string" ||
            !files.html.trim()
        ) {
            return res.status(502).json({
                success: false,
                message: "AI returned an invalid website draft. Please try again."
            });
        }

        // Draft only: original Firestore project remains unchanged.
        return res.status(200).json({
            success: true,
            message: "Website edit draft generated successfully.",
            project: {
                projectId: req.params.projectId,
                title,
                files
            }
        });

    } catch (error) {
        console.error("Website AI edit error:", error.message);

        return res.status(502).json({
            success: false,
            message: "AI website editing failed. Your saved website was not changed."
        });
    }
});

// Create a website project
router.post("/", async (req, res) => {
    try {
        const title = cleanTitle(req.body.title || "Untitled Website");
        const files = req.body.files || {
            html: "<!DOCTYPE html><html><head><meta charset=\"UTF-8\"><title>My Website</title></head><body><h1>My Website</h1></body></html>",
            css: "body { font-family: Arial, sans-serif; padding: 24px; }",
            js: ""
        };

        if (!title) {
            return res.status(400).json({
                success: false,
                message: "Project title is required."
            });
        }

        const filesError = validateFiles(files);
        if (filesError) {
            return res.status(400).json({
                success: false,
                message: filesError
            });
        }

        const projectId = crypto.randomUUID();

        const project = {
            projectId,
            ownerUid: req.user.uid,
            title,
            files,
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp()
        };

        await db.collection("websiteProjects").doc(projectId).create(project);

        return res.status(201).json({
            success: true,
            project: {
                projectId,
                title,
                files
            }
        });
    } catch (error) {
        console.error("Website project create error:", error.message);
        return res.status(500).json({
            success: false,
            message: "Could not create website project."
        });
    }
});

// List only the signed-in user's projects
router.get("/", async (req, res) => {
    try {
        const snapshot = await db.collection("websiteProjects")
            .where("ownerUid", "==", req.user.uid)
            .get();

        const projects = snapshot.docs.map((doc) => {
            const data = doc.data();
            return {
                projectId: data.projectId,
                title: data.title,
                updatedAt: data.updatedAt || null
            };
        });

        projects.sort((a, b) => {
            const aTime = a.updatedAt?.toMillis?.() || 0;
            const bTime = b.updatedAt?.toMillis?.() || 0;
            return bTime - aTime;
        });

        return res.json({ success: true, projects });
    } catch (error) {
        console.error("Website project list error:", error.message);
        return res.status(500).json({
            success: false,
            message: "Could not load website projects."
        });
    }
});

// Read a project, only if it belongs to this user
router.get("/:projectId", async (req, res) => {
    try {
        const ref = db.collection("websiteProjects").doc(req.params.projectId);
        const snapshot = await ref.get();

        if (!snapshot.exists || snapshot.data().ownerUid !== req.user.uid) {
            return res.status(404).json({
                success: false,
                message: "Website project not found."
            });
        }

        const data = snapshot.data();

        return res.json({
            success: true,
            project: {
                projectId: data.projectId,
                title: data.title,
                files: data.files
            }
        });
    } catch (error) {
        console.error("Website project read error:", error.message);
        return res.status(500).json({
            success: false,
            message: "Could not load website project."
        });
    }
});

// Update a project, only if it belongs to this user
router.put("/:projectId", async (req, res) => {
    try {
        const ref = db.collection("websiteProjects").doc(req.params.projectId);
        const snapshot = await ref.get();

        if (!snapshot.exists || snapshot.data().ownerUid !== req.user.uid) {
            return res.status(404).json({
                success: false,
                message: "Website project not found."
            });
        }

        const updates = {
            updatedAt: FieldValue.serverTimestamp()
        };

        if (req.body.title !== undefined) {
            const title = cleanTitle(req.body.title);
            if (!title) {
                return res.status(400).json({
                    success: false,
                    message: "Project title cannot be empty."
                });
            }
            updates.title = title;
        }

        if (req.body.files !== undefined) {
            const filesError = validateFiles(req.body.files);
            if (filesError) {
                return res.status(400).json({
                    success: false,
                    message: filesError
                });
            }
            updates.files = req.body.files;
        }

        await ref.update(updates);

        return res.json({
            success: true,
            message: "Website project saved."
        });
    } catch (error) {
        console.error("Website project update error:", error.message);
        return res.status(500).json({
            success: false,
            message: "Could not save website project."
        });
    }
});

// Delete a project, only if it belongs to this user
router.delete("/:projectId", async (req, res) => {
    try {
        const ref = db.collection("websiteProjects").doc(req.params.projectId);
        const snapshot = await ref.get();

        if (!snapshot.exists || snapshot.data().ownerUid !== req.user.uid) {
            return res.status(404).json({
                success: false,
                message: "Website project not found."
            });
        }

        await ref.delete();

        return res.json({
            success: true,
            message: "Website project deleted."
        });
    } catch (error) {
        console.error("Website project delete error:", error.message);
        return res.status(500).json({
            success: false,
            message: "Could not delete website project."
        });
    }
});

module.exports = router;