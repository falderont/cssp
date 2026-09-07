// A tenant can only amend a delivery ticket while it's still an open request
// that hasn't already shown up — once ops has moved it past "Expected", or
// its expected date has passed, the ticket is locked from tenant edits (ops
// can still process it regardless of date).
export function isDeliveryEditable(delivery: { status: string; expectedAt: Date | string | null }): boolean {
  if (delivery.status !== "Expected") return false;
  if (!delivery.expectedAt) return true;
  const expected = typeof delivery.expectedAt === "string" ? new Date(delivery.expectedAt) : delivery.expectedAt;
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  return expected.getTime() >= startOfToday.getTime();
}
