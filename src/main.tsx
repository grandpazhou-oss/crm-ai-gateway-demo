import React from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";
import App from "./App";
import DesignPreview from "./designs/DesignPreview";

const root = createRoot(document.getElementById("root")!);
const isDesignPreview = window.location.pathname === "/design-preview";

root.render(
  <React.StrictMode>
    {isDesignPreview ? <DesignPreview /> : <App />}
  </React.StrictMode>,
);
