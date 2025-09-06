/**
 * This entry file is for Rolldown plugin.
 *
 * @module
 */

import { TransformImportMeta } from "./index";

/**
 * Rolldown plugin
 *
 * @example
 * ```ts
 * // rolldown.config.js
 * import TransformImportMeta from 'unplugin-transform-import-meta/rolldown'
 *
 * export default {
 *   plugins: [TransformImportMeta()],
 * }
 * ```
 */
const rolldown =
  TransformImportMeta.rolldown as typeof TransformImportMeta.rolldown;
export default rolldown;
export { rolldown as "module.exports" };
