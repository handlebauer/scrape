import { removeSlashes } from './remove-slash.js'

/**
 * @param {string} baseURL
 * @param {string} href
 */
export const reconcileHref = (baseURL, href) => {
  href = removeSlashes(href)
  return href.startsWith(baseURL) ? href : baseURL + '/' + href
}
