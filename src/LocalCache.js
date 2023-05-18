import { LocalResource } from './LocalResource.js'

export class LocalCache {
  /**
   * @param {string} baseURL
   * @param {ResourceContentType} contentType
   * @param {LocalCacheOptions} [opts]
   */
  constructor(
    baseURL,
    contentType = 'json',
    { rootDirectory = '__cache', resourceExtension } = {}
  ) {
    const localResourceOptions = { rootDirectory, resourceExtension }
    this.localResource = new LocalResource(baseURL, localResourceOptions)

    /**
     * @private
     */
    this.contentType = contentType

    /**
     * @private
     */
    this.encode = this.encoder

    /**
     * @private
     */
    this.decode = this.decoder
  }

  /**
   *
   * PRIVATE GETTERS
   *
   */

  /**
   * @private
   * @readonly
   */
  get encoder() {
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
   * @readonly
   */
  get decoder() {
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
   * @public
   * @param {string} href
   */
  get(href) {
    return this.localResource
      .read(href)
      .then(this.decode)
      .catch(LocalCache.logGetError(href))
  }

  /**
   * @public
   * @param {string} href
   * @param {string} data
   */
  set(href, data) {
    const encoded = this.encode(data)
    return this.localResource
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
