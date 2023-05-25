import {
  flatten,
  map,
  mapKeys,
  mapValues,
  omitBy,
  pipe,
  toPairs,
  uniq,
} from 'remeda'
import { ZodError } from 'zod'

/**
 * @param {ZodError} error
 */
export const formatZodError = error => {
  /**
   * @param {[string, string[]]} params
   */
  const toLine = ([param, ...causes]) =>
    // @ts-ignore
    '  ' + param + ':' + ' ' + pipe(causes, flatten, uniq).join(' - ')

  /**
   * @param {string[] & { _errors?: string[] }} path
   */
  const getPaths = path => path._errors || path

  /**
   * @param {string[]} causes
   */
  const isEmpty = causes => causes.length < 1

  /**
   * @param {string} key
   */
  const formatArrayKeys = key =>
    isNaN(Number(key)) === false ? `Array Index ${Number(key)}` : key

  const formatted = pipe(
    error.format(),
    mapValues(getPaths),
    mapKeys(formatArrayKeys),
    omitBy(isEmpty),
    toPairs,
    map(toLine)
  ).join('\n')

  return '\n\n' + formatted + '\n'
}
