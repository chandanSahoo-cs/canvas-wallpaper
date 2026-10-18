import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "../../src/App";
import "../../src/styles/globals.css";

// Apply persisted background color immediately to avoid flashing
try {
  const bg = localStorage.getItem("papertab_bg_color");
  if (bg) {
    document.documentElement.style.backgroundColor = bg;
  }
} catch (e) {}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
