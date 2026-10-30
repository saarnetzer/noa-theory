import type { TextStyle } from 'react-native';

export const colors = {
  bg: '#F3F5FA',
  card: '#FFFFFF',
  text: '#13203B',
  muted: '#5D6B85',
  line: '#E1E6F0',
  primary: '#1F4FD8',
  primaryDark: '#163A8A',
  primarySoft: '#E7EEFF',
  success: '#17905A',
  successSoft: '#E3F6EC',
  danger: '#CF3434',
  dangerSoft: '#FDE8E8',
  warn: '#F2B705',
};

export const radius = { sm: 10, md: 14, lg: 20 };

// The app lays out right-to-left itself (native RTL flipping is turned off in app.json),
// so it looks the same on every device regardless of the system language.
export const rtl: TextStyle = { textAlign: 'right', writingDirection: 'rtl' };

export const type = {
  title: { ...rtl, fontSize: 24, fontWeight: '800', color: colors.text } as TextStyle,
  heading: { ...rtl, fontSize: 18, fontWeight: '700', color: colors.text } as TextStyle,
  body: { ...rtl, fontSize: 16, lineHeight: 24, color: colors.text } as TextStyle,
  small: { ...rtl, fontSize: 13, lineHeight: 18, color: colors.muted } as TextStyle,
};
