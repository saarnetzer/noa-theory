// One question: text, optional picture, and four answers in a shuffled display order.
// In practice mode answers are revealed right away; in an exam only after submitting.

import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import type { AppQuestion } from '@/data/questions';
import { topicLabel } from '@/data/questions';
import { QUESTION_IMAGES } from '@/data/images';
import { colors, radius, type } from '@/theme';

const LETTERS = ['א', 'ב', 'ג', 'ד'];

export function QuestionView({ question, order, selected, reveal, onSelect, number }: {
  question: AppQuestion;
  order: number[]; // display order of answer indices
  selected: number | null; // chosen answer index (in the bank's order)
  reveal: boolean;
  onSelect?: (answerIndex: number) => void;
  number?: string; // e.g. "שאלה 3 מתוך 30"
}) {
  const image = question.hasImage ? QUESTION_IMAGES[question.id] : undefined;
  const size = image ? Image.resolveAssetSource?.(image) : undefined;
  const ratio = size?.width && size?.height ? size.width / size.height : 350 / 230;

  return (
    <View style={styles.wrap}>
      <View style={styles.meta}>
        {number && <Text style={styles.number}>{number}</Text>}
        <Text style={styles.topic}>{topicLabel(question.topic)}</Text>
      </View>
      <Text style={styles.text} accessibilityRole="header">{question.text}</Text>
      {image !== undefined && (
        <View style={styles.imageBox}>
          <Image source={image} style={{ width: '100%', aspectRatio: ratio }} resizeMode="contain" accessibilityIgnoresInvertColors />
        </View>
      )}
      <View style={styles.answers} accessibilityRole="radiogroup">
        {order.map((answerIndex, pos) => {
          const isSelected = selected === answerIndex;
          const isCorrect = answerIndex === question.correct;
          const state = reveal ? (isCorrect ? 'correct' : isSelected ? 'wrong' : 'idle') : isSelected ? 'selected' : 'idle';
          const look = LOOK[state];
          return (
            <Pressable
              key={answerIndex}
              onPress={onSelect ? () => onSelect(answerIndex) : undefined}
              disabled={!onSelect}
              accessibilityRole="radio"
              accessibilityState={{ selected: isSelected, disabled: !onSelect }}
              accessibilityLabel={`${LETTERS[pos]}. ${question.answers[answerIndex]}${reveal && isCorrect ? ', התשובה הנכונה' : ''}`}
              style={({ pressed }) => [styles.answer, { backgroundColor: look.bg, borderColor: look.border, opacity: pressed ? 0.85 : 1 }]}
            >
              <View style={[styles.letter, { backgroundColor: look.badge }]}>
                <Text style={[styles.letterText, { color: look.badgeText }]}>{reveal && state !== 'idle' ? look.mark : LETTERS[pos]}</Text>
              </View>
              <Text style={[styles.answerText, { color: look.text }]}>{question.answers[answerIndex]}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const LOOK = {
  idle: { bg: colors.card, border: colors.line, badge: colors.bg, badgeText: colors.muted, text: colors.text, mark: '' },
  selected: { bg: colors.primarySoft, border: colors.primary, badge: colors.primary, badgeText: '#fff', text: colors.text, mark: '' },
  correct: { bg: colors.successSoft, border: colors.success, badge: colors.success, badgeText: '#fff', text: colors.text, mark: '✓' },
  wrong: { bg: colors.dangerSoft, border: colors.danger, badge: colors.danger, badgeText: '#fff', text: colors.text, mark: '✕' },
};

const styles = StyleSheet.create({
  wrap: { gap: 14 },
  meta: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' },
  number: { ...type.small, fontWeight: '700', color: colors.primary },
  topic: { ...type.small, backgroundColor: colors.card, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3, overflow: 'hidden' },
  text: { ...type.body, fontSize: 19, lineHeight: 28, fontWeight: '700' },
  imageBox: { backgroundColor: '#fff', borderRadius: radius.md, padding: 8, borderWidth: 1, borderColor: colors.line, alignSelf: 'stretch' },
  answers: { gap: 10 },
  answer: { flexDirection: 'row-reverse', alignItems: 'center', gap: 12, padding: 14, borderRadius: radius.md, borderWidth: 1.5 },
  letter: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  letterText: { fontWeight: '800', fontSize: 15 },
  answerText: { ...type.body, flex: 1 },
});
