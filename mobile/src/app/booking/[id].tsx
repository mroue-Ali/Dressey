import { router, useLocalSearchParams } from 'expo-router';
import { Linking, StyleSheet, Text, View } from 'react-native';

import { DressThumb } from '../../components/DressThumb';
import { FormError, FormScreen, useSave } from '../../components/form';
import { Badge, Card, EmptyState, PrimaryButton } from '../../components/ui';
import { useDress, useStore } from '../../data/store';
import { BLOCK_AFTER, BLOCK_BEFORE } from '../../lib/availability';
import { confirm } from '../../lib/confirm';
import { longDate, money, shiftISO, shortDate } from '../../lib/format';
import { colors, fonts, spacing, type } from '../../theme';

export default function BookingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { bookings, updateBooking, deleteBooking } = useStore();
  const booking = bookings.find((b) => b.id === id);
  const dress = useDress(booking?.dressId);
  const { saving, error, run } = useSave();

  if (!booking) return <EmptyState text="Booking not found" />;

  const due = booking.price - booking.paid;
  const cancelled = booking.status === 'cancelled';

  return (
    <FormScreen>
      <Card style={styles.head}>
        <DressThumb dress={dress ?? { color: colors.surfaceAlt }} size={72} />
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={type.title}>{booking.customerName}</Text>
          <Text style={type.caption}>{dress?.name}</Text>
          {cancelled ? <Badge label="Cancelled" tone="danger" /> : null}
        </View>
      </Card>

      <Card style={styles.block}>
        <Row label="Event day" value={longDate(booking.eventDate)} strong />
        <Row label="Pickup" value={shortDate(shiftISO(booking.eventDate, -BLOCK_BEFORE))} />
        <Row label="Return" value={shortDate(shiftISO(booking.eventDate, 1))} />
        <Row label="Cleaning" value={shortDate(shiftISO(booking.eventDate, BLOCK_AFTER))} />
        <Row label="Next rental possible" value={shortDate(shiftISO(booking.eventDate, BLOCK_AFTER + 1))} />
        {booking.customerPhone ? (
          <Row label="Phone" value={booking.customerPhone} onPress={() => Linking.openURL(`tel:${booking.customerPhone}`)} />
        ) : null}
        {booking.note ? <Row label="Note" value={booking.note} /> : null}
      </Card>

      <Card style={styles.block}>
        <Row label="Price" value={money(booking.price)} />
        <Row label="Paid" value={money(booking.paid)} />
        <Row label="Remaining" value={money(Math.max(due, 0))} strong color={due > 0 ? colors.danger : colors.success} />
      </Card>

      <FormError message={error} />
      <View style={{ gap: spacing.sm }}>
        <PrimaryButton
          label="Edit booking"
          icon="create-outline"
          variant="soft"
          onPress={() => router.push({ pathname: '/booking/new', params: { id: booking.id } })}
        />
        {!cancelled ? (
          <>
            {due > 0 ? (
              <PrimaryButton
                label={`Mark fully paid (+${money(due)})`}
                icon="cash-outline"
                onPress={() => !saving && run(() => updateBooking(booking.id, { paid: booking.price }))}
              />
            ) : null}
            <PrimaryButton
              label="Cancel booking"
              icon="close-circle-outline"
              variant="soft"
              onPress={() =>
                confirm('Cancel this booking? The dress becomes free again. Money already paid stays recorded.', () =>
                  run(async () => {
                    await updateBooking(booking.id, { status: 'cancelled' });
                    router.back();
                  }),
                )
              }
            />
          </>
        ) : null}
        <PrimaryButton
          label="Delete booking"
          icon="trash-outline"
          variant="danger"
          onPress={() =>
            confirm(
              'Delete this booking completely? Its payments are removed from your cash flow too. To keep the money record, cancel it instead.',
              () =>
                run(async () => {
                  await deleteBooking(booking.id);
                  router.back();
                }),
              'Delete',
            )
          }
        />
      </View>
    </FormScreen>
  );
}

function Row({ label, value, strong, color, onPress }: { label: string; value: string; strong?: boolean; color?: string; onPress?: () => void }) {
  return (
    <View style={styles.row}>
      <Text style={type.caption}>{label}</Text>
      <Text onPress={onPress} style={[styles.value, strong && styles.strong, color ? { color } : null, onPress && { color: colors.primary }]}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  block: { gap: spacing.md },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.lg },
  value: { fontFamily: fonts.medium, fontSize: 14, color: colors.text, flexShrink: 1, textAlign: 'right' },
  strong: { fontFamily: fonts.semibold, fontSize: 15 },
});
