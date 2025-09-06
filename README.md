# unplugin-transform-import-meta

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]

> [!WARNING]
>
> Extending `import.meta` is not something to do lightly.
>
> Please read the guidance and reserved key registry in WinterTC's import-meta-registry before using this plugin: <https://github.com/WinterTC55/import-meta-registry>.
>
> This plugin targets library/framework authors who have a strong, well‑justified need for build‑time only metadata. In most application-level cases you should not need this plugin.
>
> Prefer official mechanisms from your bundler/platform (e.g. environment variables, define/replace features, virtual modules, configuration files) before introducing custom `import.meta.*` keys.

Transform `import.meta.*` properties and methods at build-time across Vite, Rollup, Webpack, Rspack, esbuild, Rolldown, and Farm.

- Replace `import.meta.SOME_PROP` with literals (string/number/boolean/bigint/RegExp/null)
- Evaluate `import.meta.someMethod(...)` with your function and inline the literal result
- Guard against reserved `import.meta` keys for each bundler and common registries

ESM-only. Requires Node.js >= 20.19.0.

## Install

```bash
npm i -D unplugin-transform-import-meta
# pnpm add -D unplugin-transform-import-meta
# yarn add -D unplugin-transform-import-meta
# bun add -d unplugin-transform-import-meta
```

## Language Support

- [x] JavaScript/TypeScript: `.js`, `.ts`, `.jsx`, `.tsx` (auto-detected)
- [x] Astro: `.astro`
  - If you use Astro, add the optional peer dependency:

    ```bash
    npm i -D @astrojs/compiler
    ```

- [ ] Vue / Svelte: not yet supported. Contributions welcome!
  - See #3 / #4 for details.

## Quick Start

Define how `import.meta` should be resolved via `bindings` (the `ImportMetaBindings` shape).

```ts
import type { ImportMetaBindings } from "unplugin-transform-import-meta"

// shared bindings (TypeScript for clarity)
const bindings: ImportMetaBindings = {
  values: {
    APP_NAME: "my-app",
    APP_ENV: "production",
    FEATURE_FLAG: true,
  },
  functions: {
    version: (v) => `v${v}`,
    asset: (path) => `/static/${path}`,
  },
};
```

<details>
<summary>Vite</summary><br>

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import TransformImportMeta from 'unplugin-transform-import-meta/vite'

export default defineConfig({
  plugins: [
    TransformImportMeta({ bindings }),
  ],
})
```

<br></details>

<details>
<summary>Rollup</summary><br>

```ts
// rollup.config.ts
import TransformImportMeta from 'unplugin-transform-import-meta/rollup'

export default {
  plugins: [TransformImportMeta({ bindings })],
}
```

<br></details>

<details>
<summary>Rolldown</summary><br>

```ts
// rolldown.config.ts
import TransformImportMeta from 'unplugin-transform-import-meta/rolldown'

export default {
  plugins: [TransformImportMeta({ bindings })],
}
```

<br></details>

<details>
<summary>Webpack</summary><br>

```ts
// webpack.config.ts
import TransformImportMeta from 'unplugin-transform-import-meta/webpack'

export default {
  plugins: [TransformImportMeta({ bindings })],
}
```

<br></details>

<details>
<summary>Rspack</summary><br>

```ts
// rspack.config.ts
import TransformImportMeta from 'unplugin-transform-import-meta/rspack'

export default {
  plugins: [TransformImportMeta({ bindings })],
}
```

<br></details>

<details>
<summary>esbuild</summary><br>

```ts
import { build } from 'esbuild'
import TransformImportMeta from 'unplugin-transform-import-meta/esbuild'

await build({
  plugins: [TransformImportMeta({ bindings })],
})
```

<br></details>

<details>
<summary>Farm</summary><br>

```ts
// farm.config.ts
import TransformImportMeta from 'unplugin-transform-import-meta/farm'

export default {
  plugins: [TransformImportMeta({ bindings })],
}
```

<br></details>

## What It Does (Before ➜ After)

Given this source code:

```ts
// input.ts
console.log(import.meta.APP_NAME)
console.log(import.meta.APP_ENV)
console.log(import.meta.version('1.2.3'))
console.log(import.meta.asset('logo.svg'))
```

It becomes:

```ts
console.log("my-app")
console.log("production")
console.log("v1.2.3")
console.log("/static/logo.svg")
```

In `.astro` files, the plugin transforms in all contexts:

- Frontmatter `--- ... ---`
- `<script>` blocks
- Template expressions like `{import.meta.APP_NAME}`

## Options

```ts
import type { Options } from 'unplugin-transform-import-meta'

const plugin = TransformImportMeta({
  enforce: 'pre',
  include: [/\.[cm]?[jt]sx?$/, /\.astro$/],
  exclude: [/node_modules/],
  bindings: {
    values: {
      // key can be nested via dot-path
      APP_NAME: 'my-app',
      APP_ENV: 'production',
    },
    functions: {
      // args must be literals; non-literals are passed as null
      version: (v) => `v${v}`,
    },
  },
} satisfies Options)
```

- `enforce`: `'pre' | 'post'` (default: `'pre'`)
  - Changing `enforce` casually can break the plugin's behavior due to
    transform ordering across plugins and the bundler.
  - Only change it if you
    know exactly what you're doing and need to coordinate ordering with other
    transforms. The default `'pre'` is recommended for most setups.
- `include` / `exclude`: Any `unplugin-utils` FilterPattern. Defaults process JS/TS and `.astro`, excluding `node_modules`.
- `bindings.values`: Map `import.meta.<dot.path>` to a literal value.
- `bindings.functions`: Map `import.meta.<method>` to a function returning a literal.

Notes:

- Only literal values are inlined. Method arguments that are not literals are passed as `null` to your function.
- Source maps are not generated by this plugin (returns `map: null`).

## Reserved Keys Safety

This plugin validates and throws early if your rules override reserved `import.meta.*` keys.

- WinterTC registry: please refer to <https://github.com/WinterTC55/import-meta-registry> for the canonical list. If new keys are added and our list lags behind, open a PR to update it here.
- For bundler-specific reservations, we intentionally avoid duplicating lists in this README to prevent drift. See the implementation at `src/core/reserved.ts` for the authoritative, up‑to‑date checks.

When a conflict is detected, you will get an error like:

```
The property name "import.meta.<name>" is reserved and cannot be used.
```

Rename your property/method to a non-reserved name.

## Runtime & Build Matrix

- Supported bundlers: Vite, Rollup, Rolldown, Webpack, Rspack, esbuild, Farm
- Languages: JS/TS/JSX/TSX and Astro
- ESM-only package; use modern toolchains

## License

[MIT](./LICENSE) License © 2025-PRESENT [Kevin Deng](https://github.com/sushichan044)

<!-- Badges -->

[npm-version-src]: https://img.shields.io/npm/v/unplugin-transform-import-meta.svg
[npm-version-href]: https://npmjs.com/package/unplugin-transform-import-meta
[npm-downloads-src]: https://img.shields.io/npm/dm/unplugin-transform-import-meta
[npm-downloads-href]: https://www.npmcharts.com/compare/unplugin-transform-import-meta?interval=30
