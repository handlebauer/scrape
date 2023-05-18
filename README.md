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
const pathToCachedFile = httpbin.getLocalPath('uuid') // = '__cache/uuid'

// Note: a file may or may not already exist at the returned path:
await readFile(pathToCachedFile, 'utf8') // = returns an error if the resource has not yet been scraped
```

### Cache

```js
import { Scrape } from '@hbauer/scrape'

const baseURL = 'https://httpbin.org'

// Pass
const cacheOptions = {
  disable: false, // by default, the cache is disabled
  rootDirectory: '__cache' // files will be written to PROJECT_ROOT/${rootDirectory} (you may wish to .gitignore this)
  name: 'httpbin' // alternatively, files can be written to PROJECT_ROOT/${rootDirectory}/${name}/
  fileExtension: 'html' // a file extension can also be appended, PROJECT_ROOT/${rootDirectory}/${name}/path/file.json
}

const httpbin = Scrape.init(baseURL, { contentType: 'html', cache: cacheOptions })

const html = await httpbin.scrape('html') // alias for https://httpbin.org/html

// Get the local path to a cached file:
const pathToCachedFile = httpbin.getLocalPath('html') // = '__cache/httpbin/html'
```
