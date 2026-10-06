import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppointmentRow } from '../../components/AppointmentRow';
import { MonthCalendar } from '../../components/MonthCalendar';
import { Card, EmptyState, PrimaryButton, Screen, SectionHeader } from '../../components/ui';
import { useStore } from '../../data/store';
import type { Appointment } from '../../data/types';
import { longDate, shiftISO, todayISO } from '../../lib/format';
import { colors, fonts, radius, spacing, type } from '../../theme';

type Mode = 'today' | 'tomorrow' | 'upcoming' | 'day';

const MODES: { value: Mode; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'tomorrow', label: 'Tomorrow' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'day', label: 'Pick a day' },
];

export default function AppointmentsScreen() {
  const { appointments } = useStore();
  const [mode, setMode] = useState<Mode>('today');
  const [picked, setPicked] = useState(todayISO());
  const [month, setMonth] = useState(new Date());

  const today = todayISO();
  const on = (iso: string) => appointments.filter((a) => a.date === iso);

  const day = mode === 'today' ? today : mode === 'tomorrow' ? shiftISO(today, 1) : picked;
  const upcoming = appointments.filter((a) => a.date >= today);
  const newDate = mode === 'day' ? picked : mode === 'tomorrow' ? day : today;

  // "Upcoming" groups everything from today onwards by day.
  const groups = new Map<string, Appointment[]>();
  for (const a of upcoming) groups.set(a.date, [...(groups.get(a.date) ?? []), a]);

  return (
    <Screen title="Appointments" subtitle="Customers coming to try dresses on">
      <PrimaryButton
        label="New appointment"
        icon="add"
        onPress={() => router.push({ pathname: '/appointment/new', params: { date: newDate } })}
      />

      <View style={styles.segment}>
        {MODES.map((m) => (
          <Pressable key={m.value} onPress={() => setMode(m.value)} style={[styles.segmentItem, mode === m.value && styles.segmentActive]}>
            <Text style={[styles.segmentText, mode === m.value && styles.segmentTextActive]} numberOfLines={1}>{m.label}</Text>
          </Pressable>
        ))}
      </View>

      {mode === 'day' ? (
        <Card>
          <MonthCalendar
            month={month}
            onMonthChange={setMonth}
            selected={picked}
            onSelect={setPicked}
            dayLook={(iso) => {
              const n = on(iso).length;
              return n ? { dots: n } : undefined;
            }}
          />
        </Card>
      ) : null}

      {mode === 'upcoming' ? (
        groups.size ? (
          [...groups].map(([iso, list]) => (
            <View key={iso} style={{ gap: spacing.sm }}>
              <SectionHeader title={iso === today ? 'Today' : longDate(iso)} note={`${list.length}`} />
              <Card>{list.map((a) => <AppointmentRow key={a.id} appointment={a} />)}</Card>
            </View>
          ))
        ) : (
          <EmptyState text="No upcoming appointments" />
        )
      ) : (
        <>
          <View style={styles.summary}>
            <Text style={type.title}>{longDate(day)}</Text>
            <Text style={type.caption}>
              {on(day).length ? `${on(day).length} appointment${on(day).length > 1 ? 's' : ''}` : day < today ? 'This day has passed' : 'Nothing scheduled'}
            </Text>
          </View>
          {on(day).length ? <Card>{on(day).map((a) => <AppointmentRow key={a.id} appointment={a} />)}</Card> : null}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  segment: { flexDirection: 'row', backgroundColor: colors.surfaceAlt, borderRadius: radius.pill, padding: 4 },
  segmentItem: { flex: 1, paddingVertical: spacing.sm + 2, borderRadius: radius.pill, alignItems: 'center' },
  segmentActive: { backgroundColor: colors.surface },
  segmentText: { fontFamily: fonts.semibold, fontSize: 13, color: colors.textMuted },
  segmentTextActive: { color: colors.primaryDark },
  summary: { gap: 2 },
});
