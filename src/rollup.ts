/**
 * This entry file is for Rollup plugin.
 *
 * @module
 */

import { unpluginTransformImportMeta } from "./index";

/**
 * Rollup plugin
 *
 * @example
 * ```ts
 * // rollup.config.js
 * import unpluginResolveImportMeta from 'unplugin-transform-import-meta/rollup'
 *
 * export default {
 *   plugins: [unpluginResolveImportMeta()],
 * }
 * ```
 */
const rollup =
  unpluginTransformImportMeta.rollup as typeof unpluginTransformImportMeta.rollup;
export default rollup;
export { rollup as "module.exports" };
