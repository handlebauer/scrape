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
 * name?: string
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
 * contentType?: import('./types.js').ResourceContentType
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
 * @typedef {'millisecond' | 'second' | 'minute' | 'hour' | 'day' | 'week' | 'month' | 'year'} ScrapeTimeUnitsSingular
 * @typedef {'milliseconds' | 'seconds' | 'minutes' | 'hours' | 'days' | 'weeks' | 'months' | 'years'} ScrapeTimeUnits
 * @typedef {[number, ScrapeTimeUnits | ScrapeTimeUnitsSingular]} ExpiresAfterTime
 *
 * @typedef {{
 * force?: boolean
 * ago?: ExpiresAfterTime
 * }} ScrapeMethodInvalidateOptions
 *
 * @typedef {{
 * invalidate?: { force?: boolean, ago: ExpiresAfterTime }
 * skipCache?: boolean
 * allowDistinctHref?: boolean
 * }} ScrapeMethodOptions
 *
 * @typedef {RequestInit & ScrapeMethodOptions} RequestInitScrapeMethodOptions
 *
 */

export {}
