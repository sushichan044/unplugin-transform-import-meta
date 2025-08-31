/**
 * This entry file is for Farm plugin.
 *
 * @module
 */

import { unpluginTransformImportMeta } from "./index";

/**
 * Farm plugin
 *
 * @example
 * ```ts
 * // farm.config.js
 * import Starter from 'unplugin-transform-import-meta/farm'
 *
 * export default {
 *   plugins: [Starter()],
 * }
 * ```
 */
const farm =
  unpluginTransformImportMeta.farm as typeof unpluginTransformImportMeta.farm;
export default farm;
export { farm as "module.exports" };
