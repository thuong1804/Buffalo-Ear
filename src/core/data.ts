import type { Word } from "./types";
import vocabulary from "../../data/vocabulary.json" with { type: "json" };

const groups = [
    {
        name: "filters:monophthongs",
        type: "vowels",
        sounds: ["iː", "ɪ", "ʊ", "uː", "e", "ə", "ɜː", "ɔː", "æ", "ʌ", "ɑː", "ɒ"],
    },
    {
        name: "filters:diphthongs",
        type: "vowels",
        sounds: ["ɪə", "eɪ", "ʊə", "ɔɪ", "əʊ", "eə", "aɪ", "aʊ"],
    },
    {
        name: "filters:consonants",
        type: "consonants",
        sounds: [
            "p",
            "b",
            "t",
            "d",
            "k",
            "ɡ",
            "f",
            "v",
            "θ",
            "ð",
            "s",
            "z",
            "ʃ",
            "ʒ",
            "h",
            "tʃ",
            "dʒ",
            "m",
            "n",
            "ŋ",
            "l",
            "r",
            "j",
            "w",
        ],
    },
];

// Match whole IPA tokens, prioritizing diphthongs and affricates.
const inventory = groups.flatMap((g) => g.sounds).sort((a, b) => b.length - a.length);
export function tokenize(ipa: string) {
    const tokens: string[] = [];
    let offset = 0;
    while (offset < ipa.length) {
        const token = inventory.find((sound) => ipa.startsWith(sound, offset));
        if (!token) throw new Error(`Unsupported IPA at ${offset}: ${ipa}`);
        tokens.push(token);
        offset += token.length;
    }
    return tokens;
}
const words: Word[] = vocabulary.map(([word, ipa, meaning, level]) => ({
    word,
    ipa,
    meaning,
    level: level as Word["level"],
    phonemes: tokenize(ipa),
}));
export { groups, words };
