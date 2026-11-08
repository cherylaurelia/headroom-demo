import json, random, re, sys, httpx
from headroom import compress
items=json.load(open("bench_issues.json")); raw=json.dumps(items)
random.seed(7)
def msgs(q, content):
    return [{"role":"system","content":"Answer from the tool output only. If the answer is not in it, say NOT FOUND."},
            {"role":"user","content":q},
            {"role":"assistant","content":None,"tool_calls":[{"id":"c1","type":"function","function":{"name":"gh_issue_list","arguments":"{\"limit\":100,\"state\":\"all\"}"}}]},
            {"role":"tool","tool_call_id":"c1","content":content}]
def ask(m):
    r=httpx.post("http://127.0.0.1:8091/v1/chat/completions",json={"model":"x","messages":m,"max_tokens":2048,"temperature":0},timeout=600).json()
    return r["choices"][0]["message"].get("content") or "", r["usage"]["prompt_tokens"]
sample=random.sample(items,12)
rows=[]
for it in sample:
    q=f"Who opened issue #{it['number']} (GitHub login), and is it open or closed?"
    c=compress(msgs(q,raw), model="gpt-4o")
    sent=c.messages[-1]["content"]; kept=f'"number":{it["number"]}' in sent
    want_login=it["author"]["login"].lower(); want_state=it["state"].lower()
    res={}
    for arm,content in [("headroom",sent)]:
        a,pt=ask(msgs(q,content)); al=a.lower()
        ok= want_login in al and want_state in al
        res[arm]=(ok,pt,a.strip().replace("\n"," ")[:120])
    rows.append(dict(number=it["number"],kept=kept,want=f"{want_login}/{want_state}",headroom=res["headroom"]))
    print(json.dumps(rows[-1]),flush=True)
json.dump(rows,open("bench1_after_results.json","w"),indent=1)
for arm in ["headroom"]:
    print(arm, sum(r[arm][0] for r in rows),"/",len(rows), "dropped-row correct:", sum(r[arm][0] for r in rows if not r["kept"]),"/",sum(not r["kept"] for r in rows))
