import { Alert, Platform } from 'react-native';

/**
 * Yes/no confirmation that also works on web. React Native Web's Alert.alert is a
 * no-op, so buttons guarded by it (like Sign out) silently did nothing in the browser.
 */
export function confirmAction(
  title: string,
  message: string,
  confirmLabel: string,
  onConfirm: () => void | Promise<void>,
  destructive = true
) {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.confirm(`${title}\n\n${message}`)) void onConfirm();
    return;
  }
  Alert.alert(title, message, [
    { text: 'Cancel', style: 'cancel' },
    { text: confirmLabel, style: destructive ? 'destructive' : 'default', onPress: () => void onConfirm() },
  ]);
}
