import { Alert, Platform } from 'react-native';

/** Asks before a destructive action; calls onYes only if confirmed. */
export function confirm(message: string, onYes: () => void, yesLabel = 'Yes') {
  if (Platform.OS === 'web') {
    if (window.confirm(message)) onYes();
    return;
  }
  Alert.alert('Are you sure?', message, [
    { text: 'No', style: 'cancel' },
    { text: yesLabel, style: 'destructive', onPress: onYes },
  ]);
}
