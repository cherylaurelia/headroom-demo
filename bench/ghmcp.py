"""Minimal stdio MCP server: list_issues returns a fixed snapshot of
`gh issue list -R headroomlabs-ai/headroom --state all --limit 100 --json ...` (2026-11-07)."""
import json, os, sys, datetime
from mcp.server.mcpserver import MCPServer as FastMCP
SNAP = json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "bench_issues.json")))
LOG = os.environ.get("GHMCP_LOG", "calls.log")
mcp = FastMCP("gh")
@mcp.tool()
def list_issues(repo: str = "headroomlabs-ai/headroom", state: str = "all", limit: int = 100) -> str:
    """List GitHub issues for a repository (number, title, state, author, createdAt, labels)."""
    with open(LOG, "a") as f: f.write(f"{datetime.datetime.now().isoformat()} list_issues {repo} {state} {limit}\n")
    return json.dumps(SNAP[:limit])
if __name__ == "__main__":
    mcp.run()
