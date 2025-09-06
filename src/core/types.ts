export interface CodeReplacement {
  end: number;
  replacement: string;
  start: number;
}

export type LiteralValue = bigint | boolean | number | string | RegExp | null;
