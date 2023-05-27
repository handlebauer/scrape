import _test from 'ava'
import { rm } from 'fs/promises'
import { LocalHTTPCache } from '@hbauer/local-cache'
import { sleep } from '@hbauer/convenience-functions'
import { randomString } from 'remeda'
import { throwUnlessENOENT } from '@hbauer/local-file/errors.js'
import { LocalFile } from '@hbauer/local-file'
import { Scrape } from './Scrape.js'
import { ScrapeError } from './errors/ScrapeError.js'

const test = _test.serial

/**
 * MOCK DATA
 */

const baseURL = 'http://localhost:8080'
const cacheDirectory = '__cache'

/**
 * HANDLERS
 */

test.beforeEach('test', async _ => {
  await rm(cacheDirectory, { recursive: true }).catch(throwUnlessENOENT)

  await sleep(100)
})

test.after('test', async _ => {
  await rm(cacheDirectory, { recursive: true }).catch(throwUnlessENOENT)
})

test('Should create a valid JSON-based instance without any options specified', async t => {
  const httpbin = await Scrape.init(baseURL)

  t.is(httpbin.baseURL, baseURL)
  t.is(httpbin.contentType, 'json')
  t.is(httpbin.responseBodyType, 'json')
  t.is(httpbin.returnRawResponse, false)
  t.is(httpbin.handlers.request, null)
  t.is(httpbin.handlers.response, null)
  t.is(httpbin.handlers.failedRequest, null)

  t.true(httpbin.cache instanceof LocalHTTPCache)

  // @ts-ignore
  t.is(httpbin.throttle.interval, 1000)

  // @ts-ignore
  t.is(httpbin.throttle.limit, 1)

  // @ts-ignore
  t.is(httpbin.retry.number, 0)
})

test('Should create a valid HTML-based instance', async t => {
  const httpbin = await Scrape.init(baseURL, { contentType: 'html' })

  t.is(httpbin.baseURL, baseURL)
  t.is(httpbin.contentType, 'html')
  t.is(httpbin.responseBodyType, 'text')
  t.is(httpbin.returnRawResponse, false)
  t.is(httpbin.handlers.request, null)
  t.is(httpbin.handlers.response, null)
  t.is(httpbin.handlers.failedRequest, null)
  t.true(httpbin.cache instanceof LocalHTTPCache)

  // @ts-ignore
  t.is(httpbin.throttle.interval, 1000)

  // @ts-ignore
  t.is(httpbin.throttle.limit, 1)

  // @ts-ignore
  t.is(httpbin.retry.number, 0)
})

test('Should create a valid instance with empty options specified', async t => {
  const httpbin = await Scrape.init(baseURL, {})

  t.is(httpbin.baseURL, baseURL)
  t.is(httpbin.contentType, 'json')
  t.is(httpbin.responseBodyType, 'json')
  t.is(httpbin.returnRawResponse, false)
  t.is(httpbin.handlers.request, null)
  t.is(httpbin.handlers.response, null)
  t.is(httpbin.handlers.failedRequest, null)
  t.true(httpbin.cache instanceof LocalHTTPCache)

  // @ts-ignore
  t.is(httpbin.throttle.interval, 1000)

  // @ts-ignore
  t.is(httpbin.throttle.limit, 1)

  // @ts-ignore
  t.is(httpbin.retry.number, 0)
})

test('Should create a valid instance with partial options specified', async t => {
  let httpbin = await Scrape.init(baseURL, { throttle: { interval: 5000 } })

  t.is(httpbin.baseURL, baseURL)
  t.is(httpbin.contentType, 'json')
  t.is(httpbin.responseBodyType, 'json')
  t.is(httpbin.returnRawResponse, false)
  t.is(httpbin.handlers.request, null)
  t.is(httpbin.handlers.response, null)
  t.is(httpbin.handlers.failedRequest, null)
  t.true(httpbin.cache instanceof LocalHTTPCache)

  // @ts-ignore
  t.is(httpbin.throttle.interval, 5000)

  // @ts-ignore
  t.is(httpbin.throttle.limit, 1)

  // @ts-ignore
  t.is(httpbin.retry.number, 0)

  httpbin = await Scrape.init(baseURL, { throttle: { limit: 5 } })

  t.is(httpbin.baseURL, baseURL)
  t.is(httpbin.contentType, 'json')
  t.is(httpbin.responseBodyType, 'json')
  t.is(httpbin.returnRawResponse, false)
  t.is(httpbin.handlers.request, null)
  t.is(httpbin.handlers.response, null)
  t.is(httpbin.handlers.failedRequest, null)
  t.true(httpbin.cache instanceof LocalHTTPCache)

  // @ts-ignore
  t.is(httpbin.throttle.interval, 1000)

  // @ts-ignore
  t.is(httpbin.throttle.limit, 5)

  // @ts-ignore
  t.is(httpbin.retry.number, 0)
})

test("Should return a Response object if `returnRawResponse` is specified and the file isn't cached", async t => {
  const httpbin = await Scrape.init(baseURL, { returnRawResponse: true })

  const response = await httpbin.scrape('json')

  t.true(response instanceof Response)
})

test('Should return a LocalFile instance if `returnRawResponse` is specified and the file IS cached', async t => {
  const httpbin = await Scrape.init(baseURL, { returnRawResponse: true })

  await httpbin.scrape('json')
  const file = await httpbin.scrape('json')

  t.true(file instanceof LocalFile)
})

test('Should correctly assign retry config upon invooking setRetry', async t => {
  const httpbin = await Scrape.init(baseURL, {})

  // @ts-ignore
  t.is(httpbin.retry.number, 0)

  // @ts-ignore
  httpbin.retryNumber = 1

  // @ts-ignore
  t.is(httpbin.retry.number, 1)

  t.throws(() => {
    httpbin.retryNumber = -1
  })
})

test('Should correctly assign throttle config when using throttle setters', async t => {
  const httpbin = await Scrape.init(baseURL)

  // @ts-ignore
  t.is(httpbin.throttle.interval, 1000)
  // @ts-ignore
  t.is(httpbin.throttle.limit, 1)

  httpbin.throttleInterval = 2000

  // @ts-ignore
  t.is(httpbin.throttle.interval, 2000)
  // @ts-ignore
  t.is(httpbin.throttle.limit, 1)

  httpbin.throttleLimit = 2

  // @ts-ignore
  t.is(httpbin.throttle.interval, 2000)
  // @ts-ignore
  t.is(httpbin.throttle.limit, 2)

  t.throws(() => {
    httpbin.throttleLimit = -1 // should be gte 1
  })

  t.throws(() => {
    httpbin.throttleInterval = -1 // should be gte 1
  })
})

test('Should return raw data for non-cached scrapes', async t => {
  const httpbinJson = await Scrape.init(baseURL)
  const httpbinHtml = await Scrape.init(baseURL, { contentType: 'html' })

  const json = await httpbinJson.scrape('json', {
    skipCache: true,
  })

  const html = await httpbinHtml.scrape('html', {
    skipCache: true,
  })

  /**
   * TODO: fix typing for JSONData (should be an intersection, not a union)
   */
  t.is(json.slideshow.title, 'Sample Slide Show')
  t.true(html.startsWith('<!DOCTYPE html>'))
})

test('Should return a LocalFile for cached JSON scrapes', async t => {
  const httpbin = await Scrape.init(baseURL)

  await httpbin.scrape('json')
  const file = await httpbin.scrape('json')

  t.is(file.data.slideshow.title, 'Sample Slide Show')
})

test('Should return a LocalFile for cached HTML scrapes', async t => {
  const httpbin = await Scrape.init(baseURL, { contentType: 'html' })

  await httpbin.scrape('html')
  const file = await httpbin.scrape('html')

  t.true(file.data.startsWith('<!DOCTYPE html>'))
})

test('Should throw an error for scrapes to hrefs distinct from the baseURL', async t => {
  const httpbin = await Scrape.init(baseURL)

  const href = 'http://httpbin.org/json' // http vs https

  await t.throwsAsync(() => httpbin.scrape(href))
})

test('Should allow for scrapes to hrefs distinct from the baseURL if allowDistinctHref is true', async t => {
  const httpbin = await Scrape.init(baseURL, { contentType: 'html' })

  const href = 'https://donaldgeddes.ca' // http vs https

  const html = await httpbin.scrape(href, { allowDistinctHref: true })

  t.true(html.data.startsWith('<!DOCTYPE html>'))
})

test("Should skip the cache (i.e. don't write to the cache) if skipCache is true", async t => {
  const httpbin = await Scrape.init(baseURL)

  await httpbin.scrape('json', { skipCache: true })

  const file = await httpbin.cache.get('json')

  t.is(file, null)
})

test('Should invariably invalidate the href if invalidate.force is true', async t => {
  const httpbin = await Scrape.init(baseURL)

  await httpbin.scrape('json') // 'json' => cached

  let file = await httpbin.scrape('json')
  t.is(file.attributes.fromCache, true)

  file = await httpbin.scrape('json', { invalidate: { force: true } }) // 'json' refetched
  t.is(file.attributes.fromCache, false)
})

test('Should always return a Response if both invalidate.force and returnRawResponse are true', async t => {
  const httpbin = await Scrape.init(baseURL, { returnRawResponse: true })

  await httpbin.scrape('json')
  const file = await httpbin.scrape('json', { invalidate: { force: true } }) // 'json' => cached

  t.true(file instanceof Response)
})

test('Should correctly throttle scraping given the configured throttle config', async t => {
  const n = 3
  const interval = 1000

  const httpbin = await Scrape.init(baseURL, { throttle: { interval } }) // 1 request per second

  const before = Date.now()

  await httpbin.scrape('json', { invalidate: { force: true } })
  await httpbin.scrape('json', { invalidate: { force: true } })
  await httpbin.scrape('json', { invalidate: { force: true } })

  const after = Date.now()

  t.true(after - before > (n - 1) * interval)
})

test('Should throw an error when attempting to add an unsupported handler', async t => {
  const httpbin = await Scrape.init(baseURL)

  // @ts-ignore
  t.throws(() => httpbin.addHandler('noop', () => {}), {
    instanceOf: ScrapeError,
  })
})

test('Should reach the request handler if defined', async t => {
  const httpbin = await Scrape.init(baseURL)

  const href = 'json'

  httpbin.addHandler('request', url => {
    t.is(url.toString(), baseURL + '/' + href)
    return url
  })

  await httpbin.scrape(href)
})

test('Should reach the response handler if defined', async t => {
  const httpbin = await Scrape.init(baseURL)

  const href = 'json'

  httpbin.addHandler('response', async response => {
    const data = await response.json()
    t.true(data.slideshow.author === 'Yours Truly')
    return response
  })

  await httpbin.scrape(href)
})

test('Should reach the failedRequest handler if defined', async t => {
  const httpbin = await Scrape.init(baseURL)

  httpbin.addHandler('failedRequest', error => {
    t.is(error.status, 404)
    return error
  })

  await t.throwsAsync(() => httpbin.scrape(randomString(5)), {
    instanceOf: ScrapeError,
  })
})

test('Should correctly retry scraping given the configured retry config', async t => {
  const retries = 1

  const httpbin = await Scrape.init(baseURL, { retry: { number: retries } })

  let attempts = 0

  httpbin.addHandler('failedRequest', error => {
    attempts += 1
    return error
  })

  await t.throwsAsync(() => httpbin.scrape(randomString(5)), {
    instanceOf: ScrapeError,
  })

  t.is(attempts - 1, retries) // attempts + 1 because we need to factor in the initial request

  t.is(await httpbin.scrape(randomString(5)).catch(err => err.status), 404)
})

test('Should add a (later-retrievable) file to the cache if desired', async t => {
  const httpbin = await Scrape.init(baseURL)

  const json = await httpbin.scrape('json')

  t.is(json.data.slideshow.title, 'Sample Slide Show')

  json.data.slideshow.title = 'Boring Slide Show'

  await httpbin.cache.set('boring-slide-show', json)
  const file = await httpbin.scrape('boring-slide-show')

  t.is(file.data.slideshow.title, 'Boring Slide Show')
})

test('Should allow retrieval of paths related to cached files', async t => {
  const httpbin = await Scrape.init(baseURL)

  const href = 'json'

  await httpbin.scrape(href)

  const { directory, filename, fullPath } = httpbin.cache.getPaths(href)

  const expected = {
    directory: '__cache' + '/' + new URL(baseURL).host, // __cache/localhost:8080
    filename: href, // json
    fullPath: '__cache' + '/' + new URL(baseURL).host + '/' + href, // __cache/localhost:8080/json
  }

  t.is(directory, expected.directory)
  t.is(filename, expected.filename)
  t.is(fullPath, expected.fullPath)
})

test('Should invalidate the cache (resulting in a refetch) if invalidate.after is specified', async t => {
  const httpbin = await Scrape.init(baseURL)

  let fetches = 0

  httpbin.addHandler('response', response => {
    fetches += 1
    return response
  })

  await httpbin.scrape('json')
  await httpbin.scrape('json')

  t.is(fetches, 1) // second request is cached and won't reach the response handler

  await httpbin.scrape('json', { invalidate: { after: [0, 'seconds'] } })

  t.is(fetches, 2) // should invalidate and refetch!
})

test('Should support POST requests', async t => {
  const httpbin = await Scrape.init(baseURL)

  const init = { method: 'post', body: JSON.stringify({ foo: 'bar' }) }
  const href = 'anything/is/anything'

  const file = await httpbin.scrape(href, init)

  t.is(file.data.json.foo, 'bar')
})
