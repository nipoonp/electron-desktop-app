import { useEffect } from "react";

//Origins allowed to drive the kiosk theme live preview (the tabin-web dashboard).
const ALLOWED_ORIGINS = ["https://restaurants.tabin.co.nz", "http://localhost:3000", "http://localhost:3001"];

const PREVIEW_STYLE_ELEMENT_ID = "tabin-kiosk-preview-css";

//When the kiosk web app is embedded in an iframe by the dashboard's Kiosk Theme editor, this listens for
//draft css sent via postMessage and injects it so theme changes can be previewed before they are saved.
export const ThemePreviewListener = () => {
    useEffect(() => {
        if (window.parent === window) return;

        const onMessage = (event: MessageEvent) => {
            if (!ALLOWED_ORIGINS.includes(event.origin)) return;
            if (!event.data || event.data.type !== "TABIN_THEME_PREVIEW_CSS" || typeof event.data.css !== "string") return;

            let styleElement = document.getElementById(PREVIEW_STYLE_ELEMENT_ID) as HTMLStyleElement | null;

            if (!styleElement) {
                styleElement = document.createElement("style");
                styleElement.id = PREVIEW_STYLE_ELEMENT_ID;
            }

            styleElement.textContent = event.data.css;

            //Re-append so the preview css always sits after the saved custom stylesheet in the document.
            document.body.appendChild(styleElement);

            //Disable the saved custom stylesheets so the preview shows exactly what would be saved.
            document.querySelectorAll<HTMLLinkElement>("link[data-custom-style-sheet]").forEach((link) => {
                link.disabled = true;
            });
        };

        window.addEventListener("message", onMessage);
        window.parent.postMessage({ type: "TABIN_THEME_PREVIEW_READY" }, "*");

        return () => window.removeEventListener("message", onMessage);
    }, []);

    return null;
};
