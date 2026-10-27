"""Download pinned source data for the offline vocabulary build (not app runtime)."""

import concurrent.futures
import hashlib
import json
from pathlib import Path
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
CACHE = ROOT / ".cache" / "vocabulary"
CACHE.mkdir(parents=True, exist_ok=True)
SOURCES = {
    "cefr": (
        "chihyungchang/3000MostCommonEnglishWords",
        [
            "public/data/A1.json",
            "public/data/A2.json",
            "public/data/B1.json",
            "public/data/B2.json",
            "LICENSE",
        ],
    ),
    "dictionary": (
        "skypediacode/english-vietnamese-dictionary",
        ["dictionary_en_vi.db", "LICENSE", "README.md", "ATTRIBUTION.md"],
    ),
}
lock_path = ROOT / "data" / "sources.json"
lock = json.loads(lock_path.read_text("utf-8")) if lock_path.exists() else {}


def fetch(task):
    name, repo, sha, source = task
    target = CACHE / name / source
    target.parent.mkdir(parents=True, exist_ok=True)
    if not target.exists():
        url = f"https://raw.githubusercontent.com/{repo}/{sha}/{source}"
        with urllib.request.urlopen(url, timeout=60) as response:
            target.write_bytes(response.read())
    digest = hashlib.sha256(target.read_bytes()).hexdigest()
    expected = lock.get(name, {}).get("files", {}).get(source)
    if expected and expected != digest:
        raise ValueError(f"Checksum mismatch: {source}")
    print(f"{name}/{source}: {target.stat().st_size:,} bytes", flush=True)
    return name, source, digest


tasks = []
for name, (repo, files) in SOURCES.items():
    sha = lock.get(name, {}).get("commit")
    if not sha:
        with urllib.request.urlopen(
            f"https://api.github.com/repos/{repo}/commits/main", timeout=20
        ) as response:
            sha = json.load(response)["sha"]
        lock[name] = {"repository": f"https://github.com/{repo}", "commit": sha, "files": {}}
    tasks.extend((name, repo, sha, source) for source in files)

with concurrent.futures.ThreadPoolExecutor(max_workers=4) as executor:
    for name, source, digest in executor.map(fetch, tasks):
        lock[name]["files"][source] = digest
lock_path.parent.mkdir(exist_ok=True)
lock_path.write_text(json.dumps(lock, indent=2) + "\n", encoding="utf-8")
