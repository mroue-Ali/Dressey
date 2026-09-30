import { Ionicons } from '@expo/vector-icons';
import { router, type Href } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Card, Chip, EmptyState, PrimaryButton, Screen, SectionHeader } from '../../components/ui';
import { expenseCategories, fundingSources, labelOf } from '../../data/labels';
import { useStore } from '../../data/store';
import { totals } from '../../data/totals';
import { isSameMonth, money, shortDate } from '../../lib/format';
import { colors, fonts, radius, spacing, type } from '../../theme';

// Each movement opens the record it came from, where it can be edited or deleted.
type Entry = { id: string; kind: 'in' | 'out'; title: string; detail: string; amount: number; date: string; href: Href };

export default function FinanceScreen() {
  const data = useStore();
  const [period, setPeriod] = useState<'month' | 'all'>('month');
  const now = new Date();
  const inPeriod = period === 'month' ? (iso: string) => isSameMonth(iso, now) : () => true;
  const t = totals(data, inPeriod);
  const all = totals(data);

  const dressName = (id: string) => data.dresses.find((d) => d.id === id)?.name ?? 'Dress';
  const entries: Entry[] = [
    ...data.funding.map((f) => ({ id: f.id, kind: 'in' as const, title: labelOf(fundingSources, f.source), detail: f.fromName || f.note || '', amount: f.amount, date: f.date, href: { pathname: '/funding/new' as const, params: { id: f.id } } })),
    ...data.bookings
      .filter((b) => b.paid > 0)
      .map((b) => ({ id: b.id, kind: 'in' as const, title: 'Rental', detail: `${b.customerName} · ${dressName(b.dressId)}`, amount: b.paid, date: b.createdAt, href: { pathname: '/booking/[id]' as const, params: { id: b.id } } })),
    ...data.dresses
      .filter((d) => d.purchasePrice > 0)
      .map((d) => ({ id: d.id, kind: 'out' as const, title: 'Dress bought', detail: [d.name, d.shop].filter(Boolean).join(' · '), amount: d.purchasePrice, date: d.addedAt, href: { pathname: '/dress/[id]' as const, params: { id: d.id } } })),
    ...data.expenses.map((e) => ({ id: e.id, kind: 'out' as const, title: labelOf(expenseCategories, e.category), detail: e.note ?? '', amount: e.amount, date: e.date, href: { pathname: '/expense/new' as const, params: { id: e.id } } })),
  ]
    .filter((e) => inPeriod(e.date))
    .sort((a, b) => b.date.localeCompare(a.date));

  return (
    <Screen title="Cash Flow" subtitle={period === 'month' ? now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'All time'}>
      <Card style={styles.hero}>
        <Text style={styles.heroLabel}>Cash in the business</Text>
        <Text style={styles.heroValue}>{money(all.cash)}</Text>
        <Text style={styles.heroSub}>All funding + rentals − dresses − expenses</Text>
      </Card>

      <View style={styles.actions}>
        <View style={{ flex: 1 }}>
          <PrimaryButton label="Funding" icon="add-circle-outline" variant="soft" onPress={() => router.push('/funding/new')} />
        </View>
        <View style={{ flex: 1 }}>
          <PrimaryButton label="Expense" icon="remove-circle-outline" variant="soft" onPress={() => router.push('/expense/new')} />
        </View>
      </View>

      <View style={styles.periods}>
        <Chip label="This month" active={period === 'month'} onPress={() => setPeriod('month')} />
        <Chip label="All time" active={period === 'all'} onPress={() => setPeriod('all')} />
      </View>

      <Card style={styles.breakdown}>
        <Line label="Funding" value={t.funding} tone="in" />
        <Line label="Rentals" value={t.rentals} tone="in" />
        <Line label="Dresses bought" value={t.dressPurchases} tone="out" />
        <Line label="Expenses" value={t.expenses} tone="out" />
        <View style={styles.divider} />
        <View style={styles.line}>
          <Text style={type.heading}>Rental profit</Text>
          <Text style={[styles.profit, { color: t.profit >= 0 ? colors.success : colors.danger }]}>{money(t.profit)}</Text>
        </View>
        <Text style={type.caption}>Rentals minus expenses, before paying back dresses.</Text>
      </Card>

      <SectionHeader title="Movements" />
      <Card>
        {entries.length ? (
          entries.map((e, i) => {
            const isIn = e.kind === 'in';
            return (
              <Pressable
                key={`${e.kind}${e.id}`}
                onPress={() => router.push(e.href)}
                style={({ pressed }) => [styles.tx, i > 0 && styles.txBorder, pressed && { opacity: 0.6 }]}
              >
                <View style={[styles.txIcon, { backgroundColor: isIn ? colors.successSoft : colors.dangerSoft }]}>
                  <Ionicons name={isIn ? 'arrow-down' : 'arrow-up'} size={16} color={isIn ? colors.success : colors.danger} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={type.heading}>{e.title}</Text>
                  <Text style={type.caption} numberOfLines={1}>{[shortDate(e.date), e.detail].filter(Boolean).join(' · ')}</Text>
                </View>
                <Text style={[styles.txAmount, { color: isIn ? colors.success : colors.danger }]}>
                  {isIn ? '+' : '−'}{money(e.amount)}
                </Text>
                <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
              </Pressable>
            );
          })
        ) : (
          <EmptyState text="Nothing in this period" />
        )}
      </Card>
    </Screen>
  );
}

function Line({ label, value, tone }: { label: string; value: number; tone: 'in' | 'out' }) {
  return (
    <View style={styles.line}>
      <Text style={type.body}>{label}</Text>
      <Text style={[styles.lineValue, { color: tone === 'in' ? colors.success : colors.danger }]}>
        {tone === 'in' ? '+' : '−'}{money(value)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { backgroundColor: colors.primary, borderColor: colors.primary, gap: spacing.xs },
  heroLabel: { fontFamily: fonts.medium, fontSize: 13, color: colors.textOnPrimary, opacity: 0.9 },
  heroValue: { fontFamily: fonts.displayBold, fontSize: 42, color: colors.textOnPrimary },
  heroSub: { fontFamily: fonts.medium, fontSize: 12, color: colors.textOnPrimary },
  actions: { flexDirection: 'row', gap: spacing.md },
  periods: { flexDirection: 'row', gap: spacing.sm },
  breakdown: { gap: spacing.md },
  line: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  lineValue: { fontFamily: fonts.semibold, fontSize: 15 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
  profit: { fontFamily: fonts.displayBold, fontSize: 28 },
  tx: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md },
  txBorder: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  txIcon: { width: 34, height: 34, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  txAmount: { fontFamily: fonts.semibold, fontSize: 15 },
});
