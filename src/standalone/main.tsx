import { createRoot } from "react-dom/client";
import "@/app/globals.css";
import { App } from "./App";

document.documentElement.lang = "ar";
document.documentElement.dir = "rtl";
createRoot(document.getElementById("heroes-root")!).render(<App />);
