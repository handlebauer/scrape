import test from 'ava'
import { removeSlashes } from './remove-slash.js'

const targetAbsolute = 'https://httpbin.org'
const targetRelative = 'path/to/resource'

test('Should return null if provided with invalid params', t => {
  t.is(removeSlashes(null), null)
  t.is(removeSlashes(''), null)
  // @ts-ignore
  t.is(removeSlashes(), null)
  // @ts-ignore
  t.is(removeSlashes(0), null)
})

test('Should remove 1+ trailing slashes', t => {
  t.is(removeSlashes('https://httpbin.org/'), targetAbsolute)
  t.is(removeSlashes('https://httpbin.org///////'), targetAbsolute)
})

test('Should remove 1+ leading slashes', t => {
  t.is(removeSlashes('/path/to/resource'), targetRelative)
  t.is(removeSlashes('//////path/to/resource'), targetRelative)
})

test('Should remove all trailing and leading slahes', t => {
  t.is(removeSlashes('/https://httpbin.org/'), targetAbsolute)
  t.is(removeSlashes('//////https://httpbin.org//////'), targetAbsolute)

  t.is(removeSlashes('/path/to/resource/'), targetRelative)
  t.is(removeSlashes('//////path/to/resource//////'), targetRelative)
})
