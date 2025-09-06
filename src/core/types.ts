/**
 * @package
 */
export type LiteralValue = bigint | boolean | number | string | RegExp | null;

/**
 * @package
 */
export type MethodFunction = (...args: LiteralValue[]) => LiteralValue;

/**
 * @package
 */
export interface TextReplacement {
  end: number;
  replacement: string;
  start: number;
}

/**
 * @package
 */
export interface ResolveRules {
  methods: Record<string, MethodFunction>;
  properties: Record<string, LiteralValue>;
}
