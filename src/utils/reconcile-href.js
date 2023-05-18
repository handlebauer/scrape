import { removeSlashes } from './remove-slash.js'

/**
 * @param {string} baseURL
 * @param {string} href
 */
export const reconcileHref = (baseURL, href) => {
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
