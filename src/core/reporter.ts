import type { AnalysisResult, ParserDiagnostic } from "./analyze";
import type { TransformerContext } from "./context";

type LogInput = string | Error | { message: string; meta?: unknown };

export interface Reporter {
  error(input: LogInput): void;
  /**
   * Report analysis errors and parser diagnostics.
   * Returns whether parser reported a fatal error.
   */
  reportAnalysis(result: AnalysisResult): { hasParserError: boolean };
  warn(input: LogInput): void;
}

export function createReporter(ctx: TransformerContext): Reporter {
  const emit = (kind: "error" | "warn", input: LogInput) => {
    const log = kind === "error" ? ctx.logger.error : ctx.logger.warn;

    if (typeof input === "string") {
      // normalize to Rollup-like object with id
      log({ id: ctx.id, message: input });
      return;
    }
    if (input instanceof Error) {
      log({ id: ctx.id, ...input });
      return;
    }

    log({ id: ctx.id, message: input.message, meta: input.meta });
  };

  const reportParser = (diags: ParserDiagnostic[]) => {
    let hasError = false;
    const sortedDiags = [...diags].sort(
      (a, b) => (a.start ?? -1) - (b.start ?? -1),
    );

    for (const d of sortedDiags) {
      if (d.severity === "error") hasError = true;
      emit(d.severity === "error" ? "error" : "warn", {
        message: d.message,
        meta: {
          end: d.end,
          start: d.start,
          ...d.meta,
        },
      });
    }
    return hasError;
  };

  return {
    error(input) {
      emit("error", input);
    },
    reportAnalysis(result) {
      // Analyzer-level errors
      for (const err of result.errors) {
        emit("error", err);
      }

      // Parser diagnostics
      const hasParserError = reportParser(result.parserDiagnostics);
      return { hasParserError };
    },
    warn(input) {
      emit("warn", input);
    },
  };
}
