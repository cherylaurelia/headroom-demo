"""Claude Code (sonnet) bench: 12 issue lookups via an MCP list_issues tool.
usage: run_claude.py <arm> [base_url]   arm in {direct, proxy_before, proxy_after}"""
import json, os, subprocess, sys
HERE=os.path.dirname(os.path.abspath(__file__))
arm=sys.argv[1]; base=sys.argv[2] if len(sys.argv)>2 else None
items=json.load(open(os.path.join(HERE,"bench_issues.json")))
nums=[r["number"] for r in json.load(open(os.path.join(HERE,"runs","gptoss_library.json")))]
env=dict(os.environ)
if base: env["ANTHROPIC_BASE_URL"]=base
out=[]
for n in nums:
    it=[i for i in items if i["number"]==n][0]
    q=(f"Use the gh list_issues tool (repo headroomlabs-ai/headroom, state all, limit 100) and answer: "
       f"Who opened issue #{n} (GitHub login), and is it open or closed? Answer only from the tool output. If it isn't there, say NOT FOUND.")
    p=subprocess.run(["claude","-p",q,"--mcp-config",os.path.join(HERE,"mcp.json"),"--strict-mcp-config","--allowedTools","mcp__gh__list_issues",
                      "--model","sonnet","--output-format","json"],cwd=HERE,env=env,capture_output=True,text=True,timeout=600)
    try: d=json.loads(p.stdout)
    except Exception: d={"result":"ERROR "+p.stdout[-300:]+p.stderr[-300:]}
    a=d.get("result","") or ""
    ok=it["author"]["login"].lower() in a.lower() and it["state"].lower() in a.lower() and "not found" not in a.lower()
    out.append(dict(number=n,ok=ok,turns=d.get("num_turns"),cost=d.get("total_cost_usd"),answer=a.strip().replace("\n"," ")[:200]))
    print(json.dumps(out[-1]),flush=True)
json.dump(out,open(os.path.join(HERE,"runs",f"claude_{arm}.json"),"w"),indent=1)
print(arm, sum(o["ok"] for o in out),"/",len(out))
