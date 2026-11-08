import beforeRaw from "@/bench/runs/excerpt_before.json";
import afterRaw from "@/bench/runs/excerpt_after.json";
import claudeAfterRaw from "@/bench/runs/claude_proxy_after.json";
import claudeBeforeRaw from "@/bench/runs/claude_proxy_before.json";
import claudeDirectRaw from "@/bench/runs/claude_direct.json";
import claudeRustOnlyRaw from "@/bench/runs/claude_proxy_after_rustonly.json";
import libraryRaw from "@/bench/runs/gptoss_library.json";
import { ClaudeRun, Excerpt, LibraryRun, median, score, type Score } from "@/lib/results";

const BRANCH_URL = "https://github.com/cherylaurelia/headroom/tree/fix/keep-query-matches";
const QUERY_BRANCH_URL = "https://github.com/cherylaurelia/headroom/tree/fix/toolsearch-query-note";
const REPO_URL = "https://github.com/cherylaurelia/headroom-demo";
const BENCH_URL = `${REPO_URL}/tree/main/bench`;
const RUNS_URL = `${BENCH_URL}/runs`;

const before = Excerpt.parse(beforeRaw);
const after = Excerpt.parse(afterRaw);
const claudeDirect = ClaudeRun.parse(claudeDirectRaw);
const claudeBefore = ClaudeRun.parse(claudeBeforeRaw);
const claudeRustOnly = ClaudeRun.parse(claudeRustOnlyRaw);
const claudeAfter = ClaudeRun.parse(claudeAfterRaw);
const claudeOks = (run: ClaudeRun) => score(run.map((a) => a.ok));
const library = LibraryRun.parse(libraryRaw);

const claudeRows: { label: string; note: string; s: Score }[] = [
  { label: "No Headroom", note: "full tool output", s: claudeOks(claudeDirect) },
  { label: "headroom proxy 0.43.1", note: "from PyPI", s: claudeOks(claudeBefore) },
  { label: "SmartCrusher fix only", note: "query is still \"Tool loaded.\"", s: claudeOks(claudeRustOnly) },
  { label: "Both fixes", note: "the two branches above", s: claudeOks(claudeAfter) },
];

const libraryRows: { label: string; note: string; s: Score }[] = [
  { label: "No Headroom", note: `${median(library.map((r) => r.raw.prompt_tokens)).toLocaleString("en-US")} prompt tokens`, s: score(library.map((r) => r.raw.ok)) },
  { label: "compress() 0.43.1", note: `${median(library.map((r) => r.before.prompt_tokens)).toLocaleString("en-US")} prompt tokens`, s: score(library.map((r) => r.before.ok)) },
  { label: "compress() with the fix", note: `${median(library.map((r) => r.after.prompt_tokens)).toLocaleString("en-US")} prompt tokens`, s: score(library.map((r) => r.after.ok)) },
];

function Scoreboard({ title, caption, rows }: { title: string; caption: string; rows: typeof claudeRows }) {
  return (
    <div className="rounded-xl border border-line bg-panel p-5">
      <h3 className="font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted">
        {caption}{" "}
        <a href={RUNS_URL} className="text-blue underline underline-offset-2">
          Every answer
        </a>
      </p>
      <table className="mt-4 w-full text-sm">
        <tbody>
          {rows.map((row) => {
            const full = row.s.correct === row.s.total;
            const tone = full ? "text-mint" : row.s.correct * 2 > row.s.total ? "text-blue" : "text-bad";

            return (
              <tr key={row.label} className="border-t border-line">
                <td className="py-2 pr-3">
                  <div className="text-soft">{row.label}</div>
                  <div className="text-xs text-muted">{row.note}</div>
                </td>
                <td className={`py-2 text-right font-mono text-base ${tone}`}>
                  {row.s.correct}/{row.s.total}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function ToolOutput({ excerpt, title, answer }: { excerpt: Excerpt; title: string; answer: string }) {
  const good = excerpt.kept_4475;

  return (
    <div className={`rounded-xl border bg-panel p-5 ${good ? "border-mint/50" : "border-bad/50"}`}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-3">
        <h3 className="font-semibold">{title}</h3>
        <span className="whitespace-nowrap font-mono text-xs text-muted">{excerpt.strategy}</span>
      </div>
      <p className="mt-1 text-sm text-muted">Rows #4471 to #4476 of what the model receives:</p>
      <pre className="mt-3 overflow-x-auto rounded-lg bg-panel-2 p-3 font-mono text-xs leading-6">
        {excerpt.window.map((row) => (
          <div key={row.number} className={row.number === 4475 ? "text-mint" : "text-soft"}>
            #{row.number} {row.login} {row.state}
          </div>
        ))}
        {good ? null : <div className="text-bad">(no #4475)</div>}
        <div className="text-muted">… {excerpt.marker}</div>
      </pre>
      <p className="mt-3 text-sm">
        <span className="text-muted">Claude Code answers: </span>
        <span className={good ? "text-mint" : "text-bad"}>{answer}</span>
      </p>
    </div>
  );
}

const firstAnswer = (run: ClaudeRun) => {
  const first = run[0];

  const answer = first === undefined ? "" : first.answer.replaceAll("**", "");

  return answer.split(/(?<=\.)\s/)[0] ?? "";
};

export default function Page() {
  return (
    <main className="mx-auto max-w-4xl px-5 py-12 sm:py-16">
      <p className="font-mono text-xs uppercase tracking-widest text-mint">Headroom · SmartCrusher</p>
      <h1 className="mt-3 text-3xl font-bold leading-tight sm:text-5xl">
        Ask about issue #4475, and SmartCrusher drops it.
      </h1>
      <p className="mt-5 text-lg text-soft">
        <span className="font-semibold text-text">Problem:</span> on a 100-row tool output, SmartCrusher drops the
        exact row the question names, and in Claude Code the proxy ranks rows against &ldquo;Tool loaded.&rdquo;
        instead of the question.
      </p>
      <p className="mt-2 text-lg text-soft">
        <span className="font-semibold text-text">Fix:</span> keep rows that match an exact ID from the question,
        and skip Claude Code&rsquo;s tool-loading note when reading the question. 10 of 12 asked-about rows were cut
        before; all 12 are kept after, at about 95 more tokens per Claude Code request.
      </p>
      <div className="mt-7 flex flex-wrap gap-3">
        <a href={BRANCH_URL} className="rounded-lg bg-mint px-4 py-2.5 font-semibold text-bg hover:opacity-90">
          SmartCrusher fix
        </a>
        <a href={QUERY_BRANCH_URL} className="rounded-lg border border-mint/60 bg-panel px-4 py-2.5 font-semibold hover:border-mint">
          Query fix
        </a>
        <a href={REPO_URL} className="rounded-lg border border-line bg-panel px-4 py-2.5 font-semibold hover:border-muted">
          Demo repo
        </a>
      </div>

      <section className="mt-14">
        <h2 className="text-xl font-semibold">Same question, same 100 issues</h2>
        <p className="mt-2 text-sm text-muted">
          Claude Code (Sonnet) calls an MCP tool that returns <code className="font-mono">gh issue list</code> for
          this repo, through <code className="font-mono">headroom proxy</code>, and is asked &ldquo;Who opened issue
          #4475, and is it open or closed?&rdquo;
        </p>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <ToolOutput excerpt={before} title="headroom-ai 0.43.1" answer={firstAnswer(claudeBefore)} />
          <ToolOutput excerpt={after} title="With the fix" answer={firstAnswer(claudeAfter)} />
        </div>
      </section>

      <section className="mt-14">
        <h2 className="text-xl font-semibold">12 random issues, asked one at a time</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <Scoreboard
            title="Claude Code through headroom proxy"
            caption="Recorded runs, Sonnet, one session per question."
            rows={claudeRows}
          />
          <Scoreboard
            title="compress() from the README, gpt-oss-20b"
            caption="Local model, temperature 0. The 2 misses after the fix had the row in front of them."
            rows={libraryRows}
          />
        </div>
      </section>

      <section className="mt-14 grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-line bg-panel p-5">
          <h3 className="font-semibold">Why the row is cut</h3>
          <p className="mt-2 text-sm text-soft">
            <code className="font-mono text-blue">prioritize_indices</code> fills the 15-row budget with errors,
            outliers and the first and last rows, then other kept rows by position. Rows matching the question&rsquo;s
            anchor come last, so on a list full of &ldquo;[BUG] … fails&rdquo; titles they never fit. The docs list
            query matches as preserved.
          </p>
        </div>
        <div className="rounded-xl border border-line bg-panel p-5">
          <h3 className="font-semibold">Why the SmartCrusher fix alone isn&rsquo;t enough</h3>
          <p className="mt-2 text-sm text-soft">
            Claude Code loads MCP tools through ToolSearch, whose result carries a &ldquo;Tool loaded.&rdquo; text
            block. <code className="font-mono text-blue">extract_user_query</code> stops at the newest user text, so
            that note becomes the relevance query and the question&rsquo;s ID never reaches SmartCrusher.
          </p>
        </div>
      </section>

      <p className="mt-10 text-sm text-muted">
        Bench scripts, the issue snapshot and every recorded answer are in the{" "}
        <a href={BENCH_URL} className="text-blue underline underline-offset-2">
          demo repo
        </a>
        . Not tested: other agents than Claude Code, and questions that name a row by its title words instead of an
        ID (those rows can still be cut).
      </p>

      <footer className="mt-14 border-t border-line pt-6 text-sm text-muted">
        Unofficial demo by Cheryl Aurelia: not affiliated with Headroom Labs.
      </footer>
    </main>
  );
}
