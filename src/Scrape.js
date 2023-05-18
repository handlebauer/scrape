import { ScrapeBase, handleFailedRequest } from './ScrapeBase.js'

import { scrapeCache } from './ScrapeBase.js'
import { preFlight } from './ScrapeBase.js'
import { postFlight } from './ScrapeBase.js'
import { scrapeFetch } from './ScrapeBase.js'
import { reconcileHref } from './utils/reconcile-href.js'

/**
 * @typedef {import('./Scrape.types.js').ScrapeOptions} ScrapeOptions
 * @typedef {import('./Scrape.types.js').ScrapeRetryOptions} ScrapeRetryOptions
 * @typedef {import('./Scrape.types.js').ScrapeRetryInfo} ScrapeRetryInfo
 * @typedef {import('./Scrape.types.js').ScrapeInFlightRequest} ScrapeInFlightRequest
 * @typedef {import('./Scrape.types.js').ScrapeMethodOptions} ScrapeMethodOptions
 */

export class Scrape extends ScrapeBase {
  /**
   * @param {string} baseURL
   * @param {ScrapeOptions} [options]
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
    return this[scrapeCache].localResource.getPaths(href).file
  }

  /**
   * @public
   * @param {string} href
   * @param {ScrapeMethodOptions} [options]
   * @param {ScrapeRetryInfo} [retry]
   * @returns {Promise<any>}
   */
  async scrape(
    href,
    options = { invalidate: undefined, allowDistinctHref: false },
    retry = { attempts: 0, error: null }
  ) {
    const { invalidate, allowDistinctHref, ...init } = options

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
       * Unable to reconcile href, so reconciledHref is null, but this
       * is allowed because allowDistinctHref is set to true , so use
       * the original value of href
       */
      reconciledHref = href
    }

    /**
     * The rest of the method uses href, re-assign
     */
    href = reconciledHref

    if (retry.attempts > this.retryOptions.attempts) {
      throw retry.error
    }

    href = await this[preFlight](href)

    if (this[scrapeCache]) {
      if (invalidate === undefined) {
        const data = await this[scrapeCache].get(href)
        if (data) return data
      } else {
        console.log(`Invalidated cache for ${href}`)
      }
    }

    if (this.inFlightRequests.has(href) && retry.error === null) {
      return this.inFlightRequests.get(href).request
    }

    const request = this[scrapeFetch](href, init)
      .then(this[postFlight])
      .catch(this.handleFailedRequest(href, options, retry))

    this.inFlightRequests.set(href, { request, retry })
    const response = await request
    this.inFlightRequests.delete(href)

    return response
  }
}
