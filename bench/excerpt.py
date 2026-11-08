"""Compress the 100-issue snapshot with the installed headroom-ai and print the rows
around issue #4475, as the model sees them. usage: python -I excerpt.py <label>"""
import json, os, sys
from headroom.transforms.smart_crusher import SmartCrusher

here = os.path.dirname(os.path.abspath(__file__))
items = json.load(open(os.path.join(here, "bench_issues.json")))
raw = json.dumps(items)
result = SmartCrusher().crush(raw, "Who opened issue #4475 (GitHub login), and is it open or closed?", 1.0)
rows = json.loads(result.compressed)
nums = [r.get("number") for r in rows]
window = [r for r in rows if isinstance(r.get("number"), int) and 4466 <= r["number"] <= 4480]
marker = [r for r in rows if "_ccr_dropped" in r]
print(json.dumps({
    "label": sys.argv[1],
    "strategy": result.strategy,
    "rows_kept": sum(isinstance(n, int) for n in nums),
    "kept_4475": 4475 in nums,
    "window": [{"number": r["number"], "login": r["author"]["login"], "state": r["state"], "title": r["title"][:80]} for r in window],
    "marker": marker[0]["_ccr_dropped"] if marker else None,
}))
