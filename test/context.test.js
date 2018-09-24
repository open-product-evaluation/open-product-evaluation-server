const users = require('../seeds/data/user/user')
const surveys = require('../seeds/data/survey/survey')
const questions = require('../seeds/data/question/question')
const contexts = require('../seeds/data/context/context')
const { seedDatabase } = require('mongo-seeding')
const config = require('../config')
const request = require('./requesthelper')
const { getSeedID } = require('./helpers')

/* Functions for Querys */

function createContextQuery(name) {
  return {
    query: `mutation {
      createContext(data: {name: "${name}"}) {
        context {
          id
          name
          activeQuestion: id
          activeSurvey: id
          owners {
            id
          }
          devices {
            id
          }
          states {
            key
          }
        }
      }
    }`,
  }
}

function updateContextQuery(contextID, contextName, activeSurvey, activeQuestion, owners) {
  return {
    query: `mutation {
      updateContext(contextID: "${contextID}", data: {name: "${contextName}", activeQuestion: "${activeQuestion}", activeSurvey: "${activeSurvey}", owners: ${JSON.stringify(owners)}}) {
        context {
          id
          name
          activeQuestion: id
          activeSurvey: id
          owners {
            id
          }
          devices {
            id
          }
          states {
            key
          }
        }
      }
    }`,
  }
}

function deleteContextQuery(contextID) {
  return {
    query: `mutation {
      deleteContext(contextID: "${contextID}") {
        success
      }
    }`,
  }
}

function contextsQuery() {
  return {
    query: `{
      contexts {
        id
        name
        activeQuestion: id
        activeSurvey: id
        owners {
          id
        }
        devices {
          id
        }
        states {
          key
        }
      }
    }`,
  }
}

function contextQuery(contextID) {
  return {
    query: `{
      context(contextID: "${contextID}") {
        id
        name
        activeQuestion: id
        activeSurvey: id
        owners {
          id
        }
        devices {
          id
        }
        states {
          key
        }
      }
    }`,
  }
}

/* Tests */

describe('Context', () => {
  describe('Admin', async () => {
    let jwtToken = ''
    beforeAll(async () => {
      await seedDatabase(config.seeder)
      const expected = users[1]
      const query = {
        query: `mutation {
          login(data: {email: "${expected.email}", password: "password"}) {
            token
            user {
              id
              firstName
              lastName
              email
            }
          }
        }`,
      }
      const { data, errors } = await request.anon(query)
      data.login.token.should.be.a('string')
      expect(errors).toBeUndefined()
      const { login: { token } } = data
      jwtToken = token
    })
    it('schould return all contexts [Query]', async () => {
      const query = contextsQuery()
      const { data, errors } = await request.user(query, jwtToken)
      expect(errors).toBeUndefined()
      expect(data).toMatchSnapshot()
    })
    it('schould return context owned by User [Query]', async () => {
      const context = contexts[0]
      const query = contextQuery(getSeedID(context))
      const { data, errors } = await request.user(query, jwtToken)
      expect(errors).toBeUndefined()
      expect(data).toMatchSnapshot()
    })
    it('schould return context not owned by User [Query]', async () => {
      const context = contexts[1]
      const query = contextQuery(getSeedID(context))
      const { data, errors } = await request.user(query, jwtToken)
      expect(errors).toBeUndefined()
      expect(data).toMatchSnapshot()
    })
    it('schould create context [Mutation]', async () => {
      const query = createContextQuery('TestContext')
      const res = await request.user(query, jwtToken)
      const { data, errors } = res
      console.log(errors)
      expect(data).toMatchSnapshot()
      expect(errors).toBeUndefined()
    })
    it('schould update context owned by User [Mutation]', async () => {
      const context = contexts[0]
      const question = questions[0]
      const survey = surveys[1]
      const user = users[0]
      const query = updateContextQuery(getSeedID(context), 'RenamedTestContext', getSeedID(question), getSeedID(survey), [getSeedID(user)])
      const { data, errors } = await request.user(query, jwtToken)
      expect(errors).toBeUndefined()
      expect(data).toMatchSnapshot()
    })
    it('schould update context not owned by User [Mutation]', async () => {
      const context = contexts[1]
      const question = questions[0]
      const survey = surveys[1]
      const user = users[0]
      const query = updateContextQuery(getSeedID(context), 'RenamedTestContext', getSeedID(question), getSeedID(survey), [getSeedID(user)])
      const { data, errors } = await request.user(query, jwtToken)
      expect(errors).toBeUndefined()
      expect(data).toMatchSnapshot()
    })
    it('schould delete context owned by user [Mutation]', async () => {
      const context = contexts[0]
      const query = deleteContextQuery(getSeedID(context))
      const { data, errors } = await request.user(query, jwtToken)
      expect(errors).toBeUndefined()
      expect(data.deleteContext.success).toBe(true)
    })
    it('schould delete context not owned by user [Mutation]', async () => {
      const context = contexts[1]
      const query = deleteContextQuery(getSeedID(context))
      const { data, errors } = await request.user(query, jwtToken)
      expect(errors).toBeUndefined()
      expect(data.deleteContext.success).toBe(true)
    })
  })
  describe('User', async () => {
    let jwtToken = ''
    beforeAll(async () => {
      await seedDatabase(config.seeder)
      const expected = users[0]
      const query = {
        query: `mutation {
          login(data: {email: "${expected.email}", password: "password"}) {
            token
            user {
              id
              firstName
              lastName
              email
            }
          }
        }`,
      }
      const { data, errors } = await request.anon(query)
      data.login.token.should.be.a('string')
      expect(errors).toBeUndefined()
      const { login: { token } } = data
      jwtToken = token
    })
    it('schould return all contexts [Query]', async () => {
      const query = contextsQuery()
      const { data, errors } = await request.user(query, jwtToken)
      expect(errors).toBeUndefined()
      expect(data).toMatchSnapshot()
    })
    it('schould return context owned by User [Query]', async () => {
      const context = contexts[0]
      const query = contextQuery(getSeedID(context))
      const { data, errors } = await request.user(query, jwtToken)
      expect(errors.length).toBe(1)
      expect(errors[0].path).toEqual(['context', 'owners'])
      expect(data).toMatchSnapshot()
    })
    it('schould not return context not owned by User [Query]', async () => {
      const context = contexts[1]
      const query = contextQuery(getSeedID(context))
      const { data, errors } = await request.user(query, jwtToken)
      expect(data).toBeNull()
      expect(errors.length).toBeGreaterThan(0)
    })
    it('schould create context [Mutation]', async () => {
      const query = createContextQuery('TestContext')
      const res = await request.user(query, jwtToken)
      const { data, errors } = res
      expect(data).toMatchSnapshot()
      expect(errors).toBeUndefined()
    })
    it('schould update context owned by User [Mutation]', async () => {
      const context = contexts[0]
      const question = questions[0]
      const survey = surveys[1]
      const user = users[0]
      const query = updateContextQuery(getSeedID(context), 'RenamedTestContext', getSeedID(question), getSeedID(survey), [getSeedID(user)])
      const { data, errors } = await request.user(query, jwtToken)
      expect(errors).toBeUndefined()
      expect(data).toMatchSnapshot()
    })
    it('schould not update context not owned by User [Mutation]', async () => {
      const context = contexts[1]
      const question = questions[0]
      const survey = surveys[1]
      const user = users[0]
      const query = updateContextQuery(getSeedID(context), 'RenamedTestContext', getSeedID(question), getSeedID(survey), [getSeedID(user)])
      const { data, errors } = await request.user(query, jwtToken)
      expect(data).toBeNull()
      expect(errors.length).toBeGreaterThan(0)
    })
    it('schould delete context owned by user [Mutation]', async () => {
      const context = contexts[0]
      const query = deleteContextQuery(getSeedID(context))
      const { data, errors } = await request.user(query, jwtToken)
      expect(errors).toBeUndefined()
      expect(data.deleteContext.success).toBe(true)
    })
    it('schould not delete context not owned by user [Mutation]', async () => {
      const context = contexts[1]
      const query = deleteContextQuery(getSeedID(context))
      const { data, errors } = await request.user(query, jwtToken)
      expect(data).toBeNull()
      expect(errors.length).toBeGreaterThan(0)
    })
  })
  describe.skip('Device', async () => {
    let jwtToken = ''
    beforeAll(async () => {
      await seedDatabase(config.seeder)
      const query = {
        query: `mutation{createDevice(data:{name:"TestDevice"}){
          token
       }}`,
      }
      const { data, errors } = await request.anon(query)
      data.createDevice.token.should.be.a('string')
      expect(errors).toBeUndefined()
      const { createDevice: { token } } = data
      jwtToken = token
    })
    it('schould return contexts assigned to [Query]', async () => {
      const query = contextsQuery()
      const { data, errors } = await request.user(query, jwtToken)
      expect(errors).toBeUndefined()
      expect(data.deleteContext.success).toBe(true)
    })
    it('schould return context assigned to [Query]', async () => {
      const device = contexts[0]
      const query = contextQuery(getSeedID(device))
      const { data, errors } = await request.user(query, jwtToken)
      expect(errors).toBeUndefined()
      expect(data.deleteContext.success).toBe(true)
    })
    it('schould not return context not assigned to [Query]', async () => {
      const device = contexts[0]
      const context = contexts[0]
      const user = users[0]
      const query = updateContextQuery(getSeedID(device), 'RenamedTestDevice', getSeedID(context), [getSeedID(user)])
      const { data, errors } = await request.user(query, jwtToken)
      expect(data).toBeNull()
      expect(errors.length).toBeGreaterThan(0)
    })
    it('schould not delete device [Mutation]', async () => {
      const device = contexts[3]
      const query = deleteContextQuery(getSeedID(device))
      const { data, errors } = await request.user(query, jwtToken)
      expect(data).toBeNull()
      expect(errors.length).toBeGreaterThan(0)
    })
  })
})
