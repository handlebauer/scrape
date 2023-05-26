import { merge, omit } from 'remeda'
import pThrottle from 'p-throttle'
import { LocalHTTPCache } from '@hbauer/local-cache'
import { LocalFile } from '@hbauer/local-file'
import { ScrapeBase } from './ScrapeBase.js'
import { ScrapeError } from './errors/ScrapeError.js'
import { reconcileHref } from './utils/reconcile-href.js'
import * as validate from './parameters/common.js'

/**
 * @typedef {import('./Scrape.types.js').ScrapeClassOptions} ScrapeClassOptions
 *
 * @typedef {import('./Scrape.types.js').ScrapeURLBase} ScrapeURLBase
 * @typedef {import('./Scrape.types.js').ScrapeContentType} ScrapeContentType
 * @typedef {import('./Scrape.types.js').ScrapeInitOptions} ScrapeInitOptions
 *
 * @typedef {import('./common.types.js').ScrapeInFlightRequestRetry} ScrapeInFlightRequestRetry
 *
 * @typedef {import('./Scrape.types.js').PThrottleOptions} PThrottleOptions
 * @typedef {import('./common.types.js').ScrapeHref} ScrapeHref
 *
 * @typedef {import('./common.types.js').ScrapeMethodOptions} ScrapeMethodOptions
 *
 * @typedef {import('./Scrape.types.js').ScrapeParentError} ScrapeParentError
 *
 * @typedef {import('./common.types.js').JSONData} JSONData
 * @typedef {import('./common.types.js').HTMLData} HTMLData
 */

/**
 * @template {ScrapeContentType} [ContentType='json']
 * @template {ScrapeClassOptions} [ClassOptions={ cache: true, returnRawResponse: false }]
 * @extends {ScrapeBase<ScrapeContentType, ClassOptions>}
 */
export class Scrape extends ScrapeBase {
  /**
   * NOTE: Some of the corresponding types are below the function ⬇️
   *
   * @template {ScrapeInitOptions} InitOptions
   *
   * @overload
   * @param {ScrapeURLBase} baseURL
   * @returns {Promise<Scrape>}
   *
   * @overload
   * @param {ScrapeURLBase} baseURL
   * @param {InitOptions} options
   * @returns {Promise<WithCache<InitOptions, CacheTypes<InitOptions>, NonCacheTypes<InitOptions>>>}
   *
   * @param {ScrapeURLBase} baseURL
   * @param {ScrapeInitOptions} [options]
   */
  static async init(baseURL, options) {
    baseURL = validate.baseURL.parse(baseURL)
    options = validate.options.parse(options)

    if (options.cache.enabled === false) {
      return new Scrape(baseURL, options)
    }

    // prettier-ignore
    const cache = await LocalHTTPCache.create(baseURL, options.contentType, options.cache)

    return new Scrape(baseURL, options, cache)
  }

  /**
   * @param {ScrapeURLBase} baseURL
   * @param {ScrapeInitOptions} options
   * @param {LocalHTTPCache} [cache]
   */
  constructor(baseURL, options, cache) {
    super(baseURL, options, cache)

    /**
     * @private
     */
    this.retry = options.retry

    /**
     * @private
     */
    this.throttle = options.throttle

    /**
     * @private
     */
    this.inFlightRequests = new Map()

    /**
     * @private
     */
    this.fetch = this.createFetch()
  }

  /**
   * @public
   * @param {number} number
   */
  set retryNumber(number) {
    this.retry.number = validate.retryNumber.parse(number)
  }

  /**
   * @public
   * @param {number} limit
   */
  set throttleLimit(limit) {
    this.throttle.limit = validate.throttleLimit.parse(limit)
  }

  /**
   * @public
   * @param {number} interval
   */
  set throttleInterval(interval) {
    this.throttle.interval = validate.throttleInterval.parse(interval)
  }

  /**
   * @private
   */
  createFetch() {
    const throttle = pThrottle(/** @type {PThrottleOptions} */ (this.throttle))

    /**
     * @param {string} href
     * @param {RequestInit} init
     */
    return (href, init) => throttle(() => fetch(href, init))()
  }

  /**
   * @param {ScrapeHref} href
   * @param {ScrapeMethodOptions} options
   * @param {ScrapeInFlightRequestRetry} retry
   */
  catchFailedRequest(href, options, retry) {
    /**
     * @param {ScrapeParentError} parent
     */
    return parent => {
      const error = new ScrapeError('catchFailedRequest', { parent })

      const handleFailedRequest = this.handlers.failedRequest

      if (handleFailedRequest !== null) {
        handleFailedRequest(error, retry)
      }

      return this.scrape(href, options, { attempts: retry.attempts + 1, error })
    }
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
   * @typedef {T['invalidate']['force'] extends true ? A : B} IfInvalidateForce
   */

  /**
   * @template A, B
   * @template {ScrapeMethodOptions} T
   * @typedef {T['skipCache'] extends true ? A : B} IfSkipCache
   */

  /**
   * @template {ScrapeMethodOptions} T
   * @typedef {IfNotRawResponse<IfSkipCache<IfJSONContent<JSONData, HTMLData>, IfCache<LocalFile<any>, Response>, T>, IfInvalidateForce<Response, LocalFile<any> | Response, T>>} ScrapeResponse
   */

  /**
   * @template {ScrapeMethodOptions} O
   *
   * @param {ScrapeHref} href
   * @param {O} [options]
   * @param {ScrapeInFlightRequestRetry} [retry]
   * @returns {Promise<ScrapeResponse<O>>}
   */
  async scrape(href, options, retry) {
    href = validate.href.parse(href)
    options = /** @type {O} */ (options || {}) // TODO: do something better
    let init = omit(options, validate.scrapeOptionsKeys)
    options = /** @type {O} */ (validate.scrapeOptions.parse(options))
    retry = validate.scrapeRetry.parse(retry)
    init = merge(init, options)

    const { invalidate, allowDistinctHref } = options
    const { cache } = this

    if (retry.attempts > this.retry.number) {
      throw retry.error
    }

    let reconciledHref = reconcileHref(this.baseURL, href)

    if (reconciledHref === null) {
      if (allowDistinctHref === false) {
        throw new ScrapeError('reconcileHref inside scrape', {
          message: `provided value for href (${href}) cannot be reconciled with the baseURL (${this.baseURL}) - if this is intentional, consider the allowDistinctHref option`,
        })
      } else {
        reconciledHref = href
      }
    }

    href = await this.preFlight(reconciledHref)

    if (cache !== null) {
      if (invalidate.force === false) {
        const file = await cache.get(href, { expiredAfter: invalidate.after })
        if (file && file.attributes.expired == false) {
          return /** @type {ScrapeResponse<O>} */ (file)
        }
      } else {
        console.log(`Invalidated cache [${href}]`)
      }
    }

    if (this.inFlightRequests.has(href) && retry.error === null) {
      return this.inFlightRequests.get(href).response
    }

    const promise = this.fetch(href, init)
      .then(this.postFlight(options))
      .catch(this.catchFailedRequest(href, options, retry))

    this.inFlightRequests.set(href, { response: promise, retry })
    const response = await promise
    this.inFlightRequests.delete(href)

    return /** @type {ScrapeResponse<O>} */ (response)
  }
}

/**
 * @template {ScrapeInitOptions} T
 * @template X, Y
 * @typedef {true extends T['cache']['enabled'] ? X : Y} WithCache
 */
/**
 * @template {ScrapeInitOptions} T
 * @template X, Y
 * @typedef {'json' extends T['contentType'] ? X : Y} AsJSON
 */
/**
 * @template {ScrapeInitOptions} T
 * @template X, Y
 * @typedef {false extends T['returnRawResponse'] ? X : Y} NotRawResponse
 */
/**
 * @template T
 * @typedef {AsJSON<T, NotRawResponse<T, Scrape<'json', {cache: true, returnRawResponse: false}>, Scrape<'json', {cache: true, returnRawResponse: true}>>, NotRawResponse<T, Scrape<'html', {cache: true, returnRawResponse: false}>, Scrape<'html', {cache: true, returnRawResponse: true}>>>} CacheTypes
 */
/**
 * @template T
 * @typedef {AsJSON<T, NotRawResponse<T, Scrape<'json', {cache: false, returnRawResponse: false}>, Scrape<'json', {cache: false, returnRawResponse: true}>>, NotRawResponse<T, Scrape<'html', {cache: false, returnRawResponse: false}>, Scrape<'html', {cache: false, returnRawResponse: true}>>>} NonCacheTypes
 */
