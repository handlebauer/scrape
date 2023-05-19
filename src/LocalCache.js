import { LocalResource } from './LocalResource.js'

/**
 * @typedef {import('./types.js').ResourceContentType} ResourceContentType
 * @typedef {import('./LocalCache.types.js').LocalCacheOptions} LocalCacheOptions
 *
 * @typedef {import('./LocalResource.types.js').LocalResourceOptions} LocalResourceOptions
 *
 * @typedef {import('./Scrape.types.js').ExpiresAfterTime} ExpiresAfterTime
 */

export class LocalCache {
  /**
   * @param {string} baseURL
   * @param {ResourceContentType} contentType
   * @param {LocalCacheOptions} options
   */
  constructor(
    baseURL,
    contentType = 'json',
    { rootDirectory = '__cache', name, fileExtension } = {}
  ) {
    /**
     * @type {LocalResourceOptions}
     */
    const localResourceOptions = {
      rootDirectory,
      name,
      extension: fileExtension,
    }
    this.resource = new LocalResource(baseURL, localResourceOptions)

    /**
     * @private
     */
    this.contentType = contentType

    /**
     * @private
     */
    this.encode = this.getEncoder()

    /**
     * @private
     */
    this.decode = this.getDecoder()
  }

  /**
   *
   * PRIVATE METHODS
   *
   */

  /**
   * @private
   */
  getEncoder() {
    if (this.contentType === 'json') {
      return JSON.stringify
    }

    if (this.contentType === 'html') {
      /**
       * @param {string} html
       */
      return html => html
    }

    throw new Error(
      `LocalCache error: file extensions of type '${this.contentType}' is unsupported`
    )
  }

  /**
   * @private
   */
  getDecoder() {
    if (this.contentType === 'json') {
      return JSON.parse
    }

    if (this.contentType === 'html') {
      /**
       * @param {string} html
       */
      return html => html
    }

    throw new Error(
      `LocalCache error: content of type '${this.contentType}' is unsupported`
    )
  }

  /**
   *
   * PUBLIC METHODS
   *
   */

  /**
   * Get a file from the cache
   *
   * @public
   * @param {string} href
   * @param {ExpiresAfterTime} [expiresAfter]
   */
  get(href, expiresAfter = null) {
    return this.resource
      .read(href, expiresAfter)
      .then(this.decode)
      .catch(LocalCache.logGetError(href))
  }

  /**
   * Set a new value for a provided href
   *
   * @public
   * @param {string} href
   * @param {any} data
   */
  set(href, data) {
    const encoded = this.encode(data)
    return this.resource
      .write(href, encoded)
      .catch(LocalCache.logSetError(href))
  }

  /**
   *
   * PRIVATE CLASS METHODS
   *
   */

  /**
   * @private
   * @param {string} href
   */
  static logGetError(href) {
    /**
     * @param {string} error
     */
    return error => {
      console.error(`LocalCache error: cannot get ${href} from cache`)
      throw new Error(error)
    }
  }

  /**
   * @private
   * @param {string} href
   */
  static logSetError(href) {
    /**
     * @param {string} error
     */
    return error => {
      console.error(`LocalCache error: cannot set ${href} in cache`)
      throw new Error(error)
    }
  }
}
