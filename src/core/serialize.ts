export type LiteralValue =
  | bigint
  | boolean
  | number
  | string
  | RegExp
  | null
  | undefined;

export function serializeLiteralValue(value: LiteralValue): string {
  if (value == null) {
    return "null";
  }

  if (value instanceof RegExp) {
    return value.toString();
  }

  return JSON.stringify(value);
}
