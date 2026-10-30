import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Card, Screen } from '@/components/ui';
import { LICENSES, QUESTIONS } from '@/data/questions';
import { forLicense } from '@/lib/quiz';
import { useProgress } from '@/state/progress';
import { colors, type } from '@/theme';

export default function License() {
  const { progress, setLicense } = useProgress();
  return (
    <Screen title="סוג רישיון">
      <Text style={type.small}>השאלות במבחן ובתרגול מותאמות לסוג הרישיון. ההתקדמות נשמרת לכל שאלה, כך שמעבר בין רישיונות לא מוחק דבר.</Text>
      {LICENSES.map((l) => {
        const active = progress.license === l.code;
        return (
          <Pressable
            key={l.code}
            onPress={() => { setLicense(l.code); router.back(); }}
            accessibilityRole="radio"
            accessibilityState={{ selected: active }}
          >
            {({ pressed }) => (
              <Card style={[styles.item, active && styles.active, pressed && { opacity: 0.8 }]}>
                <View style={[styles.dot, active && styles.dotOn]} />
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={type.heading}>{l.label}</Text>
                  <Text style={type.small}>{l.detail} · {forLicense(QUESTIONS, l.code).length} שאלות</Text>
                </View>
              </Card>
            )}
          </Pressable>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  item: { flexDirection: 'row-reverse', alignItems: 'center', gap: 12 },
  active: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  dot: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: colors.line },
  dotOn: { borderColor: colors.primary, borderWidth: 6 },
});
