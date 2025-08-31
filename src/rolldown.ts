/**
 * This entry file is for Rolldown plugin.
 *
 * @module
 */

import { unpluginTransformImportMeta } from "./index";

/**
 * Rolldown plugin
 *
 * @example
 * ```ts
 * // rolldown.config.js
 * import Starter from 'unplugin-transform-import-meta/rolldown'
 *
 * export default {
 *   plugins: [Starter()],
 * }
 * ```
 */
const rolldown =
  unpluginTransformImportMeta.rolldown as typeof unpluginTransformImportMeta.rolldown;
export default rolldown;
export { rolldown as "module.exports" };
