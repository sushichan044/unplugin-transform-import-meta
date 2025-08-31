import { parse } from "@typescript-eslint/typescript-estree";

export function parseProgram(code: string) {
  const ast = parse(code, {
    comment: true,
    jsDocParsingMode: "none",
    loc: true,
    project: false,
    range: true,
    sourceType: "module",
    suppressDeprecatedPropertyWarnings: true,
    tokens: false,
  });

  return ast;
}
