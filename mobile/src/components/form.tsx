import { Ionicons } from '@expo/vector-icons';
import { useState, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { longDate, parseISODate } from '../lib/format';
import { colors, fonts, radius, spacing, type } from '../theme';
import { MonthCalendar } from './MonthCalendar';
import { Card } from './ui';

export function FormScreen({ children, footer }: { children: ReactNode; footer?: ReactNode }) {
  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {children}
      </ScrollView>
      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </SafeAreaView>
  );
}

export function Field({ label, hint, error, children }: { label: string; hint?: string; error?: string; children: ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {children}
      {error ? <Text style={styles.error}>{error}</Text> : hint ? <Text style={type.caption}>{hint}</Text> : null}
    </View>
  );
}

export function Input(props: TextInputProps) {
  return <TextInput placeholderTextColor={colors.textMuted} {...props} style={[styles.input, props.style]} />;
}

export function AmountInput({ value, onChangeText, placeholder = '0' }: { value: string; onChangeText: (t: string) => void; placeholder?: string }) {
  return (
    <View style={styles.amountWrap}>
      <Text style={styles.currency}>$</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        keyboardType="decimal-pad"
        style={styles.amountInput}
      />
    </View>
  );
}

export function ChoiceChips<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <View style={styles.chips}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable key={o.value} onPress={() => onChange(o.value)} style={[styles.chip, active && styles.chipActive]}>
            <Text style={[styles.chipText, active && styles.chipTextActive]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Tappable date row that opens an inline month calendar. */
export function DateField({ value, onChange }: { value: string; onChange: (iso: string) => void }) {
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(parseISODate(value));
  return (
    <View style={{ gap: spacing.sm }}>
      <Pressable onPress={() => setOpen((o) => !o)} style={[styles.input, styles.dateRow]}>
        <Ionicons name="calendar-outline" size={18} color={colors.primary} />
        <Text style={[type.body, { flex: 1 }]}>{longDate(value)}</Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textMuted} />
      </Pressable>
      {open ? (
        <Card>
          <MonthCalendar
            month={month}
            onMonthChange={setMonth}
            selected={value}
            onSelect={(iso) => {
              onChange(iso);
              setOpen(false);
            }}
          />
        </Card>
      ) : null}
    </View>
  );
}

/** Runs an async save, tracking progress and a user-facing error message. */
export function useSave() {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();
  const run = async (action: () => Promise<void>) => {
    setSaving(true);
    setError(undefined);
    try {
      await action();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };
  return { saving, error, run };
}

export function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <View style={styles.formError}>
      <Ionicons name="alert-circle-outline" size={18} color={colors.danger} />
      <Text style={[styles.error, { flex: 1 }]}>{message}</Text>
    </View>
  );
}

export function SubmitButton({ label, onPress, disabled }: { label: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [styles.submit, disabled && styles.submitDisabled, pressed && { opacity: 0.85 }]}
    >
      <Text style={styles.submitText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxl },
  footer: { padding: spacing.lg, paddingTop: spacing.sm, backgroundColor: colors.background },
  field: { gap: spacing.sm },
  label: { fontFamily: fonts.semibold, fontSize: 13, color: colors.primaryDark },
  error: { fontFamily: fonts.medium, fontSize: 12, color: colors.danger },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.text,
  },
  amountWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
  },
  currency: { fontFamily: fonts.displayBold, fontSize: 30, color: colors.primary, marginRight: spacing.xs },
  amountInput: { flex: 1, fontFamily: fonts.displayBold, fontSize: 32, color: colors.text, paddingVertical: spacing.md },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontFamily: fonts.medium, fontSize: 14, color: colors.text },
  chipTextActive: { color: colors.textOnPrimary },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  formError: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center', backgroundColor: colors.dangerSoft, padding: spacing.md, borderRadius: radius.md },
  submit: { backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: spacing.lg, alignItems: 'center' },
  submitDisabled: { opacity: 0.45 },
  submitText: { fontFamily: fonts.semibold, fontSize: 16, color: colors.textOnPrimary },
});
