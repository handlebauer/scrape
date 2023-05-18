import { pipe } from 'remeda'

/**
 * @param {string} string
 * @returns {string}
 */
const removeTrailingSlash = string =>
  string.endsWith('/') === true
    ? removeTrailingSlash(string.slice(0, -1))
    : string

/**
 * @param {string} string
 * @returns {string}
 */
const removeLeadingSlash = string =>
  string.startsWith('/') === true ? removeLeadingSlash(string.slice(1)) : string

/**
 * @param {string} string
 */
export const removeSlashes = string =>
  pipe(string, removeTrailingSlash, removeLeadingSlash)
