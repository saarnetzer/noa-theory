import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { parseRecord, normalizeLicense, cleanText } from '../src/lib/parse.ts';
import {
  EMPTY_PROGRESS, EXAM_QUESTIONS, buildExam, forLicense, mistakes, practiceOrder,
  recordAnswer, scoreExam, seeded, shuffle, summarize,
} from '../src/lib/quiz.ts';

// Shaped like a record from the official bank (answers, correct-answer marker, license tags).
const record = (id, { correct = 2, licenses = '«C1» | «В» | «A»', img = '', category = 'תמרורים' } = {}) => ({
  title2: `${String(id).padStart(4, '0')}. מה פירוש התמרור?`,
  category,
  description4: `<div dir="rtl"><ul>${[0, 1, 2, 3].map((i) => `<li><span${i === correct ? ` id="correctAnswer${id}"` : ''}>תשובה &quot;${i}&quot;</span></li>`).join('')}</ul>${img}<span>| ${licenses} | </span></div>`,
});

test('parses a bank record', () => {
  const q = parseRecord(record(1073, { img: '<img src="https://www.gov.il/x/TQ_PIC_31073.jpg" alt="traffic_sign" />' }));
  assert.equal(q.id, 1073);
  assert.equal(q.text, 'מה פירוש התמרור?');
  assert.deepEqual(q.answers, ['תשובה "0"', 'תשובה "1"', 'תשובה "2"', 'תשובה "3"']);
  assert.equal(q.correct, 2);
  assert.equal(q.topic, 'signs');
  assert.deepEqual(q.licenses, ['C1', 'B', 'A']); // Cyrillic В normalised to B
  assert.equal(q.image, 'https://www.gov.il/x/TQ_PIC_31073.jpg');
  assert.equal(q.imageMissing, false);
});

test('flags placeholder images and rejects malformed records', () => {
  assert.equal(parseRecord(record(907, { img: '<img src="x" />' })).imageMissing, true);
  assert.equal(parseRecord(record(5)).imageMissing, false);
  assert.throws(() => parseRecord({ ...record(1), category: 'אחר' }), /unknown topic/);
  const noCorrect = record(2);
  noCorrect.description4 = noCorrect.description4.replace(/ id="correctAnswer2"/, '');
  assert.throws(() => parseRecord(noCorrect), /no correct answer/);
});

test('normalizes license tags and cleans text', () => {
  assert.equal(normalizeLicense('В'), 'B');
  assert.equal(normalizeLicense('Z'), null);
  assert.equal(cleanText('<span>א&nbsp;&amp; <b>ב</b></span>'), 'א & ב');
});

const pool = [
  ...Array.from({ length: 50 }, (_, i) => ({ id: i, correct: 0, topic: 'rules', licenses: ['B'] })),
  ...Array.from({ length: 30 }, (_, i) => ({ id: 100 + i, correct: 1, topic: 'signs', licenses: ['B', 'A'] })),
  ...Array.from({ length: 20 }, (_, i) => ({ id: 200 + i, correct: 2, topic: 'safety', licenses: ['C'] })),
];

test('exam has 30 distinct questions split by topic share', () => {
  const b = forLicense(pool, 'B');
  assert.equal(b.length, 80);
  const exam = buildExam(b, seeded(1));
  assert.equal(exam.length, EXAM_QUESTIONS);
  assert.equal(new Set(exam.map((q) => q.id)).size, EXAM_QUESTIONS);
  assert.ok(exam.every((q) => q.licenses.includes('B')));
  // 50/80 rules and 30/80 signs of 30 -> 18.75 and 11.25 -> 19 and 11
  assert.equal(exam.filter((q) => q.topic === 'rules').length, 19);
  assert.equal(exam.filter((q) => q.topic === 'signs').length, 11);
});

test('passing needs at most 4 mistakes', () => {
  const exam = pool.slice(0, 30);
  const answers = exam.map((q) => q.correct);
  assert.deepEqual(scoreExam(exam, answers), { score: 30, mistakes: 0, passed: true });
  for (let i = 0; i < 4; i++) answers[i] = 3;
  assert.equal(scoreExam(exam, answers).passed, true);
  answers[4] = null; // unanswered counts as a mistake
  assert.deepEqual(scoreExam(exam, answers), { score: 25, mistakes: 5, passed: false });
});

test('progress tracks the latest answer and drives "my mistakes"', () => {
  let p = recordAnswer(EMPTY_PROGRESS, 1, false);
  p = recordAnswer(p, 2, true);
  assert.deepEqual(mistakes(pool, p).map((q) => q.id), [1]);
  p = recordAnswer(p, 1, true);
  assert.deepEqual(p.stats[1], { seen: 2, correct: 1, lastCorrect: true });
  assert.equal(mistakes(pool, p).length, 0);
  assert.deepEqual(summarize(pool, p), { total: 100, seen: 2, mastered: 2 });
  assert.equal(EMPTY_PROGRESS.stats[1], undefined, 'original progress is not mutated');
});

test('practice puts mistakes first, then unseen questions', () => {
  let p = recordAnswer(EMPTY_PROGRESS, 3, false);
  p = recordAnswer(p, 4, true);
  const order = practiceOrder(pool.slice(0, 10), p, seeded(7)).map((q) => q.id);
  assert.equal(order[0], 3);
  assert.equal(order.at(-1), 4);
  assert.equal(new Set(order).size, 10);
});

test('shuffle is a deterministic permutation with a seed', () => {
  const a = shuffle([1, 2, 3, 4, 5], seeded(42));
  assert.deepEqual([...a].sort(), [1, 2, 3, 4, 5]);
  assert.deepEqual(shuffle([1, 2, 3, 4, 5], seeded(42)), a);
});

test('bundled data is complete and consistent', () => {
  const data = JSON.parse(readFileSync(new URL('../assets/data/questions.json', import.meta.url)));
  const images = readFileSync(new URL('../src/data/images.ts', import.meta.url), 'utf8');
  assert.ok(data.questions.length > 1700, `only ${data.questions.length} questions`);
  for (const q of data.questions) {
    assert.equal(q.answers.length, 4, `question ${q.id}`);
    assert.ok(q.correct >= 0 && q.correct < 4 && q.licenses.length, `question ${q.id}`);
    if (q.hasImage) {
      assert.ok(images.includes(`  ${q.id}: require(`), `image map lacks ${q.id}`);
      assert.ok(existsSync(new URL(`../assets/questions/${q.id}.jpg`, import.meta.url)), `missing file ${q.id}.jpg`);
    }
  }
  for (const license of ['B', 'A', 'C1', 'C', 'D', '1']) {
    assert.ok(forLicense(data.questions, license).length >= EXAM_QUESTIONS, `license ${license}`);
  }
});
