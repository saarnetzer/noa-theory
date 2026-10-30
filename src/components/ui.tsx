// Shared building blocks. Rows use 'row-reverse' because the app lays out right-to-left itself.

import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, rtl, type } from '@/theme';

export function Screen({ title, back = true, side, children, scroll = true, footer }: {
  title?: string;
  back?: boolean;
  side?: ReactNode; // shown at the left edge of the header
  children: ReactNode;
  scroll?: boolean;
  footer?: ReactNode; // pinned to the bottom (e.g. "next" buttons)
}) {
  const insets = useSafeAreaInsets();
  const body = scroll
    ? <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">{children}</ScrollView>
    : <View style={[styles.content, { flex: 1 }]}>{children}</View>;
  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {(title || back) && (
        <View style={styles.header}>
          {back ? (
            <Pressable
              onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
              style={styles.back}
              accessibilityRole="button"
              accessibilityLabel="חזרה"
              hitSlop={10}
            >
              <Text style={styles.backText}>→</Text>
            </Pressable>
          ) : <View style={styles.back} />}
          <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
          <View style={styles.side}>{side}</View>
        </View>
      )}
      {body}
      {footer && <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>{footer}</View>}
    </View>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Button({ label, onPress, kind = 'primary', disabled, style, sub }: {
  label: string;
  onPress: () => void;
  kind?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  sub?: string;
}) {
  const palette = {
    primary: { bg: colors.primary, fg: '#fff' },
    secondary: { bg: colors.primarySoft, fg: colors.primary },
    danger: { bg: colors.dangerSoft, fg: colors.danger },
  }[kind];
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: palette.bg, opacity: disabled ? 0.45 : pressed ? 0.85 : 1 },
        style,
      ]}
    >
      <Text style={[styles.buttonText, { color: palette.fg }]}>{label}</Text>
      {sub && <Text style={[styles.buttonSub, { color: palette.fg }]}>{sub}</Text>}
    </Pressable>
  );
}

export function Bar({ value, color = colors.primary }: { value: number; color?: string }) {
  return (
    <View style={styles.bar}>
      {/* Fills from the right, matching the reading direction. */}
      <View style={[styles.barFill, { width: `${Math.round(Math.min(Math.max(value, 0), 1) * 100)}%`, backgroundColor: color }]} />
    </View>
  );
}

export function Confirm({ visible, title, message, confirmLabel, onConfirm, onCancel, danger }: {
  visible: boolean;
  title: string;
  message?: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  danger?: boolean;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <Card style={styles.dialog}>
          <Text style={type.heading}>{title}</Text>
          {message && <Text style={[type.body, { color: colors.muted }]}>{message}</Text>}
          <View style={styles.dialogRow}>
            <Button label={confirmLabel} onPress={onConfirm} kind={danger ? 'danger' : 'primary'} style={{ flex: 1 }} />
            <Button label="ביטול" onPress={onCancel} kind="secondary" style={{ flex: 1 }} />
          </View>
        </Card>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row-reverse', alignItems: 'center', paddingHorizontal: 12, height: 52, gap: 8 },
  back: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  backText: { fontSize: 24, color: colors.primary },
  headerTitle: { ...type.heading, flex: 1 },
  side: { minWidth: 40, alignItems: 'flex-start' },
  content: { padding: 16, gap: 14 },
  footer: { paddingHorizontal: 16, paddingTop: 10, backgroundColor: colors.bg, borderTopWidth: 1, borderTopColor: colors.line },
  card: { backgroundColor: colors.card, borderRadius: radius.lg, padding: 16, gap: 10, borderWidth: 1, borderColor: colors.line },
  button: { borderRadius: radius.md, paddingVertical: 14, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center' },
  buttonText: { fontSize: 17, fontWeight: '700', writingDirection: 'rtl' },
  buttonSub: { fontSize: 13, opacity: 0.85, marginTop: 2, writingDirection: 'rtl' },
  bar: { height: 8, borderRadius: 4, backgroundColor: colors.line, overflow: 'hidden', flexDirection: 'row-reverse' },
  barFill: { height: '100%', borderRadius: 4 },
  backdrop: { flex: 1, backgroundColor: 'rgba(10,20,40,0.45)', justifyContent: 'center', padding: 24 },
  dialog: { gap: 14 },
  dialogRow: { flexDirection: 'row-reverse', gap: 10 },
});

export { rtl };
