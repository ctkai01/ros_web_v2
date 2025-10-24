import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import { ThemeProvider } from "./contexts/ThemeContext.jsx";
import "./index.css";
import "./lang/i18n.js";
import { MissionProvider } from "./contexts/MissionContext.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <MissionProvider>
          <App />
        </MissionProvider>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>
);
