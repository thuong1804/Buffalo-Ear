import fs from "node:fs";
import { pathToFileURL } from "node:url";
const enginePath = process.argv[2];
if (!enginePath)
    throw new Error(
        "Pass the absolute path to @echogarden/espeak-ng-emscripten 0.3.5 espeak-ng.js",
    );
const { default: init } = await import(pathToFileURL(enginePath).href);
const m = await init();
const voice = new m.eSpeakNGWorker();
voice.set_voice("en-gb");
voice.set_rate(110);
const phonemes = {
    iː: "i:",
    ɪ: "I",
    ʊ: "U",
    uː: "u:",
    e: "E",
    ə: "@",
    ɜː: "3:",
    ɔː: "O:",
    æ: "a",
    ʌ: "V",
    ɑː: "A:",
    ɒ: "0",
    ɪə: "I@",
    eɪ: "eI",
    ʊə: "U@",
    ɔɪ: "OI",
    əʊ: "@U",
    eə: "E@",
    aɪ: "aI",
    aʊ: "aU",
    p: "p",
    b: "b",
    t: "t",
    d: "d",
    k: "k",
    ɡ: "g",
    f: "f",
    v: "v",
    θ: "T",
    ð: "D",
    s: "s",
    z: "z",
    ʃ: "S",
    ʒ: "Z",
    h: "h",
    tʃ: "tS",
    dʒ: "dZ",
    m: "m",
    n: "n",
    ŋ: "N",
    l: "l",
    r: "r",
    j: "j",
    w: "w",
};
fs.mkdirSync("public/audio/ipa", { recursive: true });
const manifest = {};
for (const [ipa, code] of Object.entries(phonemes)) {
    let chunks = [];
    voice.synthesize(`[[${code}]]`, (samples) => {
        chunks.push(Buffer.from(samples.buffer, samples.byteOffset, samples.byteLength));
        return false;
    });
    const pcm = Buffer.concat(chunks);
    if (pcm.length < 100) throw new Error(`Empty sample ${ipa}`);
    const header = Buffer.alloc(44);
    header.write("RIFF");
    header.writeUInt32LE(pcm.length + 36, 4);
    header.write("WAVEfmt ", 8);
    header.writeUInt32LE(16, 16);
    header.writeUInt16LE(1, 20);
    header.writeUInt16LE(1, 22);
    header.writeUInt32LE(22050, 24);
    header.writeUInt32LE(44100, 28);
    header.writeUInt16LE(2, 32);
    header.writeUInt16LE(16, 34);
    header.write("data", 36);
    header.writeUInt32LE(pcm.length, 40);
    const file = `${Object.keys(manifest).length + 1}.wav`;
    fs.writeFileSync(`public/audio/ipa/${file}`, Buffer.concat([header, pcm]));
    manifest[ipa] = `/audio/ipa/${file}`;
}
fs.writeFileSync("src/core/ipa-audio.json", JSON.stringify(manifest, null, 4) + "\n");
console.log("Generated", Object.keys(manifest).length, "isolated en-gb phoneme WAV samples");
