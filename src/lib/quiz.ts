// Exam and practice rules, scoring and progress bookkeeping. No React or device APIs.

import type { LicenseCode, TopicKey } from './parse.ts';

// The quiz logic only needs these fields, so it works with both the parsed bank
// records and the app's bundled questions.
export interface Question {
  id: number;
  correct: number;
  topic: TopicKey;
  licenses: LicenseCode[];
}

// Format of the official computerised theory exam.
export const EXAM_QUESTIONS = 30;
export const EXAM_MINUTES = 40;
export const EXAM_MAX_MISTAKES = 4;

export interface QuestionStats {
  seen: number;
  correct: number;
  lastCorrect: boolean;
}

export interface ExamRecord {
  date: number; // ms since epoch
  license: LicenseCode;
  score: number;
  total: number;
  passed: boolean;
  seconds: number;
}

export interface Progress {
  license: LicenseCode;
  stats: Record<number, QuestionStats>;
  exams: ExamRecord[];
}

export const EMPTY_PROGRESS: Progress = { license: 'B', stats: {}, exams: [] };

export type Random = () => number;

export function shuffle<T>(items: readonly T[], random: Random = Math.random): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Small seeded PRNG (mulberry32) so tests and replays are deterministic.
export function seeded(seed: number): Random {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function forLicense<Q extends Question>(questions: readonly Q[], license: LicenseCode): Q[] {
  return questions.filter((q) => q.licenses.includes(license));
}

// Picks exam questions in proportion to each topic's share of the license's pool.
export function buildExam<Q extends Question>(pool: readonly Q[], random: Random = Math.random, size = EXAM_QUESTIONS): Q[] {
  if (pool.length <= size) return shuffle(pool, random);
  const byTopic = new Map<TopicKey, Q[]>();
  for (const q of pool) byTopic.set(q.topic, [...(byTopic.get(q.topic) ?? []), q]);

  // Largest-remainder apportionment so the quotas add up to exactly `size`.
  const quotas = [...byTopic.entries()].map(([topic, qs]) => {
    const exact = (qs.length / pool.length) * size;
    return { topic, qs, take: Math.floor(exact), rest: exact - Math.floor(exact) };
  });
  let missing = size - quotas.reduce((n, q) => n + q.take, 0);
  for (const q of [...quotas].sort((a, b) => b.rest - a.rest)) {
    if (missing-- <= 0) break;
    q.take++;
  }
  return shuffle(quotas.flatMap((q) => shuffle(q.qs, random).slice(0, q.take)), random);
}

// Answer order is shuffled per presentation; returns the display order of answer indices.
export function answerOrder(random: Random = Math.random): number[] {
  return shuffle([0, 1, 2, 3], random);
}

export interface ExamScore {
  score: number;
  mistakes: number;
  passed: boolean;
}

// answers[i] is the chosen answer index for exam question i, or null if unanswered.
export function scoreExam(questions: readonly Question[], answers: readonly (number | null)[]): ExamScore {
  const score = questions.reduce((n, q, i) => n + (answers[i] === q.correct ? 1 : 0), 0);
  const mistakes = questions.length - score;
  return { score, mistakes, passed: mistakes <= EXAM_MAX_MISTAKES };
}

export function recordAnswer(progress: Progress, questionId: number, correct: boolean): Progress {
  const prev = progress.stats[questionId] ?? { seen: 0, correct: 0, lastCorrect: false };
  return {
    ...progress,
    stats: {
      ...progress.stats,
      [questionId]: { seen: prev.seen + 1, correct: prev.correct + (correct ? 1 : 0), lastCorrect: correct },
    },
  };
}

// "My mistakes": questions whose most recent answer was wrong.
export function mistakes<Q extends Question>(pool: readonly Q[], progress: Progress): Q[] {
  return pool.filter((q) => progress.stats[q.id] && !progress.stats[q.id].lastCorrect);
}

// Practice order: recent mistakes first, then questions never seen, then the rest
// (least-seen first). Each group is shuffled so sessions don't repeat.
export function practiceOrder<Q extends Question>(pool: readonly Q[], progress: Progress, random: Random = Math.random): Q[] {
  const wrong: Q[] = [];
  const unseen: Q[] = [];
  const seen: Q[] = [];
  for (const q of pool) {
    const s = progress.stats[q.id];
    if (!s) unseen.push(q);
    else if (!s.lastCorrect) wrong.push(q);
    else seen.push(q);
  }
  const bySeen = shuffle(seen, random).sort((a, b) => progress.stats[a.id].seen - progress.stats[b.id].seen);
  return [...shuffle(wrong, random), ...shuffle(unseen, random), ...bySeen];
}

export interface TopicSummary {
  total: number;
  seen: number; // distinct questions answered at least once
  mastered: number; // last answer correct
}

export function summarize(pool: readonly Question[], progress: Progress): TopicSummary {
  let seen = 0;
  let mastered = 0;
  for (const q of pool) {
    const s = progress.stats[q.id];
    if (!s) continue;
    seen++;
    if (s.lastCorrect) mastered++;
  }
  return { total: pool.length, seen, mastered };
}

// Readiness estimate: share of the whole pool whose latest answer was correct.
export function readiness(pool: readonly Question[], progress: Progress): number {
  if (!pool.length) return 0;
  return summarize(pool, progress).mastered / pool.length;
}
