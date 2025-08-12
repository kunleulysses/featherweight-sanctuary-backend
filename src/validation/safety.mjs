const BLOCKED = [/self\s*-\s*harm/i, /racial\s*slur/i, /suicide/i];

export function safetyLint(kind, payload) {
  try {
    const blob = JSON.stringify(payload).slice(0, 20000);
    for (const r of BLOCKED) {
      if (r.test(blob)) return { ok: false, rule: r.toString() };
    }
    // Example allowlist hooks could go here
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e?.message };
  }
}
