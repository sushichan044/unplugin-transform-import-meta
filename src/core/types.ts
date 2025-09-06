export interface TextReplacement {
  end: number;
  replacement: string;
  start: number;
}

export type LiteralValue = bigint | boolean | number | string | RegExp | null;

export type MethodFunction = (...args: LiteralValue[]) => LiteralValue;

export interface ResolveRules {
  methods: Record<string, MethodFunction>;
  properties: Record<string, LiteralValue>;
}
