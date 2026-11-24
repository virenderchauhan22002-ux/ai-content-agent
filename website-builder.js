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
            "You are a professional website developer.",
            "Create a complete, polished, responsive website from the user's request.",
            "Return ONLY valid JSON. Do not use Markdown fences or explanations.",
            'Required JSON format: {"title":"Website title","files":{"html":"complete HTML","css":"complete CSS","js":"JavaScript code"}}.',
            "Include all page content in HTML and styling in CSS.",
            "Use only HTML, CSS and vanilla JavaScript. Do not use external build tools.",
            "Do not include explanations outside the JSON.",
            "User website request:",
            userPrompt
        ].join("\n\n");

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
