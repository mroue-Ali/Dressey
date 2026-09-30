import { StyleSheet, Text, View } from 'react-native';

import type { Booking, Dress } from '../data/types';
import { dayState, reasonLabel, type DayState } from '../lib/availability';
import { shortDate, todayISO } from '../lib/format';
import { colors, fonts, radius, spacing } from '../theme';
import type { DayLook } from './MonthCalendar';

const looks = {
  free: { background: colors.successSoft, color: colors.success },
  event: { background: colors.dangerSoft, color: colors.danger },
  buffer: { background: colors.warningSoft, color: colors.warning },
  tooClose: { background: colors.surfaceAlt, color: colors.textMuted, crossed: true },
} satisfies Record<string, DayLook>;

export function lookForState(state: DayState): DayLook {
  if (state.kind === 'free') return looks.free;
  if (state.kind === 'tooClose') return looks.tooClose;
  return state.reason === 'event' ? looks.event : looks.buffer;
}

/** Calendar colouring for one dress; past days stay plain. */
export function dressDayLook(bookings: Booking[], dress: Dress, ignoreId?: string) {
  const today = todayISO();
  return (iso: string): DayLook | undefined => {
    const state = dayState(bookings, dress.id, iso, ignoreId);
    if (iso < today && state.kind !== 'busy') return undefined;
    return lookForState(state);
  };
}

export function describeState(state: DayState): string {
  if (state.kind === 'free') return 'Available';
  const who = state.booking.customerName;
  const when = shortDate(state.booking.eventDate);
  if (state.kind === 'tooClose') return `Too close to ${who}'s rental on ${when}`;
  if (state.reason === 'event') return `Rented by ${who}`;
  return `${reasonLabel[state.reason]} · ${who}'s rental on ${when}`;
}

export function Legend() {
  const items = [
    { label: 'Free', ...looks.free },
    { label: 'Rented', ...looks.event },
    { label: 'Pickup / return / cleaning', ...looks.buffer },
    { label: 'Too close', ...looks.tooClose },
  ];
  return (
    <View style={styles.legend}>
      {items.map((i) => (
        <View key={i.label} style={styles.item}>
          <View style={[styles.swatch, { backgroundColor: i.background, borderColor: i.color }]} />
          <Text style={styles.text}>{i.label}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginTop: spacing.md },
  item: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  swatch: { width: 14, height: 14, borderRadius: radius.sm / 2, borderWidth: 1 },
  text: { fontFamily: fonts.medium, fontSize: 11, color: colors.textMuted },
});
