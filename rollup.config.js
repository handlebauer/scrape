import pkg from './package.json' assert { type: 'json' }

const main = './src/index.js'
const utils = './src/utils/index.js'
const parameters = './src/parameters/index.js'
const errors = './src/errors/index.js'

const external = [
  '@hbauer/local-file/parameters.js',
  ...Object.keys(pkg.dependencies),
]

// eslint-disable-next-line import/no-default-export
export default [
  {
    input: main,
    external,
    output: [
      { file: pkg.exports['.'].require, format: 'cjs' },
      { file: pkg.exports['.'].import, format: 'esm' },
    ],
  },
  {
    input: utils,
    external,
    output: [
      { file: pkg.exports['./utils.js'].require, format: 'cjs' },
      { file: pkg.exports['./utils.js'].import, format: 'esm' },
    ],
  },
  {
    input: parameters,
    external,
    output: [
      { file: pkg.exports['./parameters.js'].require, format: 'cjs' },
      { file: pkg.exports['./parameters.js'].import, format: 'esm' },
    ],
  },
  {
    input: errors,
    external,
    output: [
      { file: pkg.exports['./errors.js'].require, format: 'cjs' },
      { file: pkg.exports['./errors.js'].import, format: 'esm' },
    ],
  },
]
