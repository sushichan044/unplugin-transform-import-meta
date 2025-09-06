/**
 * This entry file is for webpack plugin.
 *
 * @module
 */

import { TransformImportMeta } from "./index";

/**
 * Webpack plugin
 *
 * @example
 * ```js
 * // webpack.config.js
 * import TransformImportMeta from 'unplugin-transform-import-meta/webpack'
 *
 * export default {
 *  plugins: [TransformImportMeta()],
 * }
 * ```
 */
const webpack =
  TransformImportMeta.webpack as typeof TransformImportMeta.webpack;
export default webpack;
export { webpack as "module.exports" };
