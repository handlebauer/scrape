import test from 'ava'
import { cloneResponse } from './clone-response.js'

const html = 'http://localhost:8080/html'
const json = 'http://localhost:8080/json'

test('Should return a cloned instance of Response which allows for decoding the body an arbitrary number of times', async t => {
  const response = await fetch(html)
  const responseData = await response.clone().text()

  const clone = cloneResponse(response)
  const cloneData = await clone.text()

  await t.throwsAsync(() => response.text())

  await t.notThrowsAsync(() => clone.text())
  await t.notThrowsAsync(() => clone.text())
  await t.notThrowsAsync(() => clone.text())

  t.true(response instanceof Response)
  t.true(clone instanceof Response)

  t.is(response.url, clone.url)
  t.is(response.status, clone.status)
  t.is(response.statusText, clone.statusText)

  t.is(response.bodyUsed, true)
  t.is(clone.bodyUsed, true)

  t.is(responseData, cloneData)
})

test('Should return a cloned instance of Response which allows for decoding a text body', async t => {
  const response = await fetch(html)

  const clone = cloneResponse(response)
  const cloneData = await clone.text()

  t.is(typeof cloneData, 'string')
})

test('Should return a cloned instance of Response which allows for decoding a JSON body', async t => {
  const response = await fetch(json)

  const clone = cloneResponse(response)
  const cloneData = await clone.json()

  t.is(cloneData.slideshow.author, 'Yours Truly')
})
