import { map, mapValues, omitBy, pipe, toPairs } from 'remeda'
import { ZodError } from 'zod'

/**
 * @param {ZodError} error
 */
export const formatZodError = error => {
  const formatted = pipe(
    error.format(),
    omitBy((v, k) => k.startsWith('_')),
    // @ts-ignore
    mapValues(val => val._errors),
    toPairs,
    map(
      ([param, ...causes]) =>
        '  ' + param + ':' + ' ' + causes.flat().join(' - ')
    )
  ).join('\n')

  return '\n\n' + formatted + '\n'
}
