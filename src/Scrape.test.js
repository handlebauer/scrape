import test from 'ava'
import { access } from 'fs/promises'
import { Scrape } from './Scrape.js'

/** @param {string} path */
const pathExists = path =>
  access(path)
    .then(() => true)
    .catch(() => false)

const baseURL = '////https://httpbin.org////'

test('Should return valid instance with sensible defaults', t => {
  const htmlScraper = Scrape.init(baseURL, { contentType: 'html' })

  t.is(htmlScraper.baseURL, 'https://httpbin.org')
  t.is(htmlScraper.contentType, 'html')
  t.is(htmlScraper.retryAttempts, 0)
  t.is(htmlScraper.throttleLimit, 1)
  t.is(htmlScraper.throttleInterval, 1000)

  const jsonScraper = Scrape.init(baseURL)

  t.is(jsonScraper.baseURL, 'https://httpbin.org')
  t.is(jsonScraper.contentType, 'json')
  t.is(jsonScraper.retryAttempts, 0)
  t.is(jsonScraper.throttleLimit, 1)
  t.is(jsonScraper.throttleInterval, 1000)
})

test("Should allow modifying an instance's throttle options", t => {
  const scraper = Scrape.init(baseURL)

  scraper.throttleInterval = 5000
  scraper.throttleLimit = 5

  t.is(scraper.throttleInterval, 5000)
  t.is(scraper.throttleLimit, 5)
})

test("Should allow modifying an instance's retry options", t => {
  const scraper = Scrape.init(baseURL)

  scraper.retryAttempts = 3

  t.is(scraper.retryAttempts, 3)
})

test('Should successfully return a JavaScript object from a JSON body', async t => {
  const scraper = Scrape.init(baseURL)

  const data = await scraper.scrape('json')

  t.is(typeof data, 'object')
  t.is(data.slideshow.title, 'Sample Slide Show')
})

test('Should successfully return HTML from an HTML body', async t => {
  const scraper = Scrape.init(baseURL, { contentType: 'html' })

  const html = await scraper.scrape('html')

  t.is(typeof html, 'string')
  t.true(html.startsWith('<!DOCTYPE html>'))
})

test('Should successfully save HTML with an .html extension if configured', async t => {
  const scraper = Scrape.init(baseURL, {
    contentType: 'html',
    cache: { name: 'scraper', fileExtension: 'html' },
  })

  await scraper.scrape('html')

  const targetPath = '__cache/scraper/html.html'
  const derivedPath = scraper.getLocalPath('html')

  t.true(await pathExists(targetPath))
  t.is(derivedPath, targetPath)
})

test('Should return a local file if it exists upon invoking getLocalFile', async t => {
  const scraper = Scrape.init(baseURL, {
    contentType: 'html',
    cache: { name: 'scraper' },
  })

  await scraper.scrape('html')

  const file = await scraper.getLocalFile('html')

  t.is(typeof file, 'string')
  t.true(file.startsWith('<!DOCTYPE html>'))
})

test("Should return null upon invoking getLocalFile if the file doesn't exist", async t => {
  const scraper = Scrape.init(baseURL)

  const file = await scraper.getLocalFile('random/path')

  t.is(file, null)
})

test('Should return a local path if it exists upon invoking getLocalPath', async t => {
  const scraper = Scrape.init(baseURL, {
    contentType: 'html',
    cache: { name: 'scraper' },
  })

  await scraper.scrape('html')

  const path = scraper.getLocalPath('html')

  const targetPath = '__cache/scraper/html'

  t.is(path, targetPath)
})

test("Should return null upon invoking getLocalPath if the file doesn't exist", t => {
  const scraper = Scrape.init(baseURL)

  const path = scraper.getLocalPath('random/path')

  t.is(path, null)
})

test('Should create a local directory given a provided cache name', async t => {
  const scraper = Scrape.init(baseURL, { cache: { name: 'httpbin' } })

  await scraper.scrape('json')

  t.true(await pathExists('__cache/httpbin'))
})

test('Should adapt to both relative and absolute hrefs', async t => {
  const scraper = Scrape.init(baseURL)

  const absoluteHref = 'https://httpbin.org/anything/is/anything'
  const relativeHref = 'anything/is/anything'

  const init = { method: 'post', body: 'testing' }
  const absoluteResponse = await scraper.scrape(absoluteHref, init)
  const reslativeResponse = await scraper.scrape(relativeHref, init)

  t.is(absoluteResponse.data, reslativeResponse.data)
})

test('Should return raw response when `returnRawFetchResponse` is `true`', async t => {
  const scraper = Scrape.init(baseURL, { returnRawFetchResponse: true })

  /**
   * @type {Response}
   */
  const rawFetchResponse = await scraper.scrape('json', { invalidate: true })

  t.true(rawFetchResponse instanceof Response)
  t.is(typeof rawFetchResponse.json, 'function')
})

test('Should return an error when attempting to use a href with a different baseURL', async t => {
  const scraper = Scrape.init(baseURL, { cache: { name: 'httpbin' } })

  const httpInsteadOfHttps = 'http://httpbin.org/json'

  await t.throwsAsync(() => scraper.scrape(httpInsteadOfHttps))
})

test('Should allow for one-off requests using the allowDistinctHref option', async t => {
  const scraper = Scrape.init(baseURL, { cache: { name: 'httpbin' } })

  const httpInsteadOfHttps = 'http://httpbin.org/json'

  const data = await scraper.scrape(httpInsteadOfHttps, {
    allowDistinctHref: true,
  })

  t.is(await pathExists('__cache/httpbin/http://httpbin.org/json'), true)
  t.is(typeof data, 'object')
  t.is(data.slideshow.title, 'Sample Slide Show')
})

test('Should save a copy of data to a specified path when invoking saveLocalFile', async t => {
  const scraper = Scrape.init(baseURL, { cache: { name: 'httpbin' } })

  const href = 'test/saveLocalFile'
  const data = { foo: 'bar' }

  const success = await scraper.addLocalFile(href, data)

  const targetPath = '__cache/httpbin/test/saveLocalFile'

  t.is(success, true)
  t.is(await pathExists(targetPath), true)
  t.deepEqual(await scraper.getLocalFile(href), data)
  t.deepEqual(await scraper.scrape(href), data)
})

test.only('Should skip saving file to cache if the skipCache option is set to true', async t => {
  const scraper = Scrape.init(baseURL, { cache: { name: 'httpbin' } })

  const href = 'uuid?test=skipCache'

  const response = await scraper.scrape(href, { skipCache: true })
  const file = await scraper.getLocalFile(href)

  t.is(typeof response.uuid, 'string')
  t.is(file, null)
})
