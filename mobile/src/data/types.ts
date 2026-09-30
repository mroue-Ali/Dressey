// Shapes mirror the Supabase tables in /supabase/schema.sql.
// Dates are ISO calendar days: 'YYYY-MM-DD'.

export type FundingSource = 'starter' | 'investor' | 'gift' | 'help' | 'other';

/** Money put into the business from outside (not earned from rentals). */
export type Funding = {
  id: string;
  source: FundingSource;
  fromName: string;
  amount: number;
  date: string;
  note?: string;
};

export type DressOrigin = 'bought' | 'personal' | 'gift' | 'other';

export type Dress = {
  id: string;
  name: string;
  origin: DressOrigin;
  shop?: string; // only for bought dresses
  purchasePrice: number; // 0 when not bought
  rentalPrice: number; // suggested price per rental
  size?: string;
  photoPath?: string; // object path in Supabase storage
  photoUri?: string; // signed URL for display
  color: string; // placeholder tint when there is no photo
  addedAt: string;
  note?: string;
};

export type ExpenseCategory = 'transport' | 'fuel' | 'delivery' | 'cleaning' | 'repair' | 'other';

export type Expense = {
  id: string;
  category: ExpenseCategory;
  amount: number;
  date: string;
  note?: string;
};

export type BookingStatus = 'booked' | 'cancelled';

export type Booking = {
  id: string;
  dressId: string;
  customerName: string;
  customerPhone?: string;
  eventDate: string; // the day the customer wears the dress
  price: number;
  paid: number; // counts as rental income
  status: BookingStatus;
  createdAt: string;
  note?: string;
};
