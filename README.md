# SmartCrusher drops the row your question names

Unofficial demo by Cheryl Aurelia, not affiliated with Headroom Labs. Live: https://headroom-query-rows.vercel.app

## The problem

Ask "Who opened issue #4475?" over a 100-row `gh issue list` result, and [Headroom](https://github.com/headroomlabs-ai/headroom) 0.43.1 cuts the exact row the question names:

- **SmartCrusher**: `prioritize_indices` (`crates/headroom-core/src/transforms/smart_crusher/orchestration.rs`) fills the 15-row budget with errors, outliers and first/last rows first. Rows that match the question's ID come last, so on issue/CI/log lists with many error-keyword rows they are dropped. The [docs](https://github.com/headroomlabs-ai/headroom/blob/main/docs/content/docs/smart-crusher.mdx) say query matches are preserved.
- **Proxy + Claude Code**: Claude Code loads MCP tools through ToolSearch, and the result carries a "Tool loaded." text block. `extract_user_query` (`headroom/utils.py`) takes that note as the user's question, so the question's ID never reaches SmartCrusher.

## Results (recorded, `bench/runs/`)

| Setup | Correct |
|---|---|
| Claude Code (Sonnet), no Headroom | 12/12 |
| Claude Code via `headroom proxy` 0.43.1 | 2/12 |
| … SmartCrusher fix only | 2/12 |
| … both fixes ([SmartCrusher](https://github.com/cherylaurelia/headroom/tree/fix/keep-query-matches), [query](https://github.com/cherylaurelia/headroom/tree/fix/toolsearch-query-note)) | 12/12 |
| gpt-oss-20b, README `compress()`, raw / 0.43.1 / fix | 12/12 / 2/12 / 10/12 |

Tokens saved per proxy request (median): 9,170 before, 9,075 after.

## Reproduce

`bench/` has the 2026-11-07 issue snapshot (`bench_issues.json`), the MCP tool (`ghmcp.py`), the Claude Code runner (`run_claude.py <arm> <proxy url>`), the library bench (`bench1.py`, against an OpenAI-compatible server on :8091) and `excerpt.py` (the rows around #4475 after compression).

```sh
pip install 'headroom-ai[proxy]==0.43.1'   # or the fix branch: pip install ./headroom
headroom proxy --port 8790 --no-telemetry &
python bench/run_claude.py proxy_after http://127.0.0.1:8790
```

## The page

Next.js + Tailwind, reads `bench/runs/*.json` at build time. `npm run build && npm start`; `npm test` checks that the recorded runs match the published scores.
