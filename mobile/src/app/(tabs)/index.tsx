import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { BookingRow } from '../../components/BookingRow';
import { Card, EmptyState, PrimaryButton, Screen, SectionHeader, StatCard } from '../../components/ui';
import { totals, useStore } from '../../data/store';
import { emailToUsername } from '../../lib/supabase';
import { canBook } from '../../lib/availability';
import { isSameMonth, money, shiftISO, todayISO } from '../../lib/format';
import { colors, fonts, spacing } from '../../theme';

export default function HomeScreen() {
  const data = useStore();
  const { dresses, bookings, funding, signOut, session } = data;
  const now = new Date();
  const today = todayISO();
  const active = bookings.filter((b) => b.status === 'booked');

  const pickups = active.filter((b) => shiftISO(b.eventDate, -1) === today);
  const events = active.filter((b) => b.eventDate === today);
  const returns = active.filter((b) => shiftISO(b.eventDate, 1) === today);
  const upcoming = active
    .filter((b) => b.eventDate > shiftISO(today, 1))
    .sort((a, b) => a.eventDate.localeCompare(b.eventDate))
    .slice(0, 4);

  const cash = totals(data).cash;
  const month = totals(data, (iso) => isSameMonth(iso, now));
  const freeToday = dresses.filter((d) => canBook(bookings, d.id, today)).length;
  const due = active.reduce((s, b) => s + Math.max(b.price - b.paid, 0), 0);

  const dateLabel = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const todayCount = pickups.length + events.length + returns.length;

  return (
    <Screen brand>
      <Card style={styles.hero}>
        <Text style={styles.heroLabel}>Cash in the business</Text>
        <Text style={styles.heroValue}>{money(cash)}</Text>
        <Text style={styles.heroSub}>This month: {money(month.rentals)} from rentals · {money(month.expenses)} expenses</Text>
      </Card>

      <View style={styles.stats}>
        <StatCard label="Free today" value={`${freeToday}/${dresses.length}`} icon="checkmark-circle-outline" tone="success" />
        <StatCard label="Bookings" value={String(active.filter((b) => b.eventDate >= today).length)} icon="calendar-outline" tone="info" />
        <StatCard label="Still owed" value={money(due)} icon="hourglass-outline" tone="warning" />
      </View>

      {!dresses.length ? (
        <Card style={{ gap: spacing.md }}>
          <Text style={styles.startTitle}>Let's get started</Text>
          <Text style={styles.startText}>
            {funding.length ? 'Now add the dresses you have — bought, personal or gifts.' : 'First record the money you started with, then add your dresses.'}
          </Text>
          {!funding.length ? <PrimaryButton label="Add starter funding" icon="wallet-outline" onPress={() => router.push('/funding/new')} /> : null}
          <PrimaryButton label="Add a dress" icon="shirt-outline" variant={funding.length ? 'solid' : 'soft'} onPress={() => router.push('/dress/new')} />
        </Card>
      ) : (
        <PrimaryButton label="Check a date" icon="search" onPress={() => router.push('/schedule')} />
      )}

      <SectionHeader title="Today" note={dateLabel} />
      <Card>
        {todayCount ? (
          <>
            {pickups.map((b) => <BookingRow key={`p${b.id}`} booking={b} hint="Pickup today" />)}
            {events.map((b) => <BookingRow key={`e${b.id}`} booking={b} hint="Event today" />)}
            {returns.map((b) => <BookingRow key={`r${b.id}`} booking={b} hint="Return today" />)}
          </>
        ) : (
          <EmptyState text="Nothing to hand over or collect today" />
        )}
      </Card>

      <SectionHeader title="Coming up" action="Schedule" onAction={() => router.push('/schedule')} />
      <Card>{upcoming.length ? upcoming.map((b) => <BookingRow key={b.id} booking={b} />) : <EmptyState text="Nothing scheduled" />}</Card>

      <Text style={styles.signOut} onPress={signOut}>
        Signed in as {emailToUsername(session?.user.email)} · Sign out
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { backgroundColor: colors.primary, borderColor: colors.primary, gap: spacing.xs },
  heroLabel: { fontFamily: fonts.medium, fontSize: 13, color: colors.textOnPrimary, opacity: 0.9 },
  heroValue: { fontFamily: fonts.displayBold, fontSize: 42, color: colors.textOnPrimary },
  heroSub: { fontFamily: fonts.medium, fontSize: 12, color: colors.textOnPrimary },
  stats: { flexDirection: 'row', gap: spacing.md },
  startTitle: { fontFamily: fonts.display, fontSize: 24, color: colors.text },
  startText: { fontFamily: fonts.body, fontSize: 14, color: colors.textMuted },
  signOut: { fontFamily: fonts.medium, fontSize: 12, color: colors.textMuted, textAlign: 'center', marginTop: spacing.lg },
});
