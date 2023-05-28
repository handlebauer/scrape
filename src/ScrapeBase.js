import { keys } from 'remeda'
import { LocalHTTPCache } from '@hbauer/local-cache'
import { LocalFile } from '@hbauer/local-file'
import { ScrapeError } from './errors/ScrapeError.js'
import { cloneResponse } from './utils/clone-response.js'

/**
 * @typedef {import('./Scrape.types.js').ScrapeClassOptions} ScrapeClassOptions
 *
 * @typedef {import('./Scrape.types.js').ScrapeURLBase} ScrapeURLBase
 * @typedef {import('./Scrape.types.js').ScrapeContentType} ScrapeContentType
 *
 * @typedef {import('./Scrape.types.js').ScrapeInitOptions} ScrapeInitOptions
 *
 * @typedef {import('./common.types.js').ScrapeHref} ScrapeHref
 * @typedef {import('./common.types.js').ScrapeMethodOptions} ScrapeMethodOptions
 * @typedef {import('./common.types.js').ScrapeResponseData} ScrapeResponseData
 *
 * @typedef {import('./ScrapeBase.types.js').ScrapeRequestHandler} ScrapeRequestHandler
 * @typedef {import('./ScrapeBase.types.js').ScrapeResponseHandler} ScrapeResponseHandler
 * @typedef {import('./ScrapeBase.types.js').ScrapeFailedRequestHandler} ScrapeFailedRequestHandler
 * @typedef {import('./ScrapeBase.types.js').ScrapeHandler} ScrapeHandler
 * @typedef {import('./ScrapeBase.types.js').ScrapeHandlerType} ScrapeHandlerType
 * @typedef {import('./common.types.js').JSONData} JSONData
 * @typedef {import('./common.types.js').HTMLData} HTMLData
 */

/**
 * @template {ScrapeContentType} [ContentType='json']
 * @template {ScrapeClassOptions} [ClassOptions={ cache: true, returnRawResponse: false }]
 */
export class ScrapeBase {
  /**
   * @param {ScrapeURLBase} baseURL
   * @param {ScrapeInitOptions} options
   * @param {LocalHTTPCache} cache
   */
  constructor(baseURL, options, cache) {
    /**
     * @public
     */
    this.baseURL = baseURL

    /**
     * @public
     */
    this.contentType = options.contentType

    /**
     * @public
     */
    this.returnRawResponse = options.returnRawResponse

    /**
     * @public
     */
    this.cache = cache

    /**
     * @public
     */
    this.handlers = {
      /**
       * @type {ScrapeRequestHandler}
       */
      request: null,
      /**
       * @type {ScrapeResponseHandler}
       */
      response: null,
      /**
       * @type {ScrapeFailedRequestHandler}
       */
      failedRequest: null,
    }
  }

  /**
   * @public
   */
  get responseBodyType() {
    // prettier-ignore
    return /** @type {ContentType extends 'html' ? 'text' : 'json'} */ (this.contentType === 'html' ? 'text' : 'json')
  }

  /**
   * @public
   * @param {ScrapeHref} href
   * @returns {Promise<ScrapeHref>}
   */
  async preFlight(href) {
    if (this.handlers.request !== null) {
      const url = new URL(href)
      const handled = await this.handlers.request(url)
      return handled.toString()
    }
    return href
  }

  /**
   * @template A, B
   * @typedef {ContentType extends 'json' ? A : B} IfJSONContent
   */

  /**
   * @template A, B
   * @typedef {ClassOptions['returnRawResponse'] extends false ? A : B} IfNotRawResponse
   */

  /**
   * @template A, B
   * @typedef {ClassOptions['cache'] extends true ? A : B} IfCache
   */

  /**
   * @template A, B
   * @template {ScrapeMethodOptions} T
   * @typedef {T['skipCache'] extends true ? A : B} IfSkipCache
   */

  /**
   * @template {ScrapeMethodOptions} T
   * @typedef {IfNotRawResponse<IfSkipCache<IfJSONContent<JSONData, HTMLData>, IfCache<LocalFile<any>, Response>, T>, Response>} ScrapeResponse
   */

  /**
   * @template {ScrapeMethodOptions} O
   *
   * @public
   * @param {O} options
   */
  postFlight(options) {
    /**
     * @param {Response} response
     * @returns {Promise<ScrapeResponse<O>>}
     */
    return async response => {
      /**
       * cloneResponse returns a proxied Response object which allows
       * the response body to be consumed an arbitrary number of times.
       *
       * This was implemented after encountering unpredictable behaviour
       * pertinent to response.clone() when used in tandem with
       * response.json(), which, depending on the context, would hang
       * the node process.
       */
      response = cloneResponse(response)

      if (this.returnRawResponse === false) {
        if (response.ok === false) {
          /**
           * NOTE: this is caught by Scrape.js's cacheFailedRequest method
           */
          throw new ScrapeError('postFlight', {
            message: `Fetch to ${response.url} failed: ${response.status} (${response.statusText})`,
            status: response.status,
          })
        }
      }

      let handledResponse = undefined

      if (this.handlers.response) {
        /**
         * handledResponse is assigned the result of the end-user's
         * handleResponse function. To be safe, we assume this might be
         * void (when the user employs the handler only to execute
         * side-effects).
         */
        handledResponse = await this.handlers.response(response)
      }

      let data = undefined

      if (this.cache !== null && options.skipCache === false) {
        if (handledResponse instanceof Response) {
          data = await handledResponse[this.responseBodyType]()
        } else {
          data = await response[this.responseBodyType]()
        }

        const file = await this.cache.set(response.url, data)

        if (this.returnRawResponse === false) {
          return /** @type {ScrapeResponse<O>} */ (file)
        }
      }

      if (this.returnRawResponse === true) {
        return /** @type {ScrapeResponse<O>} */ (response)
      }

      if (handledResponse instanceof Response) {
        data = data || (await handledResponse[this.responseBodyType]())
      } else {
        data = data || (await response[this.responseBodyType]())
      }

      return /** @type {ScrapeResponse<O>} */ (data)
    }
  }

  /**
   * @public
   * @template {ScrapeHandlerType} Handler
   * @param {Handler} type
   * @param {Handler extends 'request' ? ScrapeRequestHandler : Handler extends 'response' ? ScrapeResponseHandler : ScrapeFailedRequestHandler} handler
   */
  addHandler(type, handler) {
    const types = keys(this.handlers)

    if (types.includes(type)) {
      if (type === 'request') {
        this.handlers.request = /** @type {ScrapeRequestHandler} */ (handler)
      }
      if (type === 'response') {
        this.handlers.response = /** @type {ScrapeResponseHandler} */ (handler)
      }
      if (type === 'failedRequest') {
        this.handlers.failedRequest =
          /** @type {ScrapeFailedRequestHandler} */ (handler)
      }
    } else {
      throw new ScrapeError('unsupported handler type', {
        message: `handler must be one of either 'request', 'response', or 'failedRequest' (found: ${type})`,
      })
    }
  }
}
