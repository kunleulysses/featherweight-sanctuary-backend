import { Router } from "express";
import { validatePackage } from "../validation/validator.mjs";
import { safetyLint } from "../validation/safety.mjs";

export const router = Router();

router.post("/validate", async (req, res) => {
  try {
    const { kind, payload } = req.body || {};
    if (!kind || !payload) return res.status(400).json({ ok: false, error: "missing kind/payload" });
    const lint = safetyLint(kind, payload);
    if (!lint.ok) return res.status(400).json({ ok: false, error: "safety", details: lint });
    const out = validatePackage(kind, payload);
    return res.json({ ok: true, result: out });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e?.message });
  }
});
