import assert from "node:assert/strict";
import cs from "../src/locales/cs.json";
import en from "../src/locales/en.json";
import de from "../src/locales/de.json";
function shape(value: unknown, path = ""): string[] {
  if (typeof value === "string") {
    assert.ok(value.trim(), `Empty translation: ${path}`);
    return [path];
  }
  assert.ok(value && typeof value === "object", `Invalid translation: ${path}`);
  return Object.entries(value)
    .flatMap(([key, child]) => shape(child, `${path}.${key}`))
    .sort();
}
for (const [locale, dictionary] of Object.entries({ en, de }))
  assert.deepEqual(shape(dictionary), shape(cs), `Locale structure: ${locale}`);
console.log("Locale structure and values: cs, en, de OK");
