import { ScrapeBase } from './ScrapeBase.js'

import { reconcileHref } from './utils/reconcile-href.js'

/**
 * @typedef {import('./Scrape.types.js').ScrapeOptions} ScrapeOptions
 * @typedef {import('./Scrape.types.js').ScrapeRetryOptions} ScrapeRetryOptions
 * @typedef {import('./Scrape.types.js').ScrapeRetryInfo} ScrapeRetryInfo
 * @typedef {import('./Scrape.types.js').ScrapeInFlightRequest} ScrapeInFlightRequest
 * @typedef {import('./Scrape.types.js').RequestInitScrapeMethodOptions} RequestInitScrapeMethodOptions
 */

import { handleFailedRequest } from './ScrapeBase.js'

export class Scrape extends ScrapeBase {
  /**
   * @param {string} baseURL
   * @param {ScrapeOptions} options
   */
  static init(baseURL, options = {}) {
    return new Scrape(baseURL, options)
  }

  /**
   * @param {string} baseURL
   * @param {ScrapeOptions} [options]
   */
  constructor(baseURL, options) {
    super(baseURL, options)

    /**
     * @private
     * @type {ScrapeRetryOptions}
     */
    this.retryOptions = { attempts: options.retry?.attempts || 0 }

    /**
     * @private
     * @type {Map<string, ScrapeInFlightRequest>}
     */
    this.inFlightRequests = new Map()
  }

  /**
   * PUBLIC GETTERS
   */

  /**
   * @public
   */
  get retryAttempts() {
    return this.retryOptions.attempts
  }

  /**
   *
   * PUBLIC SETTERS
   *
   */

  /**
   * @public
   * @param {number} attempts
   */
  set retryAttempts(attempts) {
    this.retryOptions = { ...this.retryOptions, attempts }
  }

  /**
   *
   * PRIVATE METHODS
   *
   */

  /**
   * @private
   * @param {Parameters<Scrape['scrape']>} args
   */
  handleFailedRequest(...args) {
    const [href, options, retry] = args

    /**
     * @param {Error} error
     */
    return error => {
      if (this[handleFailedRequest] !== undefined) {
        this[handleFailedRequest](error, retry)
      }

      return this.scrape(href, options, { attempts: retry.attempts + 1, error })
    }
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
  getLocalPath(href) {
    href = reconcileHref(this.baseURL, href)
    if (href === null) {
      throw new Error(
        `Scrape error: provided value for \`href\` (${href}) cannot be reconciled with the \`baseURL\` (${this.baseURL}) — if this is intentional, use the \`allowDistinctHref\` option`
      )
    }

    return this.cache.localResource.getPaths(href).path
  }

  /**
   * @public
   * @param {string} href
   */
  getLocalFile(href) {
    href = reconcileHref(this.baseURL, href)
    if (href === null) {
      throw new Error(
        `Scrape error: provided value for \`href\` (${href}) cannot be reconciled with the \`baseURL\` (${this.baseURL}) — if this is intentional, use the \`allowDistinctHref\` option`
      )
    }

    return this.cache.get(href)
  }

  /**
   * @public
   * @param {string} path
   * @param {any} data
   */
  addLocalFile(path, data) {
    return this.cache.set(path, data)
  }

  /**
   * @public
   * @param {string} href
   * @param {RequestInitScrapeMethodOptions} [options]
   * @param {ScrapeRetryInfo} [retry]
   * @returns {Promise<any>}
   */
  async scrape(href, options = {}, retry = { attempts: 0, error: null }) {
    let { invalidate, skipCache, allowDistinctHref, ...init } = options

    invalidate = {
      force: invalidate?.force || false,
      ago: invalidate?.ago || null,
    }
    skipCache = skipCache || false
    allowDistinctHref = allowDistinctHref || false

    /**
     * Either an absolute href or else null
     */
    let reconciledHref = reconcileHref(this.baseURL, href)

    if (reconciledHref === null) {
      if (allowDistinctHref === false) {
        throw new Error(
          `Scrape error: provided value for \`href\` (${href}) cannot be reconciled with the \`baseURL\` (${this.baseURL}) — if this is intentional, use the \`allowDistinctHref\` option`
        )
      }
      /**
       * allowDistinctHref is set to true, so use the original value of href
       */
      reconciledHref = href
    }

    /**
     * The rest of the method uses href, re-assign
     */
    href = reconciledHref

    /**
     * If retry attempts have run out, return an error
     */
    if (retry.attempts > this.retryOptions.attempts) {
      throw retry.error
    }

    href = await this.preFlight(href)

    if (this.cache !== null) {
      if (invalidate.force === false) {
        const data = await this.cache.get(href, invalidate.ago)
        if (data) return data
      } else {
        console.log(`Invalidated cache for ${href}`)
      }
    }

    if (this.inFlightRequests.has(href) && retry.error === null) {
      return this.inFlightRequests.get(href).request
    }

    const request = this.fetch(href, init)
      .then(this.postFlight(skipCache))
      .catch(this.handleFailedRequest(href, options, retry))

    this.inFlightRequests.set(href, { request, retry })
    const response = await request
    this.inFlightRequests.delete(href)

    return response
  }
}
