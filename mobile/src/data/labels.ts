import type { DressOrigin, ExpenseCategory, FundingSource } from './types';

export const fundingSources: { value: FundingSource; label: string }[] = [
  { value: 'starter', label: 'Starter capital' },
  { value: 'investor', label: 'Investor' },
  { value: 'gift', label: 'Gift' },
  { value: 'help', label: 'Help' },
  { value: 'other', label: 'Other' },
];

export const dressOrigins: { value: DressOrigin; label: string }[] = [
  { value: 'bought', label: 'Bought' },
  { value: 'personal', label: 'Personal' },
  { value: 'gift', label: 'Gift' },
  { value: 'other', label: 'Other' },
];

export const expenseCategories: { value: ExpenseCategory; label: string }[] = [
  { value: 'transport', label: 'Transport' },
  { value: 'fuel', label: 'Fuel' },
  { value: 'delivery', label: 'Delivery' },
  { value: 'cleaning', label: 'Cleaning' },
  { value: 'repair', label: 'Repair' },
  { value: 'other', label: 'Other' },
];

export function labelOf<T extends string>(list: { value: T; label: string }[], value: T): string {
  return list.find((i) => i.value === value)?.label ?? value;
}
