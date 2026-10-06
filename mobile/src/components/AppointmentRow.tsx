import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import type { Appointment } from '../data/types';
import { formatTime } from '../lib/format';
import { colors, fonts, radius, spacing, type } from '../theme';

/** One fitting visit; tapping it opens the edit form. */
export function AppointmentRow({ appointment: a }: { appointment: Appointment }) {
  return (
    <Pressable
      onPress={() => router.push({ pathname: '/appointment/new', params: { id: a.id } })}
      style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}
    >
      <View style={styles.time}>
        <Text style={styles.start}>{formatTime(a.startTime)}</Text>
        {a.endTime ? <Text style={type.caption}>to {formatTime(a.endTime)}</Text> : null}
      </View>
      <View style={styles.main}>
        <Text style={type.heading} numberOfLines={1}>{a.customerName}</Text>
        {a.customerPhone ? <Text style={type.caption} numberOfLines={1}>{a.customerPhone}</Text> : null}
        {a.note ? <Text style={type.caption} numberOfLines={2}>{a.note}</Text> : null}
      </View>
      {a.customerPhone ? (
        <Pressable
          onPress={() => Linking.openURL(`tel:${a.customerPhone}`)}
          hitSlop={8}
          accessibilityLabel={`Call ${a.customerName}`}
          style={styles.call}
        >
          <Ionicons name="call-outline" size={18} color={colors.primaryDark} />
        </Pressable>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm },
  time: { width: 76, gap: 2 },
  start: { fontFamily: fonts.semibold, fontSize: 14, color: colors.primary },
  main: { flex: 1, gap: 2 },
  call: { width: 38, height: 38, borderRadius: radius.pill, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
});
