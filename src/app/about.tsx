import Constants from 'expo-constants';
import { Linking, Text } from 'react-native';
import { useState } from 'react';
import { Button, Card, Confirm, Screen } from '@/components/ui';
import { QUESTIONS, SOURCE } from '@/data/questions';
import { useProgress } from '@/state/progress';
import { colors, type } from '@/theme';

export default function About() {
  const { reset } = useProgress();
  const [confirm, setConfirm] = useState(false);
  return (
    <Screen title="אודות">
      <Card>
        <Text style={type.heading}>נועה עוברת תיאוריה וטסט</Text>
        <Text style={type.body}>
          {QUESTIONS.length} שאלות מהמאגר הרשמי, כולל תמונות, זמינות גם בלי חיבור לאינטרנט. ההתקדמות נשמרת רק במכשיר שלך.
        </Text>
      </Card>
      <Card>
        <Text style={type.heading}>מקור השאלות</Text>
        <Text style={type.body}>{SOURCE.text}</Text>
        <Text style={type.small}>עודכן מהמאגר: {SOURCE.generated} · רישיון Creative Commons ייחוס (CC BY)</Text>
        <Text style={[type.body, { color: colors.primary, textDecorationLine: 'underline' }]} onPress={() => Linking.openURL(SOURCE.url)} accessibilityRole="link">
          המאגר ב-data.gov.il
        </Text>
        <Text style={type.small}>האפליקציה אינה קשורה למשרד התחבורה ואינה מטעמו. המבחן לדוגמה מדמה את מבנה המבחן העיוני הממוחשב.</Text>
      </Card>
      <Button label="איפוס ההתקדמות" kind="danger" onPress={() => setConfirm(true)} />
      <Text style={[type.small, { textAlign: 'center' }]}>גרסה {Constants.expoConfig?.version ?? '1.0.0'}</Text>
      <Confirm
        visible={confirm}
        title="לאפס את כל ההתקדמות?"
        message="כל התשובות, הטעויות והיסטוריית המבחנים יימחקו מהמכשיר."
        confirmLabel="איפוס"
        danger
        onConfirm={() => { reset(); setConfirm(false); }}
        onCancel={() => setConfirm(false)}
      />
    </Screen>
  );
}
