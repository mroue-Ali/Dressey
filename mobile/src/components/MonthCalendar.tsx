import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { toISODate, todayISO } from '../lib/format';
import { colors, fonts, radius, spacing } from '../theme';

export type DayLook = {
  background?: string;
  color?: string;
  dots?: number; // small markers under the number
  dotColor?: string;
  crossed?: boolean;
};

type Props = {
  month: Date; // any day inside the shown month
  onMonthChange: (month: Date) => void;
  selected?: string;
  onSelect?: (iso: string) => void;
  dayLook?: (iso: string) => DayLook | undefined;
  disablePast?: boolean;
};

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function monthGrid(month: Date): (string | null)[] {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const lead = (first.getDay() + 6) % 7; // Monday-first
  const cells: (string | null)[] = Array.from({ length: lead }, () => null);
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(toISODate(new Date(month.getFullYear(), month.getMonth(), d)));
  }
  while (cells.length % 7) cells.push(null);
  return cells;
}

export function MonthCalendar({ month, onMonthChange, selected, onSelect, dayLook, disablePast }: Props) {
  const today = todayISO();
  const cells = monthGrid(month);
  const title = month.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const shift = (n: number) => onMonthChange(new Date(month.getFullYear(), month.getMonth() + n, 1));

  return (
    <View>
      <View style={styles.header}>
        <Pressable onPress={() => shift(-1)} hitSlop={12} style={styles.nav}>
          <Ionicons name="chevron-back" size={20} color={colors.primaryDark} />
        </Pressable>
        <Text style={styles.title}>{title}</Text>
        <Pressable onPress={() => shift(1)} hitSlop={12} style={styles.nav}>
          <Ionicons name="chevron-forward" size={20} color={colors.primaryDark} />
        </Pressable>
      </View>

      <View style={styles.row}>
        {WEEKDAYS.map((w) => (
          <Text key={w} style={styles.weekday}>{w}</Text>
        ))}
      </View>

      <View style={styles.grid}>
        {cells.map((iso, i) => {
          if (!iso) return <View key={`e${i}`} style={styles.cell} />;
          const look = dayLook?.(iso) ?? {};
          const isSelected = iso === selected;
          const isPast = iso < today;
          const disabled = disablePast && isPast;
          return (
            <View key={iso} style={styles.cell}>
              <Pressable
                disabled={disabled || !onSelect}
                onPress={() => onSelect?.(iso)}
                style={[
                  styles.day,
                  look.background ? { backgroundColor: look.background } : null,
                  iso === today && styles.today,
                  isSelected && styles.selected,
                ]}
              >
                <Text
                  style={[
                    styles.dayText,
                    look.color ? { color: look.color } : null,
                    (isPast || disabled) && styles.past,
                    look.crossed && styles.crossed,
                    isSelected && styles.selectedText,
                  ]}
                >
                  {Number(iso.slice(8))}
                </Text>
                <View style={styles.dots}>
                  {Array.from({ length: Math.min(look.dots ?? 0, 3) }, (_, k) => (
                    <View
                      key={k}
                      style={[styles.dot, { backgroundColor: isSelected ? colors.textOnPrimary : look.dotColor ?? colors.gold }]}
                    />
                  ))}
                </View>
              </Pressable>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
  nav: { width: 36, height: 36, borderRadius: radius.pill, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: fonts.display, fontSize: 22, color: colors.text },
  row: { flexDirection: 'row' },
  weekday: { flex: 1, textAlign: 'center', fontFamily: fonts.medium, fontSize: 11, color: colors.textMuted, marginBottom: spacing.xs },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: `${100 / 7}%`, aspectRatio: 1, padding: 2 },
  day: { flex: 1, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center', gap: 2 },
  today: { borderWidth: 1.5, borderColor: colors.gold },
  selected: { backgroundColor: colors.primary },
  dayText: { fontFamily: fonts.semibold, fontSize: 14, color: colors.text },
  selectedText: { color: colors.textOnPrimary },
  past: { opacity: 0.4 },
  crossed: { textDecorationLine: 'line-through' },
  dots: { flexDirection: 'row', gap: 2, height: 4 },
  dot: { width: 4, height: 4, borderRadius: 2 },
});
