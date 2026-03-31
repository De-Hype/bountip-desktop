export const PaymentStatusEnum = {
  VERIFIED: "Verified",
  NULL: null,
  PENDING: "Pending",
  CANCELLED: "Cancelled",
} as const;

export type PaymentStatusEnum =
  (typeof PaymentStatusEnum)[keyof typeof PaymentStatusEnum];
