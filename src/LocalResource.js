import { accessSync } from 'fs'
import { readFile, writeFile, mkdir } from 'fs/promises'
import { last, pipe } from 'remeda'
import { removeSlashes } from './utils/remove-slash.js'

/**
 * @typedef {import('./LocalResource.types.js').LocalResourceOptions} LocalResourceOptions
 */

export class LocalResource {
  /**
   * @param {string} baseURL
   * @param {LocalResourceOptions} options
   */
  constructor(baseURL, { rootDirectory, name, extension } = {}) {
    /**
     * @private
     * @readonly
     * @description `baseURL` is e.g. 'https://httpbin.org'
     */
    this.baseURL = removeSlashes(baseURL)

    /**
     * @private
     * @readonly
     * @description `name` is e.g. 'httpbin'
     */
    this.name = removeSlashes(name)

    /**
     * @private
     * @readonly
     * @description `rootDirectory` is e.g. '__cache'
     */
    this.rootDirectory = removeSlashes(rootDirectory)

    /**
     * @private
     * @readonly
     * @description `extension` is e.g. 'json'
     */
    this.extension = extension
  }

  /**
   *
   * PUBLIC METHODS
   *
   */

  /**
   * Returns true or false depending on if `path` exsists on the local filesystem
   *
   * @param {string} path
   */
  pathExists(path) {
    try {
      accessSync(path)
      return true
    } catch {
      return false
    }
  }

  /**
   * Derives paths for the provided `href` without touching the local filesystem
   *
   * @public
   * @param {string} href
   * @returns {{ directory: string, filename: string, path: string }}
   */
  derivePaths(href) {
    let intermediatePath = removeSlashes(href)

    /**
     * If href is 'https://httpbin.org/path/to/page', then intermediatePath is 'path/to/page'
     */
    intermediatePath = href.startsWith(this.baseURL)
      ? pipe(href.split(this.baseURL), last(), removeSlashes)
      : href

    /**
     * If intermediatePath was 'path/to/page', now it's 'path/to/page.ext'
     */
    if (!!this.extension === true) {
      intermediatePath += '.' + this.extension
    }

    let directory = this.rootDirectory

    /**
     * If directory was '__cache', now it's '__cache/cache-name'
     */
    if (!!this.name === true) {
      directory += '/' + this.name
    }

    /**
     * If intermediatePath is 'path/to/page', then pathParts is ['path', 'to', 'page']
     */
    const pathParts = intermediatePath.split('/')

    /**
     * If pathParts is ['path', 'to', page'], then dirctory is '__cache/path/to'
     */
    if (pathParts.length > 1) {
      directory += '/' + pathParts.slice(0, -1).join('/')
    }

    /**
     * If intermediatePath is 'path/to/page', then filename is 'page'
     */
    const filename = intermediatePath.split('/').at(-1)

    /**
     * If drectory is '__cache/path/to' and filename is 'page', then path is '__cache/path/to/page'
     */
    const path = directory + '/' + filename

    return { directory, filename, path }
  }

  /**
   * Returns paths if and only if the path exists on the local filesystem
   *
   * @public
   * @param {string} href
   */
  getPaths(href) {
    const paths = this.derivePaths(href)
    const exists = this.pathExists(paths.path)

    if (exists === true) {
      return paths
    }

    return { directory: null, filename: null, path: null }
  }

  /**
   * @public
   * @param {string} href
   * @param {string} data
   */
  async write(href, data) {
    const { directory, filename, path } = this.derivePaths(href)

    if (typeof data !== 'string') {
      let message = `LocalResource error: Unable to write ${filename}: value must be of type 'string' but is instead '${typeof data}'`
      throw new TypeError(message)
    }

    try {
      await mkdir(directory, { recursive: true })
      await writeFile(path, data)
      return true
    } catch (error) {
      throw new Error(error)
    }
  }

  /**
   * @public
   * @param {string} href
   */
  async read(href) {
    const { path } = this.derivePaths(href)

    try {
      const data = await readFile(path, 'utf-8')
      return data
    } catch (error) {
      /**
       * 'ENOENT', the resource does not yet exist
       */
      if (error.code === 'ENOENT') {
        return null
      }
      throw new Error(error)
    }
  }
}
