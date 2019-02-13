let env = (process.env.NODE_ENV || 'dev').toString() // 'dev' or 'test'
const path = require('path')
const shortID = require('shortid')

const secret = shortID.generate()

const dev = {
  app: {
    rootURL: process.env.ROOT_URL
      || process.argv.includes('--https') ? 'https://localhost' : 'http://localhost',
    port: parseInt(process.env.DEV_APP_PORT, 10) || 3000,
    jwtSecret: process.env.DEV_SECRET || secret,
    imageFolder: process.env.IMAGE_FOLDER || 'static/images',
    defaultFolder: process.env.DEFAULT_FOLDER || 'static/images/default',
    clientCacheTime: process.env.CLIENT_CACHE_TIME || 1000 * 60 * 30,
    questionCacheTime: process.env.QUESTION_CACHE_TIME || 1000 * 60,
    playground: process.env.PLAYGROUND || '/playground',
    endpoint: process.env.endpoint || '/graphql',
  },
  db: {
    host: process.env.DEV_DB_HOST || 'localhost',
    port: parseInt(process.env.DEV_DB_PORT, 10) || 27017,
    name: process.env.DEV_DB_NAME || 'openproductevaluation',
  },
  seeder: {
    database: {
      host: process.env.DEV_DB_HOST || 'localhost',
      port: parseInt(process.env.DEV_DB_PORT, 10) || 27017,
      name: process.env.DEV_DB_NAME || 'openproductevaluation',
    },
    inputPath: path.resolve(__dirname, './seeds/data'),
    dropDatabase: true,
  },
}

const test = {
  app: {
    rootURL: process.env.ROOT_URL
      || process.argv.includes('--https') ? 'https://localhost' : 'http://localhost',
    port: parseInt(process.env.TEST_APP_PORT, 10) || 3000,
    jwtSecret: 'testsecret',
    imageFolder: process.env.IMAGE_FOLDER || 'static/images',
    defaultFolder: process.env.DEFAULT_FOLDER || 'static/images/default',
    clientCacheTime: process.env.CLIENT_CACHE_TIME || 1000 * 60 * 30,
    questionCacheTime: process.env.QUESTION_CACHE_TIME || 1000 * 60,
    playground: process.env.PLAYGROUND || '/playground',
    endpoint: process.env.endpoint || '/graphql',
  },
  db: {
    host: process.env.TEST_DB_HOST || 'localhost',
    port: parseInt(process.env.TEST_DB_PORT, 10) || 27017,
    name: process.env.TEST_DB_NAME || 'openproductevaluation',
  },
  seeder: {
    database: {
      host: process.env.TEST_DB_HOST || 'localhost',
      port: parseInt(process.env.TEST_DB_PORT, 10) || 27017,
      name: process.env.TEST_DB_NAME || 'openproductevaluation',
    },
    inputPath: path.resolve(__dirname, './seeds/data'),
    dropDatabase: true,
  },
}

const config = {
  dev,
  test,
}

if (config[env] === undefined) {
  env = 'test'
}

module.exports = config[env]
