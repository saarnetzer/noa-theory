// Mock exam in the official format: 30 questions, 40 minutes, pass with at most 4 mistakes.
// Answers stay hidden until the exam is submitted (or time runs out).

import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { QuestionView } from '@/components/QuestionView';
import { Button, Card, Confirm, Screen } from '@/components/ui';
import { QUESTIONS, licenseInfo, type AppQuestion } from '@/data/questions';
import { EXAM_MAX_MISTAKES, EXAM_MINUTES, answerOrder, buildExam, forLicense, scoreExam } from '@/lib/quiz';
import { useProgress } from '@/state/progress';
import { colors, radius, type } from '@/theme';

const clock = (ms: number) => {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

export default function Exam() {
  const { progress, answerMany, addExam } = useProgress();
  const [exam] = useState(() => {
    const questions = buildExam(forLicense(QUESTIONS, progress.license));
    return { questions, orders: questions.map(() => answerOrder()), license: progress.license, startedAt: Date.now() };
  });
  const endsAt = exam.startedAt + EXAM_MINUTES * 60_000;
  const [answers, setAnswers] = useState<(number | null)[]>(() => exam.questions.map(() => null));
  const [index, setIndex] = useState(0);
  const [now, setNow] = useState(exam.startedAt);
  const [finished, setFinished] = useState<null | { seconds: number }>(null);
  const [confirm, setConfirm] = useState<'submit' | 'leave' | null>(null);
  const [showGrid, setShowGrid] = useState(false);

  const submit = useCallback(() => {
    if (finished) return;
    const final = answers;
    const seconds = Math.round((Math.min(Date.now(), endsAt) - exam.startedAt) / 1000);
    const result = scoreExam(exam.questions, final);
    // Only questions actually answered count toward practice statistics.
    answerMany(exam.questions.flatMap((q, i) => (final[i] === null ? [] : [{ id: q.id, correct: final[i] === q.correct }])));
    addExam({ date: Date.now(), license: exam.license, score: result.score, total: exam.questions.length, passed: result.passed, seconds });
    setFinished({ seconds });
    setConfirm(null);
  }, [finished, answers, endsAt, exam, answerMany, addExam]);

  // Clock tick; submits automatically when time runs out.
  useEffect(() => {
    if (finished) return;
    const t = setInterval(() => {
      const current = Date.now();
      setNow(current);
      if (current >= endsAt) submit();
    }, 500);
    return () => clearInterval(t);
  }, [finished, endsAt, submit]);

  if (finished) return <Results questions={exam.questions} orders={exam.orders} answers={answers} seconds={finished.seconds} />;

  const question = exam.questions[index];
  const remaining = endsAt - now;
  const answeredCount = answers.filter((a) => a !== null).length;
  const last = index === exam.questions.length - 1;

  return (
    <Screen
      title={`מבחן · ${licenseInfo(exam.license).label}`}
      back={false}
      side={<Text style={[styles.timer, remaining < 5 * 60_000 && { color: colors.danger }]} accessibilityLabel={`זמן שנותר ${clock(remaining)}`}>⏱ {clock(remaining)}</Text>}
      footer={
        <View style={styles.footerRow}>
          <Button label="הקודמת" kind="secondary" disabled={index === 0} onPress={() => setIndex(index - 1)} style={{ flex: 1 }} />
          <Button label={`${answeredCount}/${exam.questions.length}`} kind="secondary" onPress={() => setShowGrid((v) => !v)} style={{ flex: 0.8 }} />
          {last
            ? <Button label="הגשה" onPress={() => setConfirm('submit')} style={{ flex: 1 }} />
            : <Button label="הבאה" onPress={() => setIndex(index + 1)} style={{ flex: 1 }} />}
        </View>
      }
    >
      {showGrid && (
        <Card style={styles.grid}>
          {exam.questions.map((q, i) => (
            <Pressable
              key={q.id}
              onPress={() => { setIndex(i); setShowGrid(false); }}
              style={[styles.cell, answers[i] !== null && styles.cellDone, i === index && styles.cellNow]}
              accessibilityRole="button"
              accessibilityLabel={`שאלה ${i + 1}${answers[i] !== null ? ', נענתה' : ''}`}
            >
              <Text style={[styles.cellText, answers[i] !== null && { color: '#fff' }]}>{i + 1}</Text>
            </Pressable>
          ))}
          <Button label="הגשת המבחן" onPress={() => setConfirm('submit')} style={{ width: '100%', marginTop: 6 }} />
        </Card>
      )}
      <QuestionView
        question={question}
        order={exam.orders[index]}
        selected={answers[index]}
        reveal={false}
        onSelect={(i) => setAnswers((a) => a.map((v, n) => (n === index ? i : v)))}
        number={`שאלה ${index + 1} מתוך ${exam.questions.length}`}
      />
      <Pressable onPress={() => setConfirm('leave')} accessibilityRole="button">
        <Text style={[type.small, { textAlign: 'center', textDecorationLine: 'underline' }]}>יציאה מהמבחן</Text>
      </Pressable>
      <Confirm
        visible={confirm === 'submit'}
        title="להגיש את המבחן?"
        message={answeredCount < exam.questions.length ? `לא ענית על ${exam.questions.length - answeredCount} שאלות. שאלה שלא נענתה נחשבת טעות.` : 'אי אפשר לשנות תשובות אחרי ההגשה.'}
        confirmLabel="הגשה"
        onConfirm={submit}
        onCancel={() => setConfirm(null)}
      />
      <Confirm
        visible={confirm === 'leave'}
        title="לצאת מהמבחן?"
        message="המבחן לא יישמר."
        confirmLabel="יציאה"
        danger
        onConfirm={() => { setConfirm(null); router.back(); }}
        onCancel={() => setConfirm(null)}
      />
    </Screen>
  );
}

function Results({ questions, orders, answers, seconds }: { questions: AppQuestion[]; orders: number[][]; answers: (number | null)[]; seconds: number }) {
  const { score, mistakes, passed } = useMemo(() => scoreExam(questions, answers), [questions, answers]);
  const wrong = questions.map((q, i) => ({ q, i })).filter(({ q, i }) => answers[i] !== q.correct);
  return (
    <Screen title="תוצאות המבחן" back={false} footer={
      <View style={styles.footerRow}>
        <Button label="מבחן חדש" onPress={() => router.replace('/exam')} style={{ flex: 1 }} />
        <Button label="לדף הבית" kind="secondary" onPress={() => router.dismissTo('/')} style={{ flex: 1 }} />
      </View>
    }>
      <Card style={[styles.result, { backgroundColor: passed ? colors.successSoft : colors.dangerSoft, borderColor: passed ? colors.success : colors.danger }]}>
        <Text style={[type.title, styles.center, { fontSize: 44, color: passed ? colors.success : colors.danger }]}>{score}/{questions.length}</Text>
        <Text style={[type.heading, styles.center]}>{passed ? 'עברת! 🎉' : 'לא עברת הפעם'}</Text>
        <Text style={[type.small, styles.center]}>
          {mistakes} טעויות (מותר עד {EXAM_MAX_MISTAKES}) · {clock(seconds * 1000)} דקות
        </Text>
      </Card>
      {wrong.length > 0 && <Text style={type.heading}>השאלות שטעית בהן</Text>}
      {wrong.map(({ q, i }) => (
        <Card key={q.id}>
          <QuestionView
            question={q}
            order={orders[i]}
            selected={answers[i]}
            reveal
            number={`שאלה ${i + 1}${answers[i] === null ? ' · לא נענתה' : ''}`}
          />
        </Card>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  timer: { ...type.body, fontWeight: '800', color: colors.primary, writingDirection: 'ltr' },
  footerRow: { flexDirection: 'row-reverse', gap: 10 },
  grid: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  cell: { width: 44, height: 44, borderRadius: radius.sm, borderWidth: 1.5, borderColor: colors.line, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.card },
  cellDone: { backgroundColor: colors.primary, borderColor: colors.primary },
  cellNow: { borderColor: colors.warn, borderWidth: 3 },
  cellText: { fontWeight: '700', color: colors.text },
  result: { alignItems: 'center', gap: 6 },
  center: { textAlign: 'center' },
});
