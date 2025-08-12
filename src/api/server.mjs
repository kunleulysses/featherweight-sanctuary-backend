import express from "express";
import helmet from "helmet";
import cors from "cors";
import dotenv from "dotenv";
import { register } from "prom-client";
import { router as v1 } from "./v1.mjs";

dotenv.config();
const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.get("/metrics", async (_req, res) => {
  res.set("Content-Type", register.contentType);
  res.end(await register.metrics());
});

app.use("/api/v1", v1);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Sanctuary backend listening on ${PORT}`));
