/**
 * EXTERNAL
 *
 * @typedef {import('p-retry').FailedAttemptError} FailedAttemptError
 * @typedef {import('p-throttle').Options} ThrottleOptions
 *
 */

/**
 * COMMON
 *
 * @typedef {'json' | 'html'} ResourceContentType
 *
 */

/**
 * Scrape
 *
 * @typedef {(url: URL) => URL} ScrapeHandleRequestFunction
 * @typedef {(response: Response) => any} ScrapeHandleResponseFunction
 * @typedef {(error: Error, retry: ScrapeRetryInfo) => void} ScrapeHandleFailedRequestFunction
 *
 * @typedef {Partial<{ request: ScrapeHandleRequestFunction, response: ScrapeHandleResponseFunction, failedRequest: ScrapeHandleFailedRequestFunction }>} AddHandlerParameters
 *
 * @typedef {{
 * rootDirectory?: string
 * fileExtension?: string,
 * disable?: boolean
 * }} ScrapeCacheOptions
 *
 * @typedef {{
 * attempts?: number
 * }} ScrapeRetryOptions
 *
 * @typedef {{
 * interval?: number
 * limit?: number
 * }} ScrapeThrottleOptions
 *
 * @typedef {{
 * contentType?: ResourceContentType
 * returnRawFetchResponse?: boolean
 * cache?: ScrapeCacheOptions
 * retry?: ScrapeRetryOptions
 * throttle?: ScrapeThrottleOptions
 * }} ScrapeOptions
 *
 * @typedef {{
 * retry: { attempts: number, error: Error }
 * request: Promise<Response>
 * }} ScrapeInFlightRequest
 *
 * @typedef {{
 * attempts: number
 * error: Error
 * }} ScrapeRetryInfo
 *
 */

/**
 * LocalResource
 *
 * @typedef {{
 * rootDirectory?: string
 * resourceExtension?: string
 * }} LocalResourceOptions
 *
 */

/**
 * LocalCache
 *
 * @typedef {{
 * contentType?: 'json' | 'html'
 * rootDirectory?: string
 * resourceExtension?: string
 * }} LocalCacheOptions
 *
 */
