import { ScrapeError } from './errors/ScrapeError.js'

/**
 * COMMON
 *
 * @typedef {import('./common.types.js').ScrapeInFlightRequestRetry} ScrapeInFlightRequestRetry
 * @typedef {import('./common.types.js').ScrapeResponseData} ScrapeResponseData
 */

/**
 * @typedef {(url: URL) => Promise<URL> | URL} ScrapeRequestHandler
 * @typedef {(response: Response) => undefined | ScrapeResponseData | Response | Promise<undefined | ScrapeResponseData | Response>} ScrapeResponseHandler
 * @typedef {(error: ScrapeError, retry: ScrapeInFlightRequestRetry) => void} ScrapeFailedRequestHandler
 * @typedef {ScrapeRequestHandler & ScrapeResponseHandler & ScrapeFailedRequestHandler} ScrapeHandler
 *
 * @typedef {'request' | 'response' | 'failedRequest'} ScrapeHandlerType
 */
