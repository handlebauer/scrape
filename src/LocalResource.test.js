import test from 'ava'

import { LocalResource } from './LocalResource.js'

const baseURL = 'https://httpbin.org'

test('Should return correct paths for a top-level resource', t => {
  const localResource = new LocalResource(baseURL, {
    rootDirectory: '__cache',
    name: 'test',
    extension: 'json',
  })

  const href = 'page'

  const { directory, filename, path } = localResource.getPaths(href)

  t.is(directory, '__cache/test')
  t.is(filename, 'page.json')
  t.is(path, '__cache/test/page.json')
})

test('Should return correct paths for a nested resource', t => {
  const localResource = new LocalResource(baseURL, {
    rootDirectory: '__cache',
    name: 'test',
    extension: 'json',
  })

  const href = 'path/to/page'

  const { directory, filename, path } = localResource.getPaths(href)

  t.is(directory, '__cache/test/path/to')
  t.is(filename, 'page.json')
  t.is(path, '__cache/test/path/to/page.json')
})
