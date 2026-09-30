import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps, ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, fonts, radius, shadow, spacing, type } from '../theme';
import { Wordmark } from './Wordmark';

type IconName = ComponentProps<typeof Ionicons>['name'];

export function Screen({ title, subtitle, brand, children }: { title?: string; subtitle?: string; brand?: boolean; children: ReactNode }) {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {brand ? (
          <View style={styles.brand}>
            <Wordmark width={130} />
          </View>
        ) : null}
        {title ? (
          <View style={styles.header}>
            {subtitle ? <Text style={type.caption}>{subtitle}</Text> : null}
            <Text style={type.hero}>{title}</Text>
          </View>
        ) : null}
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function SectionHeader({ title, note, action, onAction }: { title: string; note?: string; action?: string; onAction?: () => void }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={[type.title, { flex: 1 }]}>{title}</Text>
      {note ? <Text style={type.caption}>{note}</Text> : null}
      {action ? (
        <Pressable onPress={onAction} hitSlop={8}>
          <Text style={styles.sectionAction}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function StatCard({ label, value, icon, tone = 'primary' }: { label: string; value: string; icon: IconName; tone?: Tone }) {
  const t = tones[tone];
  return (
    <Card style={styles.stat}>
      <View style={[styles.statIcon, { backgroundColor: t.bg }]}>
        <Ionicons name={icon} size={18} color={t.fg} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={type.caption}>{label}</Text>
    </Card>
  );
}

export type Tone = 'primary' | 'success' | 'warning' | 'danger' | 'info';

const tones: Record<Tone, { bg: string; fg: string }> = {
  primary: { bg: colors.primarySoft, fg: colors.primaryDark },
  success: { bg: colors.successSoft, fg: colors.success },
  warning: { bg: colors.warningSoft, fg: colors.warning },
  danger: { bg: colors.dangerSoft, fg: colors.danger },
  info: { bg: colors.infoSoft, fg: colors.info },
};

export function Badge({ label, tone = 'primary' }: { label: string; tone?: Tone }) {
  const t = tones[tone];
  return (
    <View style={[styles.badge, { backgroundColor: t.bg }]}>
      <Text style={[styles.badgeText, { color: t.fg }]}>{label}</Text>
    </View>
  );
}

export function Chip({ label, active, onPress }: { label: string; active?: boolean; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, active && styles.chipActive]}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

export function PrimaryButton({ label, icon, onPress, variant = 'solid' }: { label: string; icon?: IconName; onPress?: () => void; variant?: 'solid' | 'soft' | 'danger' }) {
  const fg = variant === 'solid' ? colors.textOnPrimary : variant === 'danger' ? colors.danger : colors.primaryDark;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.button, variant === 'soft' && styles.buttonSoft, variant === 'danger' && styles.buttonDanger, pressed && { opacity: 0.85 }]}
    >
      {icon ? <Ionicons name={icon} size={18} color={fg} /> : null}
      <Text style={[styles.buttonText, { color: fg }]}>{label}</Text>
    </Pressable>
  );
}

export function EmptyState({ text }: { text: string }) {
  return <Text style={[type.caption, styles.empty]}>{text}</Text>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxl * 2, gap: spacing.lg },
  brand: { alignItems: 'center', paddingVertical: spacing.sm, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border, marginBottom: spacing.xs },
  header: { gap: 2, marginTop: spacing.sm },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    ...shadow,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginTop: spacing.sm },
  sectionAction: { fontFamily: fonts.semibold, fontSize: 13, color: colors.primary },
  stat: { flex: 1, gap: spacing.xs, padding: spacing.md },
  statIcon: { width: 32, height: 32, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xs },
  statValue: { fontFamily: fonts.displayBold, fontSize: 25, color: colors.text },
  badge: { paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radius.pill, alignSelf: 'flex-start' },
  badgeText: { fontFamily: fonts.semibold, fontSize: 11, textTransform: 'capitalize' },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
  },
  chipActive: { backgroundColor: colors.primary },
  chipText: { fontFamily: fonts.medium, fontSize: 13, color: colors.textMuted },
  chipTextActive: { color: colors.textOnPrimary },
  button: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.md + 2,
  },
  buttonSoft: { backgroundColor: colors.primarySoft },
  buttonDanger: { backgroundColor: colors.dangerSoft },
  buttonText: { fontFamily: fonts.semibold, fontSize: 15, color: colors.textOnPrimary },
  empty: { textAlign: 'center', paddingVertical: spacing.lg },
});
