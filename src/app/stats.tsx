import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Bar, Card, Screen } from '@/components/ui';
import { QUESTIONS, TOPICS, licenseInfo } from '@/data/questions';
import { forLicense, summarize } from '@/lib/quiz';
import { useProgress } from '@/state/progress';
import { colors, type } from '@/theme';

const DATE = new Intl.DateTimeFormat('he-IL', { day: 'numeric', month: 'numeric', hour: '2-digit', minute: '2-digit' });

export default function Stats() {
  const { progress } = useProgress();
  const pool = useMemo(() => forLicense(QUESTIONS, progress.license), [progress.license]);
  const exams = progress.exams.filter((e) => e.license === progress.license);
  const passRate = exams.length ? exams.filter((e) => e.passed).length / exams.length : 0;
  const answers = Object.values(progress.stats).reduce((acc, s) => ({ seen: acc.seen + s.seen, correct: acc.correct + s.correct }), { seen: 0, correct: 0 });

  return (
    <Screen title={`סטטיסטיקה · ${licenseInfo(progress.license).label}`}>
      <View style={styles.row}>
        <Stat value={String(answers.seen)} label="תשובות" />
        <Stat value={answers.seen ? `${Math.round((answers.correct / answers.seen) * 100)}%` : '–'} label="דיוק" />
        <Stat value={exams.length ? `${Math.round(passRate * 100)}%` : '–'} label="מבחנים שעברת" />
      </View>

      <Card>
        <Text style={type.heading}>שליטה לפי נושא</Text>
        {TOPICS.map((t) => {
          const s = summarize(pool.filter((q) => q.topic === t.key), progress);
          return (
            <View key={t.key} style={{ gap: 6 }}>
              <View style={styles.line}>
                <Text style={type.body}>{t.icon} {t.label}</Text>
                <Text style={type.small}>{s.mastered}/{s.total} · נוסו {s.seen}</Text>
              </View>
              <Bar value={s.mastered / Math.max(s.total, 1)} color={colors.success} />
            </View>
          );
        })}
      </Card>

      <Card>
        <Text style={type.heading}>מבחנים אחרונים</Text>
        {exams.length === 0 && <Text style={type.small}>עוד לא עשית מבחן לדוגמה ברישיון הזה.</Text>}
        {exams.slice(0, 20).map((e) => (
          <View key={e.date} style={styles.line}>
            <Text style={[type.body, { color: e.passed ? colors.success : colors.danger, fontWeight: '700' }]}>
              {e.score}/{e.total} {e.passed ? '✓' : '✕'}
            </Text>
            <Text style={type.small}>{DATE.format(e.date)}</Text>
          </View>
        ))}
      </Card>
    </Screen>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <Card style={styles.stat}>
      <Text style={[type.title, { textAlign: 'center' }]}>{value}</Text>
      <Text style={[type.small, { textAlign: 'center' }]}>{label}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row-reverse', gap: 10 },
  stat: { flex: 1, alignItems: 'center', gap: 2, paddingHorizontal: 8 },
  line: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' },
});
