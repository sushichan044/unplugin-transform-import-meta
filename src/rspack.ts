/**
 * This entry file is for Rspack plugin.
 *
 * @module
 */

import { TransformImportMeta } from "./index";

/**
 * Rspack plugin
 *
 * @example
 * ```js
 * // rspack.config.js
 * import TransformImportMeta from 'unplugin-transform-import-meta/rspack'
 *
 * export default {
 *  plugins: [TransformImportMeta()],
 * }
 * ```
 */
const rspack = TransformImportMeta.rspack as typeof TransformImportMeta.rspack;
export default rspack;
export { rspack as "module.exports" };
