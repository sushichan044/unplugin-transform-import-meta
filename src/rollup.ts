/**
 * This entry file is for Rollup plugin.
 *
 * @module
 */

import { unpluginResolveImportMeta } from "./index";

/**
 * Rollup plugin
 *
 * @example
 * ```ts
 * // rollup.config.js
 * import unpluginResolveImportMeta from 'unplugin-resolve-import-meta/rollup'
 *
 * export default {
 *   plugins: [unpluginResolveImportMeta()],
 * }
 * ```
 */
const rollup = unpluginResolveImportMeta.rollup as typeof unpluginResolveImportMeta.rollup;
export default rollup;
export { rollup as "module.exports" };
