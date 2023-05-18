import test from 'ava'
import { Scrape } from './Scrape.js'

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
