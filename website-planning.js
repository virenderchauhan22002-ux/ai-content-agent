(function () {
    "use strict";

    const PLAN_STORAGE_KEY = "aiContentAgent.activeWebsitePlanId";
    const FIREBASE_CONFIG = {
        apiKey: "AIzaSyAF9-LEijO0bI7OcaT5I74f2UtfGDdc78JGqQ",
        authDomain: "ai-content-agent-a9820.firebaseapp.com",
        projectId: "ai-content-agent-a9820",
        storageBucket: "ai-content-agent-a9820.firebasestorage.app",
        messagingSenderId: "833284009437",
        appId: "1:833284009437:web:91859542fb1f87ccdb9a34"
    };

    function getApiBase() {
        const host = window.location.hostname;
        if (host === "localhost" || host === "127.0.0.1") {
            return "http://localhost:3000";
        }
        return window.AI_CONTENT_AGENT_API_BASE_URL ||
            "https://ai-content-agent-3hb3.onrender.com";
    }

    function getPlanId() {
        try {
            return window.localStorage.getItem(PLAN_STORAGE_KEY) || "";
        } catch {
            return "";
        }
    }

    function setPlanId(planId) {
        if (typeof planId !== "string" || !/^[a-f0-9-]{36}$/i.test(planId)) {
            throw new Error("Invalid website planning session.");
        }
        try {
            window.localStorage.setItem(PLAN_STORAGE_KEY, planId);
        } catch {
            // The plan remains usable in the current view even if storage is blocked.
        }
    }

    function clearPlanId() {
        try {
            window.localStorage.removeItem(PLAN_STORAGE_KEY);
        } catch {
            // Ignore unavailable browser storage.
        }
    }

    async function getToken() {
        const [firebaseApp, firebaseAuth] = await Promise.all([
            import("https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js"),
            import("https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js")
        ]);

        const app = firebaseApp.getApps().length
            ? firebaseApp.getApp()
            : firebaseApp.initializeApp(FIREBASE_CONFIG);

        const auth = firebaseAuth.getAuth(app);
        if (!auth.currentUser) {
            throw new Error("Please log in to use Website Planning.");
        }
        return auth.currentUser.getIdToken();
    }

    async function request(path, body, method) {
        const token = await getToken();
        const response = await fetch(getApiBase() + "/api/websites" + path, {
            method: method || "POST",
            cache: "no-store",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token
            },
            body: body === undefined ? undefined : JSON.stringify(body)
        });

        const data = await response.json().catch(() => ({}));
        if (!response.ok || !data.success) {
            throw new Error(data.message || "Website Planning request failed.");
        }
        return data;
    }

    window.AIWebsitePlanning = {
        getApiBase,
        getPlanId,
        setPlanId,
        clearPlanId,
        getToken,
        async chat(message, planId) {
            try {
                return await request("/plan-chat", { message, ...(planId ? { planId } : {}) });
            } catch (error) {
                if (planId && /planning session not found/i.test(error.message || "")) {
                    clearPlanId();
                    return request("/plan-chat", { message });
                }
                throw error;
            }
        },
        getPlan(planId) {
            return request("/plans/" + encodeURIComponent(planId), undefined, "GET");
        },
        approve(planId) {
            return request("/plans/" + encodeURIComponent(planId) + "/approve", {
                confirmApproval: true
            });
        },
        generate(planId) {
            return request("/plans/" + encodeURIComponent(planId) + "/generate", {
                confirmGeneration: true
            });
        }
    };
})();
