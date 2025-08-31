/**
 * This entry file is for Rspack plugin.
 *
 * @module
 */

import { unpluginTransformImportMeta } from "./index";

/**
 * Rspack plugin
 *
 * @example
 * ```js
 * // rspack.config.js
 * import Starter from 'unplugin-transform-import-meta/rspack'
 *
 * default export {
 *  plugins: [Starter()],
 * }
 * ```
 */
const rspack =
  unpluginTransformImportMeta.rspack as typeof unpluginTransformImportMeta.rspack;
export default rspack;
export { rspack as "module.exports" };
