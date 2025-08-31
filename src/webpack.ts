/**
 * This entry file is for webpack plugin.
 *
 * @module
 */

import { unpluginResolveImportMeta } from "./index";

/**
 * Webpack plugin
 *
 * @example
 * ```js
 * // webpack.config.js
 * import Starter from 'unplugin-resolve-import-meta/webpack'
 *
 * default export {
 *  plugins: [Starter()],
 * }
 * ```
 */
const webpack = unpluginResolveImportMeta.webpack as typeof unpluginResolveImportMeta.webpack;
export default webpack;
export { webpack as "module.exports" };
