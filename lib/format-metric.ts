/** Preserve decimal precision from source metric value */
export function formatMetricValue(n: number, target: number): string {
  const parts = String(target).split(".");
  const decimals = parts[1]?.length ?? 0;
  return n.toFixed(decimals);
}
