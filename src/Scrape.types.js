import { Scrape } from './Scrape.js'

/**
 * EXTERNAL
 *
 * @typedef {import('p-throttle').Options} PThrottleOptions
 */

/**
 * COMMON
 *
 * @typedef {string} ScrapeURLBase
 * @typedef {'json' | 'html'} ScrapeContentType
 *
 * @typedef {import('./errors/ScrapeError.js').ScrapeParentError} ScrapeParentError
 */

/**
 * CLASS
 *
 * @typedef {{
 * cache: true | false,
 * returnRawResponse: true | false
 * }} ScrapeClassOptions
 */

/**
 * INIT
 */
/**
 * @template X, Y
 * @template {ScrapeInitOptions} T
 * @typedef {true extends T['cache']['enabled'] ? X : Y} WithCache
 */
/**
 * @template X, Y
 * @template {ScrapeInitOptions} T
 * @typedef {'json' extends T['contentType'] ? X : Y} AsJSON
 */
/**
 * @template X, Y
 * @template {ScrapeInitOptions} T
 * @typedef {false extends T['returnRawResponse'] ? X : Y} NotRawResponse
 */
/**
 * @template {boolean} A
 * @template {boolean} B
 * @typedef {{ cache: A, returnRawResponse: B }} GenericClassOptions
 */
/**
 * @template {'json' | 'html'} S
 * @template {boolean} C
 * @template {boolean} R
 * @typedef {Scrape<S, GenericClassOptions<C, R>>} Scraper
 */
/**
 * @typedef {'json'} JSON
 * @typedef {'html'} HTML
 * @typedef {true} Cache
 * @typedef {false} FalseCache
 * @typedef {true} RawResponse
 * @typedef {false} FalseRawResponse
 */
/**
 * @template {ScrapeInitOptions} X
 * @typedef {AsJSON<NotRawResponse<Scraper<JSON, Cache, FalseRawResponse>, Scraper<JSON, Cache, RawResponse>, X>, NotRawResponse<Scraper<HTML, Cache, FalseRawResponse>, Scraper<HTML, Cache, RawResponse>, X>, X>} IfCache
 */
/**
 * @template {ScrapeInitOptions} X
 * @typedef {AsJSON<NotRawResponse<Scraper<JSON, FalseCache, FalseRawResponse>, Scraper<JSON, FalseCache, RawResponse>, X>, NotRawResponse<Scraper<HTML, FalseCache, FalseRawResponse>, Scraper<HTML, FalseCache, RawResponse>, X>, X>} IfNoCache
 */

/**
 * @template {ScrapeInitOptions} T
 * @typedef {WithCache<IfCache<T>,Scrape<'json', {cache: false, returnRawResponse: false}>, T>} InitResponse
 */

/**
 * INIT OPTIONS
 *
 * @typedef {{
 * contentType?: 'json' | 'html'
 * returnRawResponse?: boolean
 * cache?: ScrapeCacheOptions
 * retry?: { number?: number }
 * throttle?: { limit?: number, interval?: number }
 * }} ScrapeInitOptions
 *
 * @typedef {{
 * rootDirectory?: string,
 * name?: string,
 * fileExtension?: string,
 * enabled?: boolean
 * }} ScrapeCacheOptions
 *
 */
