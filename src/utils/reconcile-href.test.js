import test from 'ava'
import { reconcileHref } from './reconcile-href.js'

const baseURL = 'https://httpbin.org'

test('Should return absolute href if provided with relative href', t => {
  const href = 'path/to/resource'

  const reconciledHref = reconcileHref(baseURL, href)

  t.is(reconciledHref, 'https://httpbin.org/path/to/resource')
})

test('Should return absolute href if provided with absolute href', t => {
  const href = 'https://httpbin.org/path/to/resource'

  const reconciledHref = reconcileHref(baseURL, href)

  t.is(reconciledHref, 'https://httpbin.org/path/to/resource')
})

test('Should return null if provided with an absolute href with a different base than baseURL', t => {
  // NOTE: uses 'http' vs. 'https'
  const href = 'http://httpbin.org/path/to/resource'

  const reconciledHref = reconcileHref(baseURL, href)

  t.is(reconciledHref, null)
})
