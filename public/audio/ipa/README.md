# IPA sample audio

44 isolated phonemes synthesized locally with eSpeak NG (British English `en-gb`, rate 110), using @echogarden/espeak-ng-emscripten 0.3.5. These are synthetic learning aids, not human recordings. No third-party recordings were copied.

Engine source and license (GPL-3.0): https://github.com/echogarden-project/espeak-ng-emscripten . The engine is a build-time tool and is not included in the application. Its generated WAV output is stored here.

Mapping: `src/core/ipa-audio.json`. Generation recipe: `scripts/generate-ipa-audio.mjs`.

To reproduce, unpack version 0.3.5 of the engine outside the app dependency tree and run from the project root:

```sh
node scripts/generate-ipa-audio.mjs /absolute/path/to/package/espeak-ng.js
```

Reference for direct phoneme input: https://espeak.sourceforge.net/commands.html . Double brackets provide eSpeak phoneme mnemonics; IPA characters are not sent through ordinary text-to-speech.
