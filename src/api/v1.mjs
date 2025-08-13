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

// NPC talk (LLM)
import { geminiChat } from "../llm/gemini.mjs";
router.post("/npc/talk", async (req, res) => {
  try {
    const { persona, prompt, memory } = req.body || {};
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ ok: false, error: "missing GEMINI_API_KEY" });
    const system = `You are ${persona?.npc_id || 'an NPC'} with voice ${persona?.voice || 'neutral'}. Keep replies concise and in-world.`;
    const content = await geminiChat({ apiKey, system, messages: [
      { role: 'user', content: `Memory: ${JSON.stringify(memory||{})}` },
      { role: 'user', content: prompt || '' }
    ]});
    return res.json({ ok: true, content });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e?.message });
  }
});

// Quest propose (QDL JSON)
router.post("/quest/propose", async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ ok: false, error: "missing GEMINI_API_KEY" });
    const { playerSignals } = req.body || {};
    const system = 'You output ONLY compact JSON matching the approved QDL schema fields. No commentary.';
    const prompt = `Write a safe QDL for a gentle quest. Use tags and 2 stages. Signals: ${JSON.stringify(playerSignals||{})}`;
    const jsonText = await geminiChat({ apiKey, system, messages: [{ role: 'user', content: prompt }], json: true });
    let payload;
    try { payload = JSON.parse(jsonText); } catch { return res.status(400).json({ ok: false, error: 'invalid-json', raw: jsonText }); }
    const lint = safetyLint('quest', payload);
    if (!lint.ok) return res.status(400).json({ ok: false, error: 'safety', details: lint, fallback: rewriteTheDream('quest') });
    const out = validatePackage('quest', payload);
    if (!out.ok) return res.status(400).json({ ok: false, error: 'schema', details: out, fallback: rewriteTheDream('quest') });
    return res.json({ ok: true, quest: payload });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e?.message });
  }
});
