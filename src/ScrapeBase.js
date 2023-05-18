import pThrottle from 'p-throttle'
import { LocalCache } from './LocalCache.js'
import { removeSlashes } from './utils/remove-slash.js'

/**
 * @typedef {import('./types.js').ThrottleOptions} ThrottleOptions
 *
 * @typedef {import('./Scrape.types.js').ScrapeOptions} ScrapeOptions
 * @typedef {import('./LocalCache.types.js').LocalCacheOptions} LocalCacheOptions
 *
 * @typedef {import('./Scrape.types.js').AddHandlerParameters} AddHandlerParameters
 * @typedef {import('./Scrape.types.js').ScrapeHandleRequestFunction} ScrapeHandleRequestFunction
 * @typedef {import('./Scrape.types.js').ScrapeHandleResponseFunction} ScrapeHandleResponseFunction
 * @typedef {import('./Scrape.types.js').ScrapeHandleFailedRequestFunction} ScrapeHandleFailedRequestFunction
 */

export const handleFailedRequest = Symbol('handleFailedRequest')

export class ScrapeBase {
  /**
   * @param {string} baseURL
   * @param {ScrapeOptions} [opts]
   */
  constructor(
    baseURL,
    {
      contentType = 'json',
      returnRawFetchResponse = false,
      cache = {},
      throttle = {},
    } = {}
  ) {
    /**
     * @public
     */
    this.baseURL = removeSlashes(baseURL)

    /**
     * @public
     */
    this.contentType = contentType

    /**
     * @public
     */
    this.returnRawFetchResponse = returnRawFetchResponse

    /**
     * @public
     */
    this.responseBodyType = this.responseBodyTypes[contentType]

    /**
     * @private
     * @type {ThrottleOptions}
     */
    this.throttleOptions = {
      limit: throttle.limit || 1,
      interval: throttle.interval || 1000,
    }

    if (cache.disable === true) {
      /**
       * @public
       */
      this.cache = null
    } else {
      /**
       * @type {LocalCacheOptions}
       */
      const cacheOptions = {
        rootDirectory: cache.rootDirectory,
        name: cache.name,
        fileExtension: cache.fileExtension,
      }

      /**
       * @public
       */
      this.cache = new LocalCache(baseURL, contentType, cacheOptions)
    }

    /**
     * @private
     * @type {ScrapeHandleRequestFunction}
     */
    this.handleRequest = undefined

    /**
     * @private
     * @type {ScrapeHandleResponseFunction}
     */
    this.handleResponse = undefined

    /**
     * @private
     * @type {ScrapeHandleFailedRequestFunction}
     */
    this[handleFailedRequest] = undefined

    /**
     * @public
     */
    this.fetch = this.createFetch()

    this.install()
  }

  /**
   *
   * PUBLIC GETTERS
   *
   */

  /**
   * @public
   */
  get throttleLimit() {
    return this.throttleOptions.limit
  }

  /**
   * @public
   */
  get throttleInterval() {
    return this.throttleOptions.interval
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
  get responseBodyTypes() {
    return /** @type {const} */ ({
      html: 'text',
      json: 'json',
    })
  }

  /**
   *
   * PUBLIC SETTERS
   *
   */

  /**
   * @public
   * @param {number} limit
   */
  set throttleLimit(limit) {
    this.throttleOptions = { ...this.throttleOptions, limit }
    this.Fetch = this.createFetch()
  }

  /**
   * @public
   * @param {number} interval
   */
  set throttleInterval(interval) {
    this.throttleOptions = { ...this.throttleOptions, interval }
    this.Fetch = this.createFetch()
  }

  /**
   *
   * PRIVATE METHODS
   *
   */

  /**
   * @private
   */
  install() {
    /**
     * @param {string} href
     */
    this.preFlight = async href => {
      if (this.handleRequest) {
        const url = new URL(href)
        const handledUrl = await this.handleRequest(url)
        return handledUrl.toString()
      }
      return href
    }

    /**
     * @param {boolean} skipCache
     * @returns {(response: Response) => Promise<Response>}
     */
    this.postFlight = skipCache => async response => {
      if (this.returnRawFetchResponse === false) {
        if (response.ok === false) {
          throw new Error(
            `Fetch to ${response.url} failed: ${response.status} (${response.statusText})`
          )
        }
      }

      if (this.cache !== null && skipCache === false) {
        const { url: href } = response
        const data = await response.clone()[this.responseBodyType]()
        await this.cache.set(href, data)
      }

      let handledResponse = response

      if (this.handleResponse) {
        /**
         * handledResponse is assigned either the result of the
         * end-user's handleResponse function or else defaults to the
         * original response received from the fetch; this safe-guard is
         * in place in case the end-user forgets to return the response
         * at the end of their handler
         */
        handledResponse =
          (await this.handleResponse(response)) ?? handledResponse
      }

      if (
        handledResponse instanceof Response &&
        this.returnRawFetchResponse === false
      ) {
        handledResponse = await handledResponse[this.responseBodyType]()
      }

      return handledResponse
    }
  }

  /**
   * @private
   */
  createFetch() {
    const throttle = pThrottle(this.throttleOptions)

    /**
     * @param {string} href
     * @param {RequestInit} init
     */
    return (href, init) => throttle(() => fetch(href, init))()
  }

  /**
   *
   * PUBLIC METHODS
   *
   */

  /**
   * @public
   * @param {AddHandlerParameters} handler
   */
  addIntercept({ request, response, failedRequest }) {
    if (
      request === undefined &&
      response === undefined &&
      failedRequest === undefined
    ) {
      throw new Error(
        `Scrape error: one intercept argument of either 'request', 'response', or 'failedRequest' must be provided`
      )
    }

    if (request !== undefined) {
      this.handleRequest = request
    }

    if (response !== undefined) {
      this.handleResponse = response
    }

    if (failedRequest !== undefined) {
      this[handleFailedRequest] = failedRequest
    }
  }
}
