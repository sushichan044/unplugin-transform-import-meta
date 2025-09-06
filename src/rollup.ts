/**
 * This entry file is for Rollup plugin.
 *
 * @module
 */

import { TransformImportMeta } from "./index";

/**
 * Rollup plugin
 *
 * @example
 * ```ts
 * // rollup.config.js
 * import TransformImportMeta from 'unplugin-transform-import-meta/rollup'
 *
 * export default {
 *   plugins: [TransformImportMeta()],
 * }
 * ```
 */
const rollup = TransformImportMeta.rollup as typeof TransformImportMeta.rollup;
export default rollup;
export { rollup as "module.exports" };
