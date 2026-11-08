import { z } from "zod";

const ClaudeAnswer = z.object({
  number: z.number().int(),
  ok: z.boolean(),
  answer: z.string(),
});

export const ClaudeRun = z.array(ClaudeAnswer);

export type ClaudeRun = z.infer<typeof ClaudeRun>;

const LibraryArm = z.object({
  ok: z.boolean(),
  prompt_tokens: z.number().int(),
  answer: z.string(),
});

export const LibraryRun = z.array(
  z.object({
    number: z.number().int(),
    row_kept_before: z.boolean(),
    raw: LibraryArm,
    before: LibraryArm,
    after: LibraryArm.extend({ row_kept: z.boolean() }),
  }),
);

export type LibraryRun = z.infer<typeof LibraryRun>;

export const Excerpt = z.object({
  label: z.string(),
  strategy: z.string(),
  rows_kept: z.number().int(),
  kept_4475: z.boolean(),
  window: z.array(
    z.object({ number: z.number().int(), login: z.string(), state: z.string(), title: z.string() }),
  ),
  marker: z.string().nullable(),
});

export type Excerpt = z.infer<typeof Excerpt>;

export type Score = { correct: number; total: number };

/** Counts correct answers in one arm of the bench. */
export function score(oks: readonly boolean[]): Score {
  let correct = 0;

  for (const ok of oks) {
    if (ok) {
      correct += 1;
    }
  }

  return { correct, total: oks.length };
}

/** Median of a non-empty list of numbers, rounded to an integer. */
export function median(values: readonly number[]): number {
  if (values.length === 0) {
    throw new Error("median of an empty list");
  }

  const sorted = values.toSorted((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const value = sorted.length % 2 === 1 ? sorted[mid] : ((sorted[mid - 1] ?? 0) + (sorted[mid] ?? 0)) / 2;

  return Math.round(value ?? 0);
}
