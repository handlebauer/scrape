# @hbauer/scrape

## Installation

```sh
$ yarn add @hbauer/scrape
$ npm install @hbauer/scrape
```

## Usage

### Basic

```js
import { Scrape } from '@hbauer/scrape'

const baseURL = 'https://httpbin.org' // trailing slash is OK

const httpbin = Scrape.init(baseURL, {
  contentType, // 'json' | 'html' (defaults to 'json')
  returnRawFetchResponse, // boolean (defaults to false)
  cache: {
    disable, // boolean (defaults to undefined — in other words, the cache is initialized by default)
    rootDirectory, // string (defaults to '__cache')
    name, // can be anything, e.g. 'scraper-name' (defaults to undefined)
    fileExtension, // can be anything, e.g. 'json' | 'html' (defaults to undefined)
  }
  retry: {
    attempts, // number (defaults to 0)
  }
  throttle: {
    interval, // number (defaults to 1000)
    limit, // number (defaults to 1)
  }
})

// Scraping a resource is now as simple as:
const resource = await httpbin.scrape('uuid') // = { "uuid": "6bb2..." }

// Using an absolute URL instead (this results in the the exact same behaviour):
const absolute = await httpbin.scrape('https://httpbin.org/uuid')

// Get the local path to a cached file:
const { path } = httpbin.getLocalPath('uuid') // = '__cache/uuid'

// Note: a file may or may not already exist at the returned path:
await readFile(path, 'utf8') // = returns an error if the resource has not yet been scraped
```

### Cache

```js
import { Scrape } from '@hbauer/scrape'

const baseURL = 'https://httpbin.org'

/**
 * Cache Options
 *
 * disable - the cache can be disabled (enabled by default)
 * rootDirectory - PROJECT_ROOT/${rootDirectory} (PROJECT_ROOT/__cache by default)
 * name - alternatively, PROJECT_ROOT/${rootDirectory}/${name} (no name by default)
 * fileExtension - PROJECT_ROOT/${rootDirectory}/${name}/path/file.json (no ext by default)
 */
const cacheOptions = {
  disable: false,
  rootDirectory: '__cache'
  name: 'httpbin'
  fileExtension: 'html'
}

const httpbin = Scrape.init(baseURL, { contentType: 'html', cache: cacheOptions })

const html = await httpbin.scrape('html') // alias for https://httpbin.org/html

const { path } = httpbin.getLocalPath('html') // = '__cache/httpbin/html'
const htmlFromFile = await readFile(path, 'utf8') // = '<!DOCTYPE html>...'
```
