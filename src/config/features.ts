/**
 * Global Feature Flags
 * Acadly v1 is 100% free with no fee collection, Razorpay or GST receipts in UI.
 * Fee code is safely archived in src/features/fees/ for v2 activation.
 */
export const FEATURES = {
  FEES: false,
} as const;

export const FEATURE_FEES = FEATURES.FEES;
