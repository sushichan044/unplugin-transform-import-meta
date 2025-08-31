# unplugin-transform-import-meta

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![Unit Test][unit-test-src]][unit-test-href]

Starter template for [unplugin](https://github.com/unjs/unplugin).

<!-- Remove Start -->

## Template Usage

To use this template, clone it down using:

```bash
npx degit sushichan044/unplugin-transform-import-meta unplugin-my-plugin
```

And do a global replacement of `unplugin-transform-import-meta` with your plugin name.

Then you can start developing your unplugin 🔥

To run unit tests, run: `pnpm run test`.
To release a new version, run: `pnpm run release`.

<!-- Remove End -->

## Installation

```bash
npm i -D unplugin-transform-import-meta
```

<details>
<summary>Vite</summary><br>

```ts
// vite.config.ts
import Starter from 'unplugin-transform-import-meta/vite'

export default defineConfig({
  plugins: [Starter()],
})
```

<br></details>

<details>
<summary>Rollup</summary><br>

```ts
// rollup.config.js
import Starter from 'unplugin-transform-import-meta/rollup'

export default {
  plugins: [Starter()],
}
```

<br></details>

<details>
<summary>Rolldown</summary><br>

```ts
// rolldown.config.js
import Starter from 'unplugin-transform-import-meta/rolldown'

export default {
  plugins: [Starter()],
}
```

<br></details>

<details>
<summary>esbuild</summary><br>

```ts
import { build } from 'esbuild'
import Starter from 'unplugin-transform-import-meta/esbuild'

build({
  plugins: [Starter()],
})
```

<br></details>

<details>
<summary>Webpack</summary><br>

```js
// webpack.config.js
import Starter from 'unplugin-transform-import-meta/webpack'

export default {
  /* ... */
  plugins: [Starter()],
}
```

<br></details>

<details>
<summary>Rspack</summary><br>

```ts
// rspack.config.js
import Starter from 'unplugin-transform-import-meta/rspack'

export default {
  /* ... */
  plugins: [Starter()],
}
```

<br></details>

## Sponsors

<p align="center">
  <a href="https://cdn.jsdelivr.net/gh/sushichan044/sponsors/sponsors.svg">
    <img src='https://cdn.jsdelivr.net/gh/sushichan044/sponsors/sponsors.svg'/>
  </a>
</p>

## License

[MIT](./LICENSE) License © 2025-PRESENT [Kevin Deng](https://github.com/sushichan044)

<!-- Badges -->

[npm-version-src]: https://img.shields.io/npm/v/unplugin-transform-import-meta.svg
[npm-version-href]: https://npmjs.com/package/unplugin-transform-import-meta
[npm-downloads-src]: https://img.shields.io/npm/dm/unplugin-transform-import-meta
[npm-downloads-href]: https://www.npmcharts.com/compare/unplugin-transform-import-meta?interval=30
[unit-test-src]: https://github.com/sushichan044/unplugin-transform-import-meta/actions/workflows/unit-test.yml/badge.svg
[unit-test-href]: https://github.com/sushichan044/unplugin-transform-import-meta/actions/workflows/unit-test.yml
