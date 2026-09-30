import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { describeState, dressDayLook, Legend } from '../../components/Availability';
import { DressThumb } from '../../components/DressThumb';
import { AmountInput, Field, FormError, FormScreen, Input, SubmitButton, useSave } from '../../components/form';
import { MonthCalendar } from '../../components/MonthCalendar';
import { Card, EmptyState } from '../../components/ui';
import { useStore } from '../../data/store';
import { dayState, nearestFreeDays } from '../../lib/availability';
import { longDate, parseAmount, parseISODate, shortDate, todayISO } from '../../lib/format';
import { colors, fonts, radius, spacing } from '../../theme';

export default function NewBookingScreen() {
  const params = useLocalSearchParams<{ dressId?: string; date?: string }>();
  const { dresses, bookings, addBooking } = useStore();

  const [dressId, setDressId] = useState(params.dressId ?? dresses[0]?.id);
  const [date, setDate] = useState(params.date ?? todayISO());
  const [month, setMonth] = useState(parseISODate(params.date ?? todayISO()));
  const dress = dresses.find((d) => d.id === dressId);

  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [price, setPrice] = useState(dress?.rentalPrice ? String(dress.rentalPrice) : '');
  const [paid, setPaid] = useState('');
  const [note, setNote] = useState('');
  const { saving, error, run } = useSave();

  if (!dress) return <EmptyState text="Add a dress first" />;

  const today = todayISO();
  const state = dayState(bookings, dress.id, date);
  const available = state.kind === 'free' && date >= today;
  const priceValue = parseAmount(price);
  const paidValue = paid === '' ? 0 : parseAmount(paid);
  const valid = available && customerName.trim() !== '' && priceValue >= 0 && paidValue >= 0 && paidValue <= priceValue;

  const chooseDress = (id: string) => {
    setDressId(id);
    const d = dresses.find((x) => x.id === id);
    if (d?.rentalPrice) setPrice(String(d.rentalPrice));
  };

  const save = () =>
    run(async () => {
      const booking = await addBooking({
        dressId: dress.id,
        eventDate: date,
        customerName: customerName.trim(),
        customerPhone: phone.trim() || undefined,
        price: priceValue,
        paid: paidValue,
        note: note.trim() || undefined,
      });
      router.replace({ pathname: '/booking/[id]', params: { id: booking.id } });
    });

  return (
    <FormScreen footer={<SubmitButton label={saving ? 'Saving…' : 'Confirm booking'} onPress={save} disabled={!valid || saving} />}>
      <Field label="Dress">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
          {dresses.map((d) => {
            const on = d.id === dress.id;
            const freeThatDay = dayState(bookings, d.id, date).kind === 'free';
            return (
              <Pressable key={d.id} onPress={() => chooseDress(d.id)} style={[styles.pick, on && styles.pickActive]}>
                <DressThumb dress={d} size={52} style={freeThatDay ? undefined : { opacity: 0.45 }} />
                <Text style={styles.pickText} numberOfLines={1}>{d.name}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </Field>

      <Field label="Event date">
        <Card>
          <MonthCalendar
            month={month}
            onMonthChange={setMonth}
            selected={date}
            onSelect={setDate}
            dayLook={dressDayLook(bookings, dress)}
            disablePast
          />
          <Legend />
        </Card>
        <View style={[styles.status, { backgroundColor: available ? colors.successSoft : colors.dangerSoft }]}>
          <Text style={[styles.statusText, { color: available ? colors.success : colors.danger }]}>
            {available ? `${dress.name} is free on ${longDate(date)}` : date < today ? 'Pick a future date' : describeState(state)}
          </Text>
          {!available && date >= today ? (
            <View style={styles.suggestRow}>
              {nearestFreeDays(bookings, dress.id, date, today).map((iso) => (
                <Pressable key={iso} style={styles.suggest} onPress={() => setDate(iso)}>
                  <Text style={styles.suggestText}>{shortDate(iso)}</Text>
                </Pressable>
              ))}
            </View>
          ) : null}
        </View>
      </Field>

      <Field label="Customer name">
        <Input value={customerName} onChangeText={setCustomerName} placeholder="Full name" />
      </Field>
      <Field label="Phone">
        <Input value={phone} onChangeText={setPhone} placeholder="+961 …" keyboardType="phone-pad" />
      </Field>
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Field label="Price">
            <AmountInput value={price} onChangeText={setPrice} />
          </Field>
        </View>
        <View style={{ flex: 1 }}>
          <Field label="Paid now" error={paidValue > priceValue ? 'More than the price' : undefined}>
            <AmountInput value={paid} onChangeText={setPaid} />
          </Field>
        </View>
      </View>
      <Field label="Note">
        <Input value={note} onChangeText={setNote} placeholder="Alterations, pickup time…" multiline />
      </Field>
      <FormError message={error} />
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  pick: { width: 80, alignItems: 'center', gap: 6, padding: spacing.sm, borderRadius: radius.md, borderWidth: 1.5, borderColor: 'transparent' },
  pickActive: { borderColor: colors.primary, backgroundColor: colors.surface },
  pickText: { fontFamily: fonts.medium, fontSize: 11, color: colors.textMuted, textAlign: 'center' },
  status: { borderRadius: radius.md, padding: spacing.md, gap: spacing.sm },
  statusText: { fontFamily: fonts.semibold, fontSize: 14 },
  suggestRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  suggest: { backgroundColor: colors.surface, paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: radius.pill },
  suggestText: { fontFamily: fonts.semibold, fontSize: 12, color: colors.success },
  row: { flexDirection: 'row', gap: spacing.md },
});
