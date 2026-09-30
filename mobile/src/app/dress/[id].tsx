import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { dressDayLook, Legend } from '../../components/Availability';
import { BookingRow } from '../../components/BookingRow';
import { DressThumb } from '../../components/DressThumb';
import { FormScreen } from '../../components/form';
import { MonthCalendar } from '../../components/MonthCalendar';
import { Badge, Card, EmptyState, PrimaryButton, SectionHeader } from '../../components/ui';
import { dressOrigins, labelOf } from '../../data/labels';
import { useStore } from '../../data/store';
import { money, shortDate, todayISO } from '../../lib/format';
import { colors, fonts, radius, spacing, type } from '../../theme';

export default function DressScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { dresses, bookings } = useStore();
  const [month, setMonth] = useState(new Date());
  const [selected, setSelected] = useState(todayISO());
  const dress = dresses.find((d) => d.id === id);

  if (!dress) return <EmptyState text="Dress not found" />;

  const mine = bookings.filter((b) => b.dressId === dress.id).sort((a, b) => b.eventDate.localeCompare(a.eventDate));
  const rentals = mine.filter((b) => b.status === 'booked');
  const earned = mine.reduce((s, b) => s + b.paid, 0);
  const payback = dress.purchasePrice > 0 ? Math.min(earned / dress.purchasePrice, 1) : null;

  return (
    <FormScreen>
      <Stack.Screen options={{ title: dress.name }} />
      <DressThumb dress={dress} style={dress.photoUri ? styles.photo : styles.noPhoto} />

      <View style={{ gap: spacing.xs }}>
        <Text style={type.hero}>{dress.name}</Text>
        <View style={styles.tags}>
          <Badge label={labelOf(dressOrigins, dress.origin)} />
          {dress.size ? <Badge label={`Size ${dress.size}`} tone="info" /> : null}
        </View>
      </View>

      <Card style={styles.facts}>
        {dress.origin === 'bought' ? (
          <Fact label="Bought" value={`${money(dress.purchasePrice)}${dress.shop ? ` · ${dress.shop}` : ''}`} />
        ) : null}
        <Fact label="Added" value={shortDate(dress.addedAt)} />
        {dress.rentalPrice ? <Fact label="Rental price" value={money(dress.rentalPrice)} /> : null}
        <Fact label="Rentals" value={String(rentals.length)} />
        <Fact label="Earned" value={money(earned)} />
        {dress.note ? <Fact label="Note" value={dress.note} /> : null}
        {payback !== null ? (
          <View style={{ gap: 6 }}>
            <View style={styles.track}>
              <View style={[styles.fill, { width: `${payback * 100}%` }]} />
            </View>
            <Text style={type.caption}>
              {payback >= 1 ? 'Paid for itself' : `${Math.round(payback * 100)}% of its price earned back`}
            </Text>
          </View>
        ) : null}
      </Card>

      <SectionHeader title="Availability" />
      <Card>
        <MonthCalendar month={month} onMonthChange={setMonth} selected={selected} onSelect={setSelected} dayLook={dressDayLook(bookings, dress)} />
        <Legend />
      </Card>
      <PrimaryButton
        label={`Book on ${shortDate(selected)}`}
        icon="add"
        onPress={() => router.push({ pathname: '/booking/new', params: { dressId: dress.id, date: selected } })}
      />

      <SectionHeader title="Rental history" />
      <Card>{mine.length ? mine.map((b) => <BookingRow key={b.id} booking={b} />) : <EmptyState text="Not rented yet" />}</Card>
    </FormScreen>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.fact}>
      <Text style={type.caption}>{label}</Text>
      <Text style={styles.factValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  photo: { width: '100%', aspectRatio: 3 / 4, maxHeight: 420, borderRadius: radius.lg },
  noPhoto: { width: '100%', height: 140, borderRadius: radius.lg },
  tags: { flexDirection: 'row', gap: spacing.sm },
  facts: { gap: spacing.md },
  fact: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.lg },
  factValue: { fontFamily: fonts.medium, fontSize: 14, color: colors.text, flexShrink: 1, textAlign: 'right' },
  track: { height: 6, borderRadius: radius.pill, backgroundColor: colors.surfaceAlt, overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: colors.gold },
});
