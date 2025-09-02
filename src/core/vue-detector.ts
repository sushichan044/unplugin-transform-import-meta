export function isVueFile(filename: string): boolean {
  return filename.endsWith(".vue");
}

export function hasScriptSetupBlock(source: string): boolean {
  return /<script\s+setup[^>]*>/.test(source);
}

export function hasImportMetaInVue(source: string): boolean {
  return source.includes("import.meta");
}
