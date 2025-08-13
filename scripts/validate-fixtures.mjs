import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import fs from 'fs';
import path from 'path';
import questSchema from '../schemas/quest.schema.json' assert { type: 'json' };
import sceneSchema from '../schemas/scene.schema.json' assert { type: 'json' };
import personaSchema from '../schemas/persona.schema.json' assert { type: 'json' };

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);
const validators = {
  '.quest.json': ajv.compile(questSchema),
  '.scene.json': ajv.compile(sceneSchema),
  '.persona.json': ajv.compile(personaSchema)
};

const fixturesDir = path.resolve('./fixtures');
let failed = 0;
for (const f of fs.readdirSync(fixturesDir)) {
  const file = path.join(fixturesDir, f);
  const key = Object.keys(validators).find(k => f.endsWith(k));
  if (!key) continue;
  const v = validators[key];
  const payload = JSON.parse(fs.readFileSync(file, 'utf8'));
  const ok = v(payload);
  if (!ok) {
    failed++;
    console.error(`❌ ${f} invalid`, v.errors);
  } else {
    console.log(`✅ ${f} valid`);
  }
}
process.exit(failed > 0 ? 1 : 0);
