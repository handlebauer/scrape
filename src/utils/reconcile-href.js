import * as validate from '../parameters/common.js'

/**
 * @typedef {import('../Scrape.types.js').ScrapeURLBase} ScrapeURLBase
 * @typedef {import('../common.types.js').ScrapeHref} ScrapeHref
 */

/**
 * Reconciles a baseURL with the provided href
 *
 * @param {ScrapeURLBase} baseURL
 * @param {ScrapeHref} href
 * @example
 * const baseURL = 'https://example.com'
 * const href = 'path/to/resource'
 *
 * const relative = reconcileHref(baseURL, href)
 * const absolute = reconcileHref(baseURL, baseURL + '/' + href)
 *
 * assert.equals(relative, absolute)
 *
 * reconcileHref(baseURL, 'https://different.com/path') //= null
 */
export const reconcileHref = (baseURL, href) => {
  href = validate.href.parse(href)

  if (href.startsWith('http') === true) {
    if (href.startsWith(baseURL) === true) {
      return href
    }
    return null
  }

  return baseURL + '/' + href
}
