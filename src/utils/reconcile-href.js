import { removeSlashes } from './remove-slash.js'

/**
 * Reconciles a baseURL with the provided href
 *
 * @param {string} baseURL
 * @param {string} href
 * @example
 * const baseURL = 'https://example.com'
 * const href = 'path/to/resource'
 * reconcileHref(baseUURL, href) //= 'https://example.com/path/to/resource'
 * reconcileHref(baseURL, baseURL + '/' + href) //= 'https://example.com/path/to/resource'
 * reconcileHref(baseURL, 'https://not-example.com' + '/' + href) //= null
 */
export const reconcileHref = (baseURL, href) => {
  if (!!href === false) {
    return null
  }

  href = removeSlashes(href)

  const isAbsolute = href.startsWith('http') === true

  if (isAbsolute) {
    if (href.startsWith(baseURL) === true) {
      return href
    }
    return null
  }

  return baseURL + '/' + href
}
