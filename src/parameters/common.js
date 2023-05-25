import { z } from 'zod'
import { removeSlashes } from '@hbauer/convenience-functions'
import { fileAgeDuration } from '@hbauer/local-file/parameters.js'

export const baseURL = z
  .string()
  .nonempty({ message: 'baseURL must not be empty' })
  .url({ message: 'baseURL must be a valid URL' })
  .transform(removeSlashes)
export const href = z.string().nonempty({ message: 'href must not be empty' })
export const contentType = z.enum(['json', 'html']).default('json')
export const returnRawResponse = z.boolean().default(false)

export const cacheOptions = z
  .object({
    rootDirectory: z.string().optional(),
    name: z.string().optional(),
    fileExtension: z
      .string()
      .optional()
      .transform(string => string?.toLowerCase()),
    enabled: z.boolean().default(true),
  })
  .default({ enabled: true })

export const retryNumber = z.number().int().gte(0).default(0)

export const retryOptions = z
  .object({ number: retryNumber })
  .default({ number: 0 })

export const throttleLimit = z.number().int().gte(0).default(1)
export const throttleInterval = z.number().int().gte(0).default(1000)

export const throttleOptions = z
  .object({ limit: throttleLimit, interval: throttleInterval })
  .default({ limit: 1, interval: 1000 })

export const options = z
  .object({
    contentType,
    returnRawResponse,
    cache: cacheOptions,
    retry: retryOptions,
    throttle: throttleOptions,
  })
  .default({})

export const invalidate = z
  .object({
    force: z.boolean().optional().default(false),
    after: fileAgeDuration.optional(),
  })
  .default({ force: false })

export const skipCache = z.boolean().default(false)
export const allowDistinctHref = z.boolean().default(false)

export const scrapeOptionsSchema = z.object({
  invalidate,
  skipCache,
  allowDistinctHref,
})
export const scrapeOptionsKeys = /** @type {const} */ ([
  'invalidate',
  'skipCache',
  'allowDistinctHref',
])
export const scrapeOptions = scrapeOptionsSchema.default({})

export const scrapeRetry = z
  .object({
    attempts: z.number().int().gte(0).default(0),
    error: z.any(),
  })
  .default({
    attempts: 0,
  })

export const handlerType = z.enum(['request', 'response', 'failedRequest'])
