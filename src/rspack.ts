/**
 * This entry file is for Rspack plugin.
 *
 * @module
 */

import { unpluginResolveImportMeta } from "./index";

/**
 * Rspack plugin
 *
 * @example
 * ```js
 * // rspack.config.js
 * import Starter from 'unplugin-resolve-import-meta/rspack'
 *
 * default export {
 *  plugins: [Starter()],
 * }
 * ```
 */
const rspack = unpluginResolveImportMeta.rspack as typeof unpluginResolveImportMeta.rspack;
export default rspack;
export { rspack as "module.exports" };
