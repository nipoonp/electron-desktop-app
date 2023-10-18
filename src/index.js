import { createRoot } from "react-dom/client";

import "react-dates/initialize";
import "react-dates/lib/css/_datepicker.css";

// Keep this before app.tsx
import "./styles/index.scss";
import App from "./App";

import { ErrorBoundary } from "react-error-boundary";
import { ErrorBoundaryFallback } from "./tabin/components/errorBoundryFallback";
import { sendFailureNotification } from "./util/errorHandling";

const container = document.getElementById("root");
const root = createRoot(container);

const logFailureNotification = async (error: Error, info: { componentStack: string }) => {
    // Do something with the error, e.g. log to an external API
    console.error("Error:", error.message, info.componentStack);

    await sendFailureNotification(error.message, JSON.stringify({ page: "index.js", context: "index.js", info: info.componentStack }));
};

root.render(
    <ErrorBoundary FallbackComponent={ErrorBoundaryFallback} onError={logFailureNotification}>
        <App />
    </ErrorBoundary>
);
