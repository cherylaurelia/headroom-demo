import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { ClaudeRun, LibraryRun, median, score } from "./results.ts";

const read = (name: string): string =>
  readFileSync(new URL(`../bench/runs/${name}`, import.meta.url), "utf8");

const loadClaude = (name: string): ClaudeRun => ClaudeRun.parse(JSON.parse(read(name)));
const loadLibrary = (name: string): LibraryRun => LibraryRun.parse(JSON.parse(read(name)));

test("score counts correct answers", () => {
  assert.deepEqual(score([true, false, true]), { correct: 2, total: 3 });
  assert.deepEqual(score([]), { correct: 0, total: 0 });
});

test("median handles odd, even and unsorted input", () => {
  assert.equal(median([3, 1, 2]), 2);
  assert.equal(median([4, 1, 3, 2]), 3);
  assert.throws(() => median([]));
});

test("recorded Claude Code runs parse and match the published scores", () => {
  const ok = (name: string) => score(loadClaude(name).map((a) => a.ok));

  assert.deepEqual(ok("claude_direct.json"), { correct: 12, total: 12 });
  assert.deepEqual(ok("claude_proxy_before.json"), { correct: 2, total: 12 });
  assert.deepEqual(ok("claude_proxy_after_rustonly.json"), { correct: 2, total: 12 });
  assert.deepEqual(ok("claude_proxy_after.json"), { correct: 12, total: 12 });
});

test("library bench: every asked row is kept after the fix", () => {
  const rows = loadLibrary("gptoss_library.json");

  assert.equal(rows.filter((r) => r.after.row_kept).length, 12);
  assert.equal(rows.filter((r) => r.row_kept_before).length, 2);
});
