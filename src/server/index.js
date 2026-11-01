import index from "../../index.html";
import { createApi } from "./api.js";
import { readImage } from "./storage.js";

const api = createApi();
const port = Number(Bun.env.PORT ?? 3000);
Bun.serve({ port, development: Bun.env.NODE_ENV !== "production", routes: {
  "/api/*": api.handle,
  "/uploads/*": readImage,
  "/*": index,
} });
console.log(`LaporKuy running at http://localhost:${port}`);
if (Bun.env.DEMO_MODE === "true") console.log("MODE DEMO: data contoh di memori; akan hilang saat server dimulai ulang.");
