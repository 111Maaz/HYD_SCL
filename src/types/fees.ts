export const FEE_CHARGE_TYPES = ["REGULAR", "ONE_TIME", "ADJUSTMENT", "CONCESSION"] as const;
export type FeeChargeType = (typeof FEE_CHARGE_TYPES)[number];

export const PAYMENT_METHODS = ["CASH", "UPI", "BANK_TRANSFER", "CHEQUE", "OTHER"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export type FeeStructure = {
  id: string;
  academic_year_id: string;
  class_year_id: string | null;
  fee_name: string;
  amount: number;
  due_date: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
};

export type FeeStructureInput = {
  academic_year_id: string;
  class_year_id?: string | null;
  fee_name: string;
  amount: number;
  due_date?: string | null;
  active?: boolean;
};

export type FeeCharge = {
  id: string;
  student_id: string;
  academic_year_id: string;
  fee_structure_id: string | null;
  charge_type: FeeChargeType;
  description: string;
  amount: number;
  concession_amount: number;
  due_date: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type FeeChargeInput = {
  student_id: string;
  academic_year_id: string;
  fee_structure_id?: string | null;
  charge_type?: FeeChargeType;
  description: string;
  amount: number;
  concession_amount?: number;
  due_date?: string | null;
};

export type FeePayment = {
  id: string;
  student_id: string;
  academic_year_id: string;
  amount: number;
  payment_date: string;
  payment_method: PaymentMethod;
  reference_number: string | null;
  receipt_number: string | null;
  notes: string | null;
  recorded_by: string | null;
  cancelled: boolean;
  cancelled_at: string | null;
  cancelled_by: string | null;
  cancellation_reason: string | null;
  created_at: string;
  updated_at: string;
};

export type FeePaymentInput = {
  student_id: string;
  academic_year_id: string;
  amount: number;
  payment_date?: string;
  payment_method: PaymentMethod;
  reference_number?: string | null;
  receipt_number?: string | null;
  notes?: string | null;
};

export type StudentLedger = {
  student_id: string;
  student_number: string;
  student_name: string;
  total_charges: number;
  total_payments: number;
  balance: number;
};

export const FEE_CHARGE_TYPE_LABELS: Record<FeeChargeType, string> = {
  REGULAR: "Regular",
  ONE_TIME: "One-time",
  ADJUSTMENT: "Adjustment",
  CONCESSION: "Concession",
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  CASH: "Cash",
  UPI: "UPI",
  BANK_TRANSFER: "Bank transfer",
  CHEQUE: "Cheque",
  OTHER: "Other",
};

export function netChargeAmount(charge: Pick<FeeCharge, "amount" | "concession_amount">): number {
  return Number(charge.amount) - Number(charge.concession_amount);
}
