import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { describeState, dressDayLook, Legend } from '../../components/Availability';
import { BookingRow } from '../../components/BookingRow';
import { DressThumb } from '../../components/DressThumb';
import { MonthCalendar } from '../../components/MonthCalendar';
import { Card, EmptyState, PrimaryButton, Screen, SectionHeader } from '../../components/ui';
import { useStore } from '../../data/store';
import type { Booking, Dress } from '../../data/types';
import { availabilityOn, dayState, nearestFreeDays } from '../../lib/availability';
import { longDate, money, shiftISO, shortDate, todayISO } from '../../lib/format';
import { colors, fonts, radius, spacing, type } from '../../theme';

type Mode = 'date' | 'dress';

function bookHref(dressId: string, date: string) {
  return { pathname: '/booking/new', params: { dressId, date } } as const;
}

export default function ScheduleScreen() {
  const { dresses, bookings } = useStore();
  const [mode, setMode] = useState<Mode>('date');
  const [selected, setSelected] = useState(todayISO());
  const [month, setMonth] = useState(new Date());
  const [dressId, setDressId] = useState<string | undefined>(dresses[0]?.id);

  const active = bookings.filter((b) => b.status === 'booked');
  const dress = dresses.find((d) => d.id === dressId) ?? dresses[0];

  return (
    <Screen title="Schedule" subtitle="Check a date, answer the customer">
      <View style={styles.segment}>
        {(['date', 'dress'] as const).map((m) => (
          <Pressable key={m} onPress={() => setMode(m)} style={[styles.segmentItem, mode === m && styles.segmentActive]}>
            <Text style={[styles.segmentText, mode === m && styles.segmentTextActive]}>
              {m === 'date' ? 'By date' : 'By dress'}
            </Text>
          </Pressable>
        ))}
      </View>

      {mode === 'dress' && dresses.length ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.picker}>
          {dresses.map((d) => {
            const on = d.id === dress?.id;
            return (
              <Pressable key={d.id} onPress={() => setDressId(d.id)} style={[styles.pick, on && styles.pickActive]}>
                <DressThumb dress={d} size={56} />
                <Text style={[styles.pickText, on && { color: colors.primaryDark }]} numberOfLines={1}>{d.name}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      ) : null}

      <Card>
        <MonthCalendar
          month={month}
          onMonthChange={setMonth}
          selected={selected}
          onSelect={setSelected}
          dayLook={
            mode === 'dress' && dress
              ? dressDayLook(bookings, dress)
              : (iso) => {
                  const n = active.filter((b) => b.eventDate === iso).length;
                  return n ? { dots: n } : undefined;
                }
          }
        />
        {mode === 'dress' ? <Legend /> : null}
      </Card>

      {mode === 'date' ? (
        <ByDate selected={selected} dresses={dresses} bookings={bookings} onPickDate={setSelected} />
      ) : dress ? (
        <ByDress selected={selected} dress={dress} bookings={bookings} />
      ) : (
        <EmptyState text="Add a dress first" />
      )}
    </Screen>
  );
}

function ByDate({ selected, dresses, bookings, onPickDate }: { selected: string; dresses: Dress[]; bookings: Booking[]; onPickDate: (iso: string) => void }) {
  const today = todayISO();
  const list = availabilityOn(dresses, bookings, selected);
  const free = list.filter((a) => a.state.kind === 'free');
  const taken = list.filter((a) => a.state.kind !== 'free');
  const past = selected < today;

  const active = bookings.filter((b) => b.status === 'booked');
  const pickups = active.filter((b) => shiftISO(b.eventDate, -1) === selected);
  const events = active.filter((b) => b.eventDate === selected);
  const returns = active.filter((b) => shiftISO(b.eventDate, 1) === selected);

  return (
    <>
      <View style={styles.summary}>
        <Text style={type.title}>{longDate(selected)}</Text>
        {!past ? (
          <Text style={[styles.summaryText, { color: free.length ? colors.success : colors.danger }]}>
            {free.length} of {dresses.length} dresses available
          </Text>
        ) : (
          <Text style={type.caption}>This day has passed</Text>
        )}
      </View>

      {!past && free.length ? (
        <Card style={styles.list}>
          {free.map(({ dress }) => (
            <View key={dress.id} style={styles.dressRow}>
              <Pressable onPress={() => router.push({ pathname: '/dress/[id]', params: { id: dress.id } })}>
                <DressThumb dress={dress} size={48} />
              </Pressable>
              <View style={{ flex: 1 }}>
                <Text style={type.heading} numberOfLines={1}>{dress.name}</Text>
                <Text style={type.caption}>
                  {[dress.size && `Size ${dress.size}`, dress.rentalPrice ? money(dress.rentalPrice) : null].filter(Boolean).join(' · ')}
                </Text>
              </View>
              <Pressable style={styles.bookBtn} onPress={() => router.push(bookHref(dress.id, selected))}>
                <Text style={styles.bookBtnText}>Book</Text>
              </Pressable>
            </View>
          ))}
        </Card>
      ) : null}

      {!past && taken.length ? (
        <>
          <SectionHeader title="Not available" />
          <Card style={styles.list}>
            {taken.map(({ dress, state }) => {
              const suggestions = nearestFreeDays(bookings, dress.id, selected, today);
              return (
                <View key={dress.id} style={styles.takenRow}>
                  <View style={styles.dressRow}>
                    <DressThumb dress={dress} size={48} style={{ opacity: 0.6 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={[type.heading, { color: colors.textMuted }]} numberOfLines={1}>{dress.name}</Text>
                      <Text style={styles.reason}>{describeState(state)}</Text>
                    </View>
                  </View>
                  {suggestions.length ? (
                    <View style={styles.suggestRow}>
                      <Text style={type.caption}>Free on</Text>
                      {suggestions.map((iso) => (
                        <Pressable key={iso} style={styles.suggest} onPress={() => router.push(bookHref(dress.id, iso))}>
                          <Text style={styles.suggestText}>{shortDate(iso)}</Text>
                        </Pressable>
                      ))}
                    </View>
                  ) : null}
                </View>
              );
            })}
          </Card>
        </>
      ) : null}

      {pickups.length + events.length + returns.length ? (
        <>
          <SectionHeader title="On this day" />
          <Card>
            {pickups.map((b) => <BookingRow key={`p${b.id}`} booking={b} hint="Pickup" />)}
            {events.map((b) => <BookingRow key={`e${b.id}`} booking={b} hint="Event" />)}
            {returns.map((b) => <BookingRow key={`r${b.id}`} booking={b} hint="Return" />)}
          </Card>
        </>
      ) : null}

      {!dresses.length ? <EmptyState text="Add dresses to see availability" /> : null}
      {past ? <PrimaryButton label="Jump to today" icon="today-outline" onPress={() => onPickDate(today)} /> : null}
    </>
  );
}

function ByDress({ selected, dress, bookings }: { selected: string; dress: Dress; bookings: Booking[] }) {
  const today = todayISO();
  const state = dayState(bookings, dress.id, selected);
  const upcoming = bookings
    .filter((b) => b.dressId === dress.id && b.status === 'booked' && b.eventDate >= today)
    .sort((a, b) => a.eventDate.localeCompare(b.eventDate));
  const suggestions = state.kind === 'free' ? [] : nearestFreeDays(bookings, dress.id, selected, today);

  return (
    <>
      <Card style={{ gap: spacing.md }}>
        <Text style={type.caption}>{longDate(selected)}</Text>
        <Text style={[styles.stateText, { color: state.kind === 'free' ? colors.success : colors.danger }]}>
          {selected < today ? 'Past date' : describeState(state)}
        </Text>
        {state.kind === 'free' && selected >= today ? (
          <PrimaryButton label={`Book on ${shortDate(selected)}`} icon="add" onPress={() => router.push(bookHref(dress.id, selected))} />
        ) : null}
        {suggestions.length ? (
          <View style={styles.suggestRow}>
            <Text style={type.caption}>Nearest free days</Text>
            {suggestions.map((iso) => (
              <Pressable key={iso} style={styles.suggest} onPress={() => router.push(bookHref(dress.id, iso))}>
                <Text style={styles.suggestText}>{shortDate(iso)}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}
      </Card>

      <SectionHeader title="Upcoming rentals" action="Dress details" onAction={() => router.push({ pathname: '/dress/[id]', params: { id: dress.id } })} />
      <Card>
        {upcoming.length ? upcoming.map((b) => <BookingRow key={b.id} booking={b} />) : <EmptyState text="No upcoming rentals" />}
      </Card>
    </>
  );
}

const styles = StyleSheet.create({
  segment: { flexDirection: 'row', backgroundColor: colors.surfaceAlt, borderRadius: radius.pill, padding: 4 },
  segmentItem: { flex: 1, paddingVertical: spacing.sm + 2, borderRadius: radius.pill, alignItems: 'center' },
  segmentActive: { backgroundColor: colors.surface },
  segmentText: { fontFamily: fonts.semibold, fontSize: 14, color: colors.textMuted },
  segmentTextActive: { color: colors.primaryDark },
  picker: { gap: spacing.sm },
  pick: { width: 84, alignItems: 'center', gap: 6, padding: spacing.sm, borderRadius: radius.md, borderWidth: 1.5, borderColor: 'transparent' },
  pickActive: { borderColor: colors.primary, backgroundColor: colors.surface },
  pickText: { fontFamily: fonts.medium, fontSize: 11, color: colors.textMuted, textAlign: 'center' },
  summary: { gap: 2 },
  summaryText: { fontFamily: fonts.semibold, fontSize: 14 },
  list: { gap: spacing.md },
  dressRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  takenRow: { gap: spacing.sm },
  reason: { fontFamily: fonts.medium, fontSize: 12, color: colors.danger, marginTop: 2 },
  bookBtn: { backgroundColor: colors.primary, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: radius.pill },
  bookBtnText: { fontFamily: fonts.semibold, fontSize: 13, color: colors.textOnPrimary },
  suggestRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: spacing.sm },
  suggest: { backgroundColor: colors.successSoft, paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: radius.pill },
  suggestText: { fontFamily: fonts.semibold, fontSize: 12, color: colors.success },
  stateText: { fontFamily: fonts.semibold, fontSize: 16 },
});

