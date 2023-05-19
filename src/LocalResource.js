import { accessSync } from 'fs'
import { readFile, writeFile, mkdir } from 'fs/promises'
import { last, pipe } from 'remeda'
import { timeSinceFile } from '@hbauer/time-since-file'
import { plural } from '@hbauer/convenience-functions'
import { removeSlashes } from './utils/remove-slash.js'
import { reconcileHref } from './utils/reconcile-href.js'

/**
 * @typedef {import('./LocalResource.types.js').LocalResourceOptions} LocalResourceOptions
 *
 * @typedef {import('./Scrape.types.js').ExpiresAfterTime} ExpiresAfterTime
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
   * PRIVATE STATIC METHODS
   *
   */

  /**
   * Get the time (per unit) since a file was last updated
   *
   * @private
   * @param {string} path
   */
  static async sinceUpdated(path) {
    const since = await timeSinceFile(path)
    return since.updated
  }

  /**
   * Determine whether a file is expired or not based on provided expiry params
   *
   * @private
   * @param {string} path
   * @param {ExpiresAfterTime} expiresAfter
   */
  static async isExpired(path, expiresAfter) {
    if (expiresAfter === null) {
      return false
    }

    /**
     * If expiresAfter is [3, 'hours'] then expiresAfterTime is 3 and expiresAfterUnit is 'hours'
     */
    let [expiresAfterTime, expiresAfterUnit] = expiresAfter

    /**
     * When file was last updated (by unit of time)
     */
    const sinceUpdated = await LocalResource.sinceUpdated(path)

    /**
     * If expiresAfterUnit is hours and sinceUpdated.hours is 4 then sinceUpdatedTime is 4
     */
    const sinceUpdatedTime = sinceUpdated[plural(expiresAfterUnit)]

    return sinceUpdatedTime > expiresAfterTime
  }

  /**
   *
   * PUBLIC STATIC METHODS
   *
   */

  /**
   * Returns true or false depending on if `path` exsists on the local filesystem
   *
   * @public
   * @param {string} path
   */
  static pathExists(path) {
    try {
      accessSync(path)
      return true
    } catch {
      return false
    }
  }

  /**
   *
   * PRIVATE METHODS
   *
   */

  /**
   * Derives paths for the provided `href` without touching the local filesystem
   *
   * @private
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
   *
   * PUBLIC METHODS
   *
   */

  /**
   * Returns the full path if and only if the path exists on the local filesystem.
   *
   * If the path doesn't exist, null is returned.
   *
   * @public
   * @param {string} href
   */
  getPath(href) {
    href = reconcileHref(this.baseURL, href)

    if (href === null) {
      throw new Error(
        `Scrape error: provided value for \`href\` (${href}) cannot be reconciled with the \`baseURL\` (${this.baseURL})`
      )
    }

    const { path } = this.derivePaths(href)
    const exists = LocalResource.pathExists(path)

    if (exists === true) {
      return path
    }

    return null
  }

  /**
   * Returns paths if and only if the path exists on the local filesystem.
   *
   * If the path doesn't exist, null is returned.
   *
   * @public
   * @param {string} href
   */
  getPaths(href) {
    href = reconcileHref(this.baseURL, href)

    if (href === null) {
      throw new Error(
        `Scrape error: provided value for \`href\` (${href}) cannot be reconciled with the \`baseURL\` (${this.baseURL})`
      )
    }

    const paths = this.derivePaths(href)
    const exists = LocalResource.pathExists(paths.path)

    if (exists === true) {
      return paths
    }

    return null
  }

  /**
   * @param {string} href
   */
  async getMeta(href) {
    const { directory, filename, path } = this.getPaths(href)

    if (path === null) {
      return null
    }

    const sinceUpdated = await LocalResource.sinceUpdated(path)
    const updatedAt = new Date(Date.now() - sinceUpdated.milliseconds)

    return { directory, filename, path, sinceUpdated, updatedAt }
  }

  /**
   * Write a file to the local filesystem. The provided value for data
   * must be of type string.
   *
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
   * Read a file from the local filesystem. If the file is expired,
   * return null. If the file doesn't yet exist, return null.
   *
   * @public
   * @param {string} href
   * @param {ExpiresAfterTime} [expiresAfter]
   */
  async read(href, expiresAfter = null) {
    const { path } = this.derivePaths(href)
    try {
      let data = undefined

      const isExpired = await LocalResource.isExpired(path, expiresAfter)

      if (isExpired === true) {
        console.log(`Invalidated cache for ${href} (expired)`)
        return null
      }

      data = await readFile(path, 'utf-8')
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
