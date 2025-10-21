export function isNonEmptyString(val: unknown): val is string {
  return typeof val === "string" && val.trim().length > 0;
}

export function isStringifiedNumber(val: string): boolean {
  return !Number.isNaN(Number(val));
}
