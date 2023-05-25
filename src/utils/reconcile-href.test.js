import test from 'ava'
import { reconcileHref } from './reconcile-href.js'

const baseURL = 'https://httpbin.org'

/**
 * NOTE: tests don't guard for baseURL as baseURL is always already validated in practice
 */

test('Should throw an error if the values passed in are not valid', t => {
  // @ts-ignore
  t.throws(() => reconcileHref(baseURL))
  t.throws(() => reconcileHref(baseURL, ''))
  t.throws(() => reconcileHref(baseURL, null))
  t.throws(() => reconcileHref(baseURL, undefined))
  // @ts-ignore
  t.throws(() => reconcileHref(baseURL, 0))
  // @ts-ignore
  t.throws(() => reconcileHref(baseURL, Symbol('not a href')))
})

test('Should return null if the href is unable to be reconciled', t => {
  const href = 'http://httpbin.org' // http vs https

  t.is(reconcileHref(baseURL, href), null)
})

test('Should return a valid href whether provided a relative or absolute href', t => {
  const expected = 'https://httpbin.org/relative'

  t.is(reconcileHref(baseURL, 'relative'), expected)
  t.is(reconcileHref(baseURL, 'https://httpbin.org/relative'), expected)
})
