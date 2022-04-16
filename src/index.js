import { createRoot } from "react-dom/client";

import "react-dates/initialize";
import "react-dates/lib/css/_datepicker.css";

// Keep this before app.tsx
import "./styles/index.scss";
import App from "./App.tsx";

const container = document.getElementById("root");
const root = createRoot(container);

root.render(<App />);
