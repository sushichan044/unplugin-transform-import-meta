/**
 * This entry file is for Farm plugin.
 *
 * @module
 */

import { unpluginResolveImportMeta } from "./index";

/**
 * Farm plugin
 *
 * @example
 * ```ts
 * // farm.config.js
 * import Starter from 'unplugin-resolve-import-meta/farm'
 *
 * export default {
 *   plugins: [Starter()],
 * }
 * ```
 */
const farm = unpluginResolveImportMeta.farm as typeof unpluginResolveImportMeta.farm;
export default farm;
export { farm as "module.exports" };
