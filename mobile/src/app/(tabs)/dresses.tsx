import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { DressThumb } from '../../components/DressThumb';
import { Badge, Card, Chip, EmptyState, PrimaryButton, Screen, type Tone } from '../../components/ui';
import { dressOrigins, labelOf } from '../../data/labels';
import { useStore } from '../../data/store';
import type { DressOrigin } from '../../data/types';
import { dayState, reasonLabel } from '../../lib/availability';
import { money, todayISO } from '../../lib/format';
import { colors, fonts, spacing, type } from '../../theme';

const filters: ({ value: 'all'; label: string } | { value: DressOrigin; label: string })[] = [
  { value: 'all', label: 'All' },
  ...dressOrigins,
];

export default function DressesScreen() {
  const { dresses, bookings } = useStore();
  const [filter, setFilter] = useState<'all' | DressOrigin>('all');
  const today = todayISO();
  const shown = filter === 'all' ? dresses : dresses.filter((d) => d.origin === filter);

  return (
    <Screen title="Dresses" subtitle={`${dresses.length} in your collection`}>
      <PrimaryButton label="Add dress" icon="add" onPress={() => router.push('/dress/new')} />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
        {filters.map((f) => (
          <Chip key={f.value} label={f.label} active={filter === f.value} onPress={() => setFilter(f.value)} />
        ))}
      </ScrollView>

      {!shown.length ? <EmptyState text="No dresses here yet" /> : null}

      <View style={styles.grid}>
        {shown.map((d) => {
          const state = dayState(bookings, d.id, today);
          const status: { label: string; tone: Tone } =
            state.kind === 'busy' ? { label: reasonLabel[state.reason], tone: state.reason === 'event' ? 'danger' : 'warning' } : { label: 'In shop', tone: 'success' };
          return (
            <Pressable key={d.id} style={styles.cell} onPress={() => router.push({ pathname: '/dress/[id]', params: { id: d.id } })}>
              <Card style={styles.item}>
                <DressThumb dress={d} style={styles.photo} />
                <Text style={type.heading} numberOfLines={1}>{d.name}</Text>
                <View style={styles.metaRow}>
                  <Text style={type.caption}>{labelOf(dressOrigins, d.origin)}{d.size ? ` · ${d.size}` : ''}</Text>
                  {d.rentalPrice ? <Text style={styles.price}>{money(d.rentalPrice)}</Text> : null}
                </View>
                <Badge label={status.label} tone={status.tone} />
              </Card>
            </Pressable>
          );
        })}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  filters: { gap: spacing.sm },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  cell: { width: '47.5%', flexGrow: 1 },
  item: { padding: spacing.md, gap: spacing.xs },
  photo: { height: 150, marginBottom: spacing.xs },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  price: { fontFamily: fonts.semibold, fontSize: 14, color: colors.primary },
});
