import test from 'ava'
import { z } from 'zod'
import { ScrapeError } from './ScrapeError.js'
import { formatZodError } from './format-zod-error.js'

test('Should return an error with a title if provided', t => {
  // @ts-ignore
  const error = new ScrapeError('title')

  t.is(error.message, 'title')
})

test('Should return an error with a message if provided', t => {
  const error = new ScrapeError('title', { message: 'message' })

  t.is(error.message, 'title: message')
})

test("Should return an error including a parent's message if provided", t => {
  let parent = new Error('parent')
  let error = new ScrapeError('title', { message: 'message', parent })

  t.is(error.message, 'title: message' + ' ' + '[' + parent.message + ']')
})

test('Should automatically format ZodErrors', t => {
  const ThrottleOptions = z.object({
    limit: z.number().int().gte(0).default(1),
    interval: z.number().int().gte(0).default(1000),
  })

  const throttleOptions = {
    limit: -1, // should be > -1,
    interval: 'interval', // should not be a string
  }

  const validation = ThrottleOptions.safeParse(throttleOptions)

  if (validation.success === false) {
    const zodError = validation.error

    const error = new ScrapeError('title', {
      message: 'message',
      parent: zodError,
    })

    t.is(error.message, 'title: message' + formatZodError(zodError))
  } else {
    t.fail('validation.success should be false but it was not')
  }
})
