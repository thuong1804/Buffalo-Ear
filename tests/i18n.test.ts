import { test } from "node:test";
import assert from "node:assert/strict";
import { createLocaleI18n, resources } from "../src/i18n/instance";
import { parseLocaleCookie } from "../src/i18n/locale";

test("locale cookie accepts only supported values and safely defaults to Vietnamese", () => {
  assert.equal(parseLocaleCookie(null), "vi");
  assert.equal(
    parseLocaleCookie("other=en; buffalo-ear-locale=en; session=x"),
    "en",
  );
  for (const value of ["", "fr", "en-US", "%65n", "<script>", "EN"])
    assert.equal(parseLocaleCookie(`buffalo-ear-locale=${value}`), "vi");
  assert.equal(parseLocaleCookie("not-buffalo-ear-locale=en"), "vi");
});
test("Vietnamese and English catalogs have matching keys and interpolation variables", () => {
  const vi = resources.vi as Record<string, Record<string, string>>;
  const en = resources.en as Record<string, Record<string, string>>;
  assert.deepEqual(Object.keys(vi).sort(), Object.keys(en).sort());
  const variables = (text: string) =>
    [...text.matchAll(/{{\s*([^},\s]+)/g)].map((match) => match[1]).sort();
  for (const namespace of Object.keys(vi)) {
    assert.deepEqual(
      Object.keys(vi[namespace]).sort(),
      Object.keys(en[namespace]).sort(),
      namespace,
    );
    for (const key of Object.keys(vi[namespace])) {
      assert.ok(
        vi[namespace][key].trim() && en[namespace][key].trim(),
        `${namespace}:${key}`,
      );
      assert.deepEqual(
        variables(vi[namespace][key]),
        variables(en[namespace][key]),
        `${namespace}:${key}`,
      );
    }
  }
});
test("translation instances are isolated, pluralize English and format numbers by locale", async () => {
  const vi = createLocaleI18n("vi");
  const en = createLocaleI18n("en");
  assert.equal(vi.t("common:library"), "Thư viện");
  assert.equal(en.t("common:library"), "Library");
  assert.equal(en.t("common:wordCount", { count: 1 }), "1 word");
  assert.equal(en.t("common:wordCount", { count: 2 }), "2 words");
  assert.equal(vi.t("common:wordCount", { count: 3000 }), "3.000 từ");
  assert.equal(en.t("common:wordCount", { count: 3000 }), "3,000 words");
  await en.changeLanguage("vi");
  assert.equal(vi.language, "vi");
  await vi.changeLanguage("en");
  assert.equal(en.language, "vi");
});
