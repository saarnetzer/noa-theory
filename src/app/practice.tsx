// Practice: one question at a time with instant feedback. `mode` is 'all' (smart order),
// 'mistakes', or a topic key.

import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { QuestionView } from '@/components/QuestionView';
import { Button, Card, Screen } from '@/components/ui';
import { QUESTIONS, TOPICS, type AppQuestion } from '@/data/questions';
import type { TopicKey } from '@/lib/parse';
import { answerOrder, forLicense, mistakes, practiceOrder } from '@/lib/quiz';
import { useProgress } from '@/state/progress';
import { colors, type } from '@/theme';

export default function Practice() {
  const { mode = 'all' } = useLocalSearchParams<{ mode?: string }>();
  const { progress, answer } = useProgress();
  const topic = TOPICS.find((t) => t.key === mode);
  const title = mode === 'mistakes' ? 'הטעויות שלי' : topic ? topic.label : 'תרגול חכם';

  // The session (question order and each question's answer order) is fixed when the screen
  // opens, so answering doesn't reshuffle it.
  const [{ queue, orders }] = useState(() => {
    const pool = forLicense(QUESTIONS, progress.license);
    const scoped = mode === 'mistakes' ? mistakes(pool, progress) : topic ? pool.filter((q) => q.topic === (mode as TopicKey)) : pool;
    const queue: AppQuestion[] = practiceOrder(scoped, progress);
    return { queue, orders: queue.map(() => answerOrder()) };
  });
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [tally, setTally] = useState({ right: 0, done: 0 });
  const question = queue[index];

  if (!queue.length) {
    return (
      <Screen title={title}>
        <Card><Text style={type.body}>אין כאן שאלות כרגע. כל הכבוד!</Text></Card>
        <Button label="חזרה" kind="secondary" onPress={() => router.back()} />
      </Screen>
    );
  }

  if (!question) {
    return (
      <Screen title={title}>
        <Card style={{ alignItems: 'center' }}>
          <Text style={[type.title, { textAlign: 'center' }]}>סיימתם את כל השאלות 🎉</Text>
          <Text style={[type.body, { textAlign: 'center' }]}>{tally.right} תשובות נכונות מתוך {tally.done}</Text>
        </Card>
        <Button label="חזרה לדף הבית" onPress={() => router.back()} />
      </Screen>
    );
  }

  const choose = (i: number) => {
    if (selected !== null) return;
    const correct = i === question.correct;
    setSelected(i);
    setTally((t) => ({ right: t.right + (correct ? 1 : 0), done: t.done + 1 }));
    answer(question.id, correct);
  };
  const next = () => {
    setSelected(null);
    setIndex((n) => n + 1);
  };

  const answered = selected !== null;
  const right = answered && selected === question.correct;
  return (
    <Screen
      title={title}
      side={<Text style={styles.tally}>{tally.right}/{tally.done} ✓</Text>}
      footer={
        <View style={styles.footer}>
          {answered && (
            <Text style={[styles.feedback, { color: right ? colors.success : colors.danger }]}>
              {right ? 'נכון!' : 'לא נכון – התשובה הנכונה מסומנת בירוק'}
            </Text>
          )}
          <Button label={answered ? 'לשאלה הבאה' : 'דלגו'} kind={answered ? 'primary' : 'secondary'} onPress={next} />
        </View>
      }
    >
      <QuestionView
        question={question}
        order={orders[index]}
        selected={selected}
        reveal={answered}
        onSelect={answered ? undefined : choose}
        number={`שאלה ${index + 1} מתוך ${queue.length}`}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  tally: { ...type.small, fontWeight: '700', color: colors.success },
  footer: { gap: 8 },
  feedback: { ...type.body, fontWeight: '700', textAlign: 'center' },
});
