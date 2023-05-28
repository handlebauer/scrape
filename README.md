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

const httpbin = await Scrape.init(baseURL, {
  contentType, // 'json' | 'html' (defaults to 'json')
  returnRawFetchResponse, // boolean (defaults to false)
  cache: {
    enabled, // boolean (defaults to true)
    rootDirectory, // string (defaults to '__cache')
    name, // can be anything, e.g. 'scraper-name' (defaults to the hostname of the baseURL)
    fileExtension, // can be anything, e.g. 'json' | 'html' (defaults to undefined)
  }
  retry: {
    attempts, // number (defaults to 0)
  }
  throttle: {
    interval, // number (in milliseconds; defaults to 1000)
    limit, // number (defaults to 1)
  }
})

// Scraping a resource is now as simple as:
const file = await httpbin.scrape('uuid')

// Using an absolute URL instead (this results in the the exact same behaviour):
const absolute = await httpbin.scrape('https://httpbin.org/uuid')

// Future calls to the same URL will return from the cache:
const cachedFile = await httpbin.scrape('uuid')

assert.equal(cachedFile.attributes.fromCache, true)

// You can force invalidate a file:
const forceInvalidated = await httpbin.scrape('uuid', { invalidate: { force: true } }) // always re-fetches

assert.equal(cachedFile.attributes.fromCache, false)

// Or invalidate based on how old the file is
const expired = await httpbin.scrape('uuid', { invalidate: { expiredAfter: [1, 'week'] } })

assert.equal(cachedFile.attributes.expired, true)
```

### Cache

```js
import { Scrape } from '@hbauer/scrape'

const baseURL = 'https://httpbin.org'

/**
 * Cache Options
 *
 * enabled - the cache can be enabled or disabled (enabled by default)
 * rootDirectory - PROJECT_ROOT/${rootDirectory}
 * name - alternatively, PROJECT_ROOT/${rootDirectory}/${name}
 * fileExtension - PROJECT_ROOT/${rootDirectory}/${name}/path/file.${fileExtension}
 */
const httpbin = Scrape.init(baseURL, { contentType: 'html' })

const file = await httpbin.scrape('html') // alias for https://httpbin.org/html

// Get the local path to a cached file:
const { fullPath } = await httpbin.cache.getPaths('html') // = '__cache/httpbin.org/html'

// Get the cached file
const cachedFile = await httpbin.cache.get('html')

assert.equal(file.data, cachedFile.data)
```
