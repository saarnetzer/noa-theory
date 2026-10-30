import { router } from 'expo-router';
import { useMemo } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Bar, Button, Card, Screen } from '@/components/ui';
import { QUESTIONS, TOPICS, licenseInfo } from '@/data/questions';
import { EXAM_MINUTES, EXAM_QUESTIONS, forLicense, mistakes, summarize } from '@/lib/quiz';
import { useProgress } from '@/state/progress';
import { colors, radius, type } from '@/theme';

export default function Home() {
  const { progress, loaded } = useProgress();
  const pool = useMemo(() => forLicense(QUESTIONS, progress.license), [progress.license]);
  const overall = summarize(pool, progress);
  const wrong = mistakes(pool, progress).length;
  const license = licenseInfo(progress.license);
  const lastExam = progress.exams.find((e) => e.license === progress.license);

  if (!loaded) {
    return <View style={styles.loading}><ActivityIndicator color={colors.primary} /></View>;
  }

  return (
    <Screen back={false} title="נועה עוברת תיאוריה" side={
      <Pressable onPress={() => router.push('/license')} style={styles.licenseChip} accessibilityRole="button" accessibilityLabel={`סוג רישיון: ${license.label}. החלפה`}>
        <Text style={styles.licenseText}>{license.label} ▾</Text>
      </Pressable>
    }>
      <Card style={styles.hero}>
        <Text style={[type.small, styles.onDark]}>מוכנות למבחן · {license.label}</Text>
        <Text style={[type.title, styles.onDark, { fontSize: 40 }]}>{Math.round((overall.mastered / Math.max(overall.total, 1)) * 100)}%</Text>
        <Bar value={overall.mastered / Math.max(overall.total, 1)} color={colors.warn} />
        <Text style={[type.small, styles.onDark]}>
          {overall.mastered} מתוך {overall.total} שאלות נענו נכון בפעם האחרונה · {overall.seen} נוסו
        </Text>
        {lastExam && (
          <Text style={[type.small, styles.onDark]}>
            מבחן אחרון: {lastExam.score}/{lastExam.total} {lastExam.passed ? '✓ עבר' : '✕ לא עבר'}
          </Text>
        )}
      </Card>

      <Button label="מבחן לדוגמה" sub={`${EXAM_QUESTIONS} שאלות · ${EXAM_MINUTES} דקות · כמו במבחן האמיתי`} onPress={() => router.push('/exam')} />

      <View style={styles.row}>
        <Tile icon="🎯" title="תרגול חכם" sub="טעויות ושאלות חדשות קודם" onPress={() => router.push({ pathname: '/practice', params: { mode: 'all' } })} />
        <Tile icon="❗" title="הטעויות שלי" sub={wrong ? `${wrong} שאלות לחזרה` : 'אין כרגע טעויות'} onPress={() => router.push({ pathname: '/practice', params: { mode: 'mistakes' } })} disabled={!wrong} />
      </View>

      <Text style={[type.heading, { marginTop: 4 }]}>תרגול לפי נושא</Text>
      {TOPICS.map((t) => {
        const s = summarize(pool.filter((q) => q.topic === t.key), progress);
        return (
          <Pressable key={t.key} onPress={() => router.push({ pathname: '/practice', params: { mode: t.key } })} accessibilityRole="button" accessibilityLabel={`תרגול ${t.label}`}>
            {({ pressed }) => (
              <Card style={[styles.topic, pressed && { opacity: 0.8 }]}>
                <View style={styles.topicHead}>
                  <Text style={styles.topicIcon}>{t.icon}</Text>
                  <Text style={[type.heading, { flex: 1 }]}>{t.label}</Text>
                  <Text style={type.small}>{s.mastered}/{s.total}</Text>
                </View>
                <Bar value={s.mastered / Math.max(s.total, 1)} />
              </Card>
            )}
          </Pressable>
        );
      })}

      <View style={styles.row}>
        <Tile icon="📊" title="סטטיסטיקה" sub="התקדמות והיסטוריית מבחנים" onPress={() => router.push('/stats')} />
        <Tile icon="ℹ️" title="אודות" sub="מקור השאלות והגדרות" onPress={() => router.push('/about')} />
      </View>
    </Screen>
  );
}

function Tile({ icon, title, sub, onPress, disabled }: { icon: string; title: string; sub: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable onPress={onPress} disabled={disabled} style={{ flex: 1 }} accessibilityRole="button" accessibilityState={{ disabled }}>
      {({ pressed }) => (
        <Card style={[styles.tile, (pressed || disabled) && { opacity: disabled ? 0.5 : 0.8 }]}>
          <Text style={styles.tileIcon}>{icon}</Text>
          <Text style={type.heading}>{title}</Text>
          <Text style={type.small}>{sub}</Text>
        </Card>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  licenseChip: { backgroundColor: colors.primarySoft, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  licenseText: { color: colors.primary, fontWeight: '700', writingDirection: 'rtl' },
  hero: { backgroundColor: colors.primaryDark, borderColor: colors.primaryDark, gap: 8 },
  onDark: { color: '#fff' },
  row: { flexDirection: 'row-reverse', gap: 12 },
  tile: { gap: 4, minHeight: 112 },
  tileIcon: { fontSize: 24, textAlign: 'right' },
  topic: { gap: 10, borderRadius: radius.md },
  topicHead: { flexDirection: 'row-reverse', alignItems: 'center', gap: 10 },
  topicIcon: { fontSize: 22 },
});
