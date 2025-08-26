/**
 * This entry file is for Vite plugin.
 *
 * @module
 */

import { Starter } from "./index";

/**
 * Vite plugin
 *
 * @example
 * ```ts
 * // vite.config.ts
 * import Starter from 'unplugin-resolve-import-meta/vite'
 *
 * export default defineConfig({
 *   plugins: [Starter()],
 * })
 * ```
 */
const vite = Starter.vite as typeof Starter.vite;
export default vite;
export { vite as "module.exports" };
