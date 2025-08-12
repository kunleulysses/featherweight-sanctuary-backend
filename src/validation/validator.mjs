import Ajv from "ajv";
import addFormats from "ajv-formats";
import questSchema from "../../schemas/quest.schema.json" assert { type: "json" };
import sceneSchema from "../../schemas/scene.schema.json" assert { type: "json" };
import personaSchema from "../../schemas/persona.schema.json" assert { type: "json" };

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);
const validators = {
  quest: ajv.compile(questSchema),
  scene: ajv.compile(sceneSchema),
  persona: ajv.compile(personaSchema)
};

export function validatePackage(kind, payload) {
  const v = validators[kind];
  if (!v) throw new Error(`unknown kind: ${kind}`);
  const ok = v(payload);
  return { ok, errors: ok ? [] : v.errors };
}
