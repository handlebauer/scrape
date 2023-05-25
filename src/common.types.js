// eslint-disable-next-line no-unused-vars
import { z } from 'zod'
// eslint-disable-next-line no-unused-vars
import { fileAgeDuration } from '@hbauer/local-file/parameters.js'

import { ScrapeError } from './errors/ScrapeError.js'

/**
 * @typedef {string | number | boolean | JSONObject | JSONArray} JSONValue
 * @typedef {{ [key: string]: JSONValue}} JSONObject
 * @typedef {JSONObject[]} JSONArray
 * @typedef {JSONObject | JSONArray} JSONData
 *
 * @typedef {string} HTMLData
 *
 * @typedef {JSONData | HTMLData} ScrapeResponseData
 */

/**
 * @typedef {string} ScrapeHref
 */

/**
 * @typedef {{
 * attempts?: number
 * error?: ScrapeError
 * }} ScrapeInFlightRequestRetry
 */

/**
 * @typedef {{
 * invalidate?: { force?: boolean, after?: z.infer<fileAgeDuration> }
 * skipCache?: boolean
 * allowDistinctHref?: boolean
 * } & RequestInit} ScrapeMethodOptions
 */
