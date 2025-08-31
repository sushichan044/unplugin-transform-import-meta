/**
 * This entry file is for webpack plugin.
 *
 * @module
 */

import { unpluginTransformImportMeta } from "./index";

/**
 * Webpack plugin
 *
 * @example
 * ```js
 * // webpack.config.js
 * import Starter from 'unplugin-transform-import-meta/webpack'
 *
 * default export {
 *  plugins: [Starter()],
 * }
 * ```
 */
const webpack =
  unpluginTransformImportMeta.webpack as typeof unpluginTransformImportMeta.webpack;
export default webpack;
export { webpack as "module.exports" };
