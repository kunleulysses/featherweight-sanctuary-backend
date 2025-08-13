import { Router } from "express";
import { validatePackage } from "../validation/validator.mjs";
import { safetyLint } from "../validation/safety.mjs";
import { budgetCheck } from "../services/budgeter.mjs";
import { rewriteTheDream } from "../services/fallback.mjs";

export const router = Router();

router.post("/validate", async (req, res) => {
  try {
    const { kind, payload } = req.body || {};
    if (!kind || !payload) return res.status(400).json({ ok: false, error: "missing kind/payload" });
    const budget = budgetCheck({ addTokens: JSON.stringify(payload).length });
    if (!budget.ok) {
      const fallback = rewriteTheDream(kind);
      return res.status(429).json({ ok: false, error: "budget", details: budget, fallback });
    }
    const lint = safetyLint(kind, payload);
    if (!lint.ok) {
      const fallback = rewriteTheDream(kind);
      return res.status(400).json({ ok: false, error: "safety", details: lint, fallback });
    }
    const out = validatePackage(kind, payload);
    if (!out.ok) {
      const fallback = rewriteTheDream(kind);
      return res.status(400).json({ ok: false, error: "schema", details: out, fallback });
    }
    return res.json({ ok: true, result: out, budget });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e?.message });
  }
});
