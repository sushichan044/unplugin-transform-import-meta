/**
 * This entry file is for Rolldown plugin.
 *
 * @module
 */

import { unpluginResolveImportMeta } from "./index";

/**
 * Rolldown plugin
 *
 * @example
 * ```ts
 * // rolldown.config.js
 * import Starter from 'unplugin-resolve-import-meta/rolldown'
 *
 * export default {
 *   plugins: [Starter()],
 * }
 * ```
 */
const rolldown = unpluginResolveImportMeta.rolldown as typeof unpluginResolveImportMeta.rolldown;
export default rolldown;
export { rolldown as "module.exports" };
