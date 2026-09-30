import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useDress } from '../data/store';
import type { Booking } from '../data/types';
import { money, shortDate } from '../lib/format';
import { colors, fonts, spacing, type } from '../theme';
import { DressThumb } from './DressThumb';
import { Badge } from './ui';

export function BookingRow({ booking, hint }: { booking: Booking; hint?: string }) {
  const dress = useDress(booking.dressId);
  const due = booking.price - booking.paid;
  const cancelled = booking.status === 'cancelled';
  return (
    <Pressable onPress={() => router.push({ pathname: '/booking/[id]', params: { id: booking.id } })} style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}>
      <DressThumb dress={dress ?? { color: colors.surfaceAlt }} size={44} />
      <View style={styles.main}>
        <Text style={[type.heading, cancelled && styles.cancelled]} numberOfLines={1}>{booking.customerName}</Text>
        <Text style={type.caption} numberOfLines={1}>{dress?.name ?? 'Deleted dress'}</Text>
        <Text style={styles.date}>
          {shortDate(booking.eventDate)}
          {hint ? `  ·  ${hint}` : ''}
        </Text>
      </View>
      <View style={styles.side}>
        {cancelled ? <Badge label="Cancelled" tone="danger" /> : null}
        <Text style={styles.price}>{money(booking.price)}</Text>
        {!cancelled && due > 0 ? <Text style={styles.due}>{money(due)} due</Text> : null}
        {!cancelled && due <= 0 ? <Text style={styles.paid}>Paid</Text> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm },
  main: { flex: 1, gap: 2 },
  date: { fontFamily: fonts.medium, fontSize: 12, color: colors.primary, marginTop: 2 },
  side: { alignItems: 'flex-end', gap: 4 },
  price: { fontFamily: fonts.semibold, fontSize: 14, color: colors.text },
  due: { fontFamily: fonts.medium, fontSize: 11, color: colors.danger },
  paid: { fontFamily: fonts.medium, fontSize: 11, color: colors.success },
  cancelled: { textDecorationLine: 'line-through', color: colors.textMuted },
});
