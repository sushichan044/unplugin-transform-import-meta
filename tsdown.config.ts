import { defineConfig } from "tsdown";

export default defineConfig({
  attw: { profile: "esmOnly" },
  clean: true,
  dts: true,
  entry: ["./src/*.ts"],
  fixedExtension: true,
  format: "esm",
  fromVite: true,
  minify: "dce-only",
  nodeProtocol: true,
  outDir: "dist",
  publint: true,
  sourcemap: false,
  treeshake: true,
  unused: true,
});
