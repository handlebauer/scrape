import pThrottle from 'p-throttle'
import { LocalCache } from './LocalCache.js'
import { removeSlashes } from './utils/remove-slash.js'

export const scrapeCache = Symbol('cache')
export const preFlight = Symbol('preFlight')
export const postFlight = Symbol('postFlight')
export const handleRequest = Symbol('handleRequest')
export const handleResponse = Symbol('handleResponse')
export const handleFailedRequest = Symbol('handleFailedRequest')
export const scrapeFetch = Symbol('scrapeFetch')

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
      this[scrapeCache] = null
    } else {
      const cacheOptions = {
        rootDirectory: cache.rootDirectory,
        fileExtension: cache.fileExtension,
      }

      /**
       * @public
       */
      this[scrapeCache] = new LocalCache(baseURL, contentType, cacheOptions)
    }

    /**
     * @private
     * @type {ScrapeHandleRequestFunction}
     */
    this[handleRequest] = undefined

    /**
     * @private
     * @type {ScrapeHandleResponseFunction}
     */
    this[handleResponse] = undefined

    /**
     * @private
     * @type {ScrapeHandleFailedRequestFunction}
     */
    this[handleFailedRequest] = undefined

    /**
     * @public
     */
    this[scrapeFetch] = this.createFetch()

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
    this[scrapeFetch] = this.createFetch()
  }

  /**
   * @public
   * @param {number} interval
   */
  set throttleInterval(interval) {
    this.throttleOptions = { ...this.throttleOptions, interval }
    this[scrapeFetch] = this.createFetch()
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
    this[preFlight] = async href => {
      if (this[handleRequest]) {
        const url = new URL(href)
        const handledUrl = await this[handleRequest](url)
        return handledUrl.toString()
      }
      return href
    }

    /**
     * @param {Response} response
     */
    this[postFlight] = async response => {
      if (response.ok === false) {
        throw new Error(
          `Fetch to ${response.url} failed: ${response.status} (${response.statusText})`
        )
      }

      if (this[scrapeCache]) {
        const { url: href } = response
        const data = await response.clone()[this.responseBodyType]()
        await this[scrapeCache].set(href, data)
      }

      let handledResponse = response

      if (this[handleResponse]) {
        handledResponse = await this[handleResponse](response)
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
      this[handleRequest] = request
    }

    if (response !== undefined) {
      this[handleResponse] = response
    }

    if (failedRequest !== undefined) {
      this[handleFailedRequest] = failedRequest
    }
  }
}
