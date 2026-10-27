import { test } from "node:test";
import assert from "node:assert/strict";
import { irregularVerbs, searchIrregularVerbs } from "../src/core/irregular-verbs";

test("the irregular verb reference has unique alphabetical entries and bilingual meanings", () => {
    assert.ok(irregularVerbs.length >= 90);
    const bases = irregularVerbs.map((verb) => verb.base);
    assert.equal(new Set(bases).size, bases.length);
    assert.deepEqual(bases, [...bases].sort());
    for (const verb of irregularVerbs) {
        for (const value of [
            verb.base,
            verb.past,
            verb.participle,
            verb.meaning.vi,
            verb.meaning.en,
        ]) {
            assert.ok(value.trim(), verb.base);
        }
        if (verb.note) assert.ok(verb.note.vi.trim() && verb.note.en.trim());
    }
});

test("lookup accepts any verb form, casing, whitespace and unaccented Vietnamese", () => {
    for (const [query, base] of [
        [" WENT ", "go"],
        ["WRITTEN", "write"],
        ["ĐỌC", "read"],
        ["tro   thanh", "become"],
        ["GOTTEN", "get"],
        ["swum", "swim"],
    ]) {
        assert.ok(
            searchIrregularVerbs(query).some((verb) => verb.base === base),
            query,
        );
    }
    assert.equal(searchIrregularVerbs("   ").length, irregularVerbs.length);
    assert.equal(searchIrregularVerbs("khongcotu123").length, 0);
});

test("lookalike verbs and pronunciation or regional exceptions retain their notes", () => {
    const find = (base: string) => irregularVerbs.find((verb) => verb.base === base)!;
    assert.equal(find("lie").past, "lay");
    assert.equal(find("lie").participle, "lain");
    assert.equal(find("lay").past, "laid");
    assert.equal(find("lay").participle, "laid");
    assert.match(find("lie").note!.en, /lied/);
    assert.match(find("read").note!.en, /riːd/);
    assert.match(find("read").note!.en, /red/);
    assert.match(find("get").participle, /gotten/);
    assert.match(find("get").note!.en, /British.*American/);
    assert.match(find("hang").note!.en, /hanged/);
});
