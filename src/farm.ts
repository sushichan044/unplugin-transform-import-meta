/**
 * This entry file is for Farm plugin.
 *
 * @module
 */

import { TransformImportMeta } from "./index";

/**
 * Farm plugin
 *
 * @example
 * ```ts
 * // farm.config.js
 * import TransformImportMeta from 'unplugin-transform-import-meta/farm'
 *
 * export default {
 *   plugins: [TransformImportMeta()],
 * }
 * ```
 */
const farm = TransformImportMeta.farm as typeof TransformImportMeta.farm;
export default farm;
export { farm as "module.exports" };
