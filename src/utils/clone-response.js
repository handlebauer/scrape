/**
 * @param {Response} response
 */
export const cloneResponse = response => {
  /**
   * @type {{ text: Promise<string>, json: Promise<any> }}
   */
  const cache = {
    text: undefined,
    json: undefined,
  }
  return new Proxy(response, {
    get: (response, prop, receiver) => {
      if (prop === 'url') return response.url

      if (prop === 'text') {
        if (cache.text) return () => cache.text
        cache.text = response.text()
        return () => cache.text
      }

      if (prop === 'json') {
        if (cache.json) return () => cache.json
        cache.json = response.json()
        return () => cache.json
      }

      return Reflect.get(response, prop, receiver)
    },
  })
}

// /**
//  * @param {Response} response
//  * @param {string} data
//  */
// export const cloneResponse = (response, data) =>
//   new Proxy(response, {
//     get: (response, prop, receiver) => {
//       if (prop === 'url') return response.url

//       // eslint-disable-next-line require-await
//       if (prop === 'text') return async () => data

//       // eslint-disable-next-line require-await
//       if (prop === 'json') return async () => JSON.parse(data)

//       return Reflect.get(response, prop, receiver)
//     },
//   })
