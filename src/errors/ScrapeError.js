import { ZodError } from 'zod'

/**
 * @typedef {(Error & NodeJS.ErrnoException | ZodError) & { status: number, code: string }} ScrapeParentError
 */

export class ScrapeError extends Error {
  /**
   * @typedef {{
   * message?: string
   * parent?: ScrapeParentError
   * formatParent?: (error: Error & NodeJS.ErrnoException) => string
   * status?: number
   * code?: string
   * }} ScrapeErrorParams
   */

  /**
   * @param {string} title
   * @param {ScrapeErrorParams} params
   */
  constructor(title, { message, parent, formatParent, status, code }) {
    super()

    if (title) {
      this.message = title
    }

    if (message) {
      if (title) {
        this.message += ':' + ' ' + message
      } else {
        this.message = message
      }
    }

    if (parent) {
      if (formatParent) {
        message = formatParent(parent)
      } else {
        message = parent.message
      }
      this.message += ' ' + '[' + message + ']'
    }

    if (status || parent?.status) {
      this.status = status || parent.status
    }

    if (code || parent?.code) {
      this.code = code || parent?.code
    }
  }
}
