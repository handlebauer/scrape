import test from 'ava'
import { access, rm } from 'fs/promises'
import { timeSinceFile } from '@hbauer/time-since-file'
import { Scrape } from './Scrape.js'

/** @param {string} path */
const pathExists = path =>
  access(path)
    .then(() => true)
    .catch(() => false)

const rootDirectory = '__cache'
const name = 'scraper'
const baseURL = '////https://httpbin.org////'

test.beforeEach('test', async _ => {
  await rm('__cache', { recursive: true }).catch(error =>
    error.code === 'ENOENT' ? null : Promise.reject(error)
  )
})

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

  const data = await scraper.scrape('json?test=return-json')

  t.is(typeof data, 'object')
  t.is(data.slideshow.title, 'Sample Slide Show')
})

test('Should successfully return HTML from an HTML body', async t => {
  const scraper = Scrape.init(baseURL, { contentType: 'html' })

  const html = await scraper.scrape('html?test=return-html')

  t.is(typeof html, 'string')
  t.true(html.startsWith('<!DOCTYPE html>'))
})

test('Should successfully save HTML with an .html extension if configured', async t => {
  const scraper = Scrape.init(baseURL, {
    contentType: 'html',
    cache: { name, fileExtension: 'html' },
  })

  const href = 'html?test=include-extension'

  await scraper.scrape(href)

  const targetPath = `${rootDirectory}/${name}/${href}.html`
  const derivedPath = scraper.getLocalPath(href)

  t.true(await pathExists(targetPath))
  t.is(derivedPath, targetPath)
})

test('Should return a local file alongside metadata if the file exists upon invoking getLocalFile', async t => {
  const contentType = 'html'

  const scraper = Scrape.init(baseURL, {
    contentType,
    cache: { name },
  })

  const href = `${contentType}?test=return-existing-local-file`

  const timeBeforeScrape = Date.now()

  await scraper.scrape(href)

  const { data, meta } = await scraper.getLocalFile(href)

  t.is(typeof data, 'string')
  t.true(data.startsWith('<!DOCTYPE html>'))

  t.is(meta.directory, `${rootDirectory}/${name}`)
  t.is(meta.filename, href)
  t.is(meta.path, `${rootDirectory}/${name}/${href}`)

  t.true(meta.sinceUpdated.milliseconds > 0)
  t.true(meta.sinceUpdated.milliseconds < timeBeforeScrape)

  t.true(meta.updatedAt instanceof Date)
  t.is(isNaN(meta.updatedAt.getTime()), false) // detect invalid date
  t.true(meta.updatedAt.getTime() > timeBeforeScrape) // updated time is newer than before scrape
})

test("Should return null upon invoking getLocalFile if the file doesn't exist", async t => {
  const contentType = 'json'

  const scraper = Scrape.init(baseURL)

  const file = await scraper.getLocalFile(
    `${contentType}?test=return-non-existing-file`
  )

  t.is(file, null)
})

test('Should return a local path if it exists upon invoking getLocalPath', async t => {
  const contentType = 'html'

  const scraper = Scrape.init(baseURL, { contentType, cache: { name } })

  const href = `${contentType}?test=get-existing-local-path`

  await scraper.scrape(`${contentType}?test=get-existing-local-path`)

  const path = scraper.getLocalPath(href)

  const targetPath = `${rootDirectory}/${name}/${href}`

  t.is(path, targetPath)
})

test("Should return null upon invoking getLocalPath if the file doesn't exist", t => {
  const scraper = Scrape.init(baseURL)

  const path = scraper.getLocalPath(
    'xS8FPpZXJEs=Fz2bUx4hlxlHaF5G6mzrIDfaYlFSKQMfeo0uQClM7Zb2+0CQ6JOK'
  )

  t.is(path, null)
})

test('Should create a directory given a provided cache name', async t => {
  const scraper = Scrape.init(baseURL, { cache: { name } })

  await scraper.scrape('json?test=create-dir-from-cache-name')

  t.true(await pathExists(`${rootDirectory}/${name}`))
})

test('Should adapt to both relative and absolute hrefs', async t => {
  const scraper = Scrape.init(baseURL)

  const absoluteHref = `${baseURL}/anything/is/anything?test=adapt-to-hrefs-format`
  const relativeHref = 'anything/is/anything?test=adapt-to-hrefs-format'

  const init = { method: 'post', body: JSON.stringify({ foo: 'bar' }) }

  const absoluteResponse = await scraper.scrape(absoluteHref, init)
  const reslativeResponse = await scraper.scrape(relativeHref, init)

  t.is(absoluteResponse.data, reslativeResponse.data)
})

test('Should return raw response when `returnRawFetchResponse` is `true`', async t => {
  const scraper = Scrape.init(baseURL, { returnRawFetchResponse: true })

  /**
   * @type {Response}
   */
  const rawFetchResponse = await scraper.scrape(
    'json?test=returnRawFetchResponse'
  )

  t.true(rawFetchResponse instanceof Response)
  t.is(typeof rawFetchResponse.json, 'function')
})

test('Should return an error when attempting to use a href with a different baseURL', async t => {
  const scraper = Scrape.init(baseURL, { cache: { name } })

  const httpInsteadOfHttps = 'http://httpbin.org/json'

  await t.throwsAsync(() => scraper.scrape(httpInsteadOfHttps))
})

test('Should allow for one-off requests using the allowDistinctHref option', async t => {
  const scraper = Scrape.init(baseURL, { cache: { name } })

  const httpInsteadOfHttps = 'http://httpbin.org/json'

  const data = await scraper.scrape(httpInsteadOfHttps, {
    allowDistinctHref: true,
  })

  t.is(
    await pathExists(
      `${rootDirectory}/${name}/${httpInsteadOfHttps
        .split('/')
        .slice(0, -1)
        .join('/')}`
    ),
    true
  )
  t.is(typeof data, 'object')
  t.is(data.slideshow.title, 'Sample Slide Show')
})

test('Should save a copy of data to a specified path when invoking addLocalFile', async t => {
  const scraper = Scrape.init(baseURL, { cache: { name } })

  const href = 'file?test=addLocalFile'
  const data = { foo: 'bar' }

  const success = await scraper.addLocalFile(href, data)

  const targetPath = `${rootDirectory}/${name}/${href}`

  t.is(success, true)
  t.is(await pathExists(targetPath), true)
  t.deepEqual(await scraper.getLocalFile(href).then(({ data }) => data), data)
  t.deepEqual(await scraper.scrape(href), data)
})

test('Should skip saving file to cache if the skipCache option is set to true', async t => {
  const scraper = Scrape.init(baseURL, { cache: { name } })

  const href = 'uuid?test=skipCache'

  const response = await scraper.scrape(href, { skipCache: true })
  const file = await scraper.getLocalFile(href)

  t.is(typeof response.uuid, 'string')
  t.is(file, null)
})

test('Should refetch a resource if the file is older than the expiresAfter option', async t => {
  const scraper = Scrape.init(baseURL, { cache: { name } })

  const href = 'uuid?test=expiresAfter'

  /**
   * Fetch and cache a resource, like normal
   */
  await scraper.scrape(href)
  const beforeReFetch = Date.now()

  /**
   * Force re-fetch (the file will always be older than 1 ms)
   */
  const response = await scraper.scrape(href, {
    invalidate: { ago: [1, 'milliseconds'] },
  })

  const path = scraper.getLocalPath(href)
  const since = await timeSinceFile(path)

  t.is(since.created.milliseconds, since.updated.milliseconds)
  t.true(since.created.milliseconds < beforeReFetch)
  t.is(typeof response.uuid, 'string')
})
