import { readFile, writeFile, mkdir } from 'fs/promises'
import { pipe } from 'remeda'
import { removeSlashes } from './utils/remove-slash.js'

/**
 * @typedef {import('./LocalResource.types.js').LocalResourceOptions} LocalResourceOptions
 */

export class LocalResource {
  /**
   * @param {string} baseURL
   * @param {LocalResourceOptions} [opts]
   */
  constructor(baseURL, { rootDirectory, resourceExtension } = {}) {
    /**
     * @private
     * @readonly
     * @description `baseURL` is e.g. 'http://api.exapmle.com'
     */
    this.baseURL = removeSlashes(baseURL)

    /**
     * @private
     * @readonly
     * @description `rootDirectory` is e.g. '__cache'
     */
    this.rootDirectory = removeSlashes(rootDirectory)

    /**
     * @private
     * @readonly
     * @description `resourceExtension` is e.g. 'json'
     */
    this.resourceExtension = resourceExtension
  }

  /**
   *
   * PUBLIC METHODS
   *
   */

  /**
   * @public
   * @param {string} href
   * @returns {{directory: string, file: string }} e.g. '__cache/path/to/resource.json`
   */
  getPaths(href) {
    href = removeSlashes(href)

    /**
     * @description
     * `href` is e.g. 'http://exapmle.com/path/to/resource'
     * `path` aims to remove `baseURL` from `href`, e.g. '/path/to/resource'
     */
    let path = href.startsWith(this.baseURL)
      ? pipe(href.split(this.baseURL).at(1), removeSlashes)
      : href

    /**
     * @private
     * @description
     * `path` === 'path/to'
     * `directory` === '__cache/path/to'
     * `resource` === 'resource'
     */
    let file = path.split('/').slice(1, -1).join('/')
    const directory = this.rootDirectory + '/' + file
    const resource = path.split('/').slice(-1).join()

    file = directory + '/' + resource

    if (this.resourceExtension !== undefined) {
      file += `.${this.resourceExtension}`
    }

    return { directory, file }
  }

  /**
   * @public
   * @param {string} href
   * @param {string} data
   */
  async write(href, data) {
    /**
     * NOTE: `getFullPath` has side-effects (assigns values to `resourceDirectory`, and `resource`)
     */
    const { directory, file } = this.getPaths(href)

    if (typeof data !== 'string') {
      let message = `LocalResource error: Unable to write ${file}: value must be of type 'string' but is instead '${typeof data}'`
      throw new TypeError(message)
    }

    try {
      await mkdir(directory, { recursive: true })
      await writeFile(file, data)
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
    const { file } = this.getPaths(href)

    try {
      const data = await readFile(file, 'utf-8')
      return data
    } catch (error) {
      if (error.code === 'ENOENT') {
        /**
         * 'ENOENT', the resource does not yet exist
         */
        return null
      }
      throw new Error(error)
    }
  }
}
