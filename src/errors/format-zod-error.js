import { map, mapValues, omitBy, pipe, toPairs } from 'remeda'
import { ZodError } from 'zod'

/**
 * @param {ZodError} error
 */
export const formatZodError = error => {
  /**
   * @param {[string, string[]]} params
   */
  const toLine = ([param, ...causes]) =>
    '  ' + param + ':' + ' ' + causes.flat().join(' - ')

  const formatted = pipe(
    error.format(),
    omitBy((v, k) => k.startsWith('_')),
    // @ts-ignore
    mapValues(val => val._errors),
    toPairs,
    map(toLine)
  ).join('\n')

  return '\n\n' + formatted + '\n'
}
