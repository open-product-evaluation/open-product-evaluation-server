const { withFilter } = require('graphql-yoga')
const shortID = require('shortid-36')
const { getMatchingId, createHashFromId } = require('../../store/id.store')
const { encodeClient, decode } = require('../../utils/auth')
const { ADMIN, USER, CLIENT } = require('../../utils/roles')
const { SUB_CLIENT } = require('../../subscriptions/channels')
const {
  getSortObjectFromRequest,
  getPaginationLimitFromRequest,
  getPaginationOffsetFromRequest,
  createClientFilter,
} = require('../../utils/filter')
const { PERMANENT, TEMPORARY } = require('../../utils/lifetime')
const { stringExists, arrayExists, propertyExists } = require('../../utils/checks')

const isOnlyDomainRemoval = (updateData) =>
  Object.keys(updateData).length === 1
  && propertyExists(updateData, 'domain')
  && updateData.domain === null

const isClientInDomainOfUser = async (client, userId, models) => {
  if (stringExists(client, 'domain')) {
    const [domain] = await models.domain.get({ _id: client.domain })
    return domain.owners.indexOf(userId) > -1
  }

  return false
}

const isUserAllowedToUpdateClient = async (client, userId, updateData, models) =>
  client.owners.indexOf(userId) > -1
  || (isOnlyDomainRemoval(updateData) && await isClientInDomainOfUser(client, userId, models))

module.exports = {
  SortableClientField: {
    CREATION_DATE: 'creationDate',
    LAST_UPDATE: 'lastUpdate',
    NAME: 'name',
    DOMAIN: 'domain',
    OWNERS: 'owners',
  },
  Query: {
    clients: async (parent, { sortBy, pagination, filterBy }, { request, models }) => {
      try {
        const { auth } = request

        const limit = getPaginationLimitFromRequest(pagination)
        const offset = getPaginationOffsetFromRequest(pagination)
        const sort = getSortObjectFromRequest(sortBy)
        const filter = await createClientFilter(auth.role, filterBy, models)

        switch (auth.role) {
          case ADMIN:
            return await models.client.get({ ...filter, code: { $ne: null } }, limit, offset, sort)

          case USER:
            return await models.client.get({
              ...filter,
              owners: auth.id,
            }, limit, offset, sort)

          case CLIENT:
            if (stringExists(auth.client, 'domain')) {
              if (filter.owners) { throw new Error('No Client found.') }
              return await models.client.get({
                ...filter,
                domain: auth.client.domain,
              })
            }
            return [auth.client]

          default:
            throw new Error('Not authorized or no permissions.')
        }
      } catch (e) {
        throw e
      }
    },
    client: async (parent, { clientID }, { request, models }) => {
      try {
        const { auth } = request
        const [client] = await models.client.get({ _id: clientID })

        switch (auth.role) {
          case ADMIN:
            return client

          case USER:
            if (client.owners.indexOf(auth.id) > -1) { return client }
            break

          case CLIENT:
            if (client.id === auth.id
              || (client.domain && client.domain === auth.client.domain)) { return client }
            break

          default:
            throw new Error('No permissions.')
        }
        throw new Error('No permissions.')
      } catch (e) {
        throw e
      }
    },
    clientAmount: async (parent, args, { request, models }) => {
      try {
        return (await module.exports.Query.clients(parent, args, { request, models })).length
      } catch (e) {
        return 0
      }
    },
  },
  Mutation: {
    loginClient: async (parent, { data: { email, code } }, { models, request }) => {
      try {
        const [user] = await models.user.get({ email: email.toLowerCase() })
        const [client] = await models.client.get({ owners: user.id, code })

        request.auth = {
          [CLIENT]: client,
          id: client.id,
          role: CLIENT,
        }

        return {
          client,
          code,
          token: encodeClient(createHashFromId(client.id), client.lifetime),
        }
      } catch (e) {
        throw e
      }
    },
    createPermanentClient: async (parent, { data: { name, email } }, { request, models }) => {
      try {
        const lowerCaseEmail = email.toLowerCase()
        const [user] = await models.user.get({ email: lowerCaseEmail })

        const newClient = {
          name,
          owners: [user.id],
          code: shortID.generate(),
          lifetime: PERMANENT,
        }

        const client = await models.client.insert(newClient)

        request.auth = {
          [CLIENT]: client,
          id: client.id,
          role: CLIENT,
        }

        return {
          client,
          token: encodeClient(createHashFromId(client.id)),
          code: client.code,
        }
      } catch (e) {
        throw e
      }
    },
    createTemporaryClient: async (parent, { data: { domainID } }, { request, models, answerStore }) => {
      try {
        const [domain] = await models.domain.get({ _id: domainID })

        if (!domain.activeSurvey) throw new Error('Domain must have an active Survey.')

        const newClient = {
          name: 'Temporary Client',
          domain: domain,
          lifetime: TEMPORARY,
        }

        const client = await models.client.insert(newClient)

        answerStore.createCacheEntryForClient(domain.activeSurvey, domain.id, client.id)

        request.auth = {
          CLIENT: client,
          id: client.id,
          role: CLIENT,
        }

        return {
          client,
          token: encodeClient(createHashFromId(client.id)),
        }
      } catch (e) {
        throw e
      }
    },
    updateClient: async (parent, { clientID, data }, { request, models }) => {
      async function updateClient() {
        const inputData = data
        if (inputData.domain) {
          await models.domain.get({ _id: inputData.domain })
        }

        const [newClient] = await models.client
          .update({ _id: clientID }, inputData)

        return { client: newClient }
      }

      try {
        const { auth } = request

        const [client] = await models.client.get({ _id: clientID })

        if (client.lifetime === TEMPORARY
          && (!propertyExists(data, 'domain') || data.domain !== null)) {
          throw new Error('Cant update temporary Clients (except for removing the domain).')
        }

        switch (auth.role) {
          case ADMIN:
            return updateClient()

          case USER: {
            if (await isUserAllowedToUpdateClient(client, auth.id, data, models)) { return updateClient() }

            break
          }

          case CLIENT:
            if (auth.id === client.id) { return updateClient() }
            break

          default:
            throw new Error('Not authorized or no permissions.')
        }
        throw new Error('Not authorized or no permissions.')
      } catch (e) {
        throw e
      }
    },
    deleteClient: async (parent, { clientID }, { request, models }) => {
      async function deleteClient() {
        await models.client.delete({ _id: clientID })
        return { success: true }
      }

      try {
        const { auth } = request
        const [client] = await models.client.get({ _id: clientID })
        switch (auth.role) {
          case ADMIN:
            return deleteClient()

          case USER:
            if (client.owners.indexOf(auth.id) > -1) { return deleteClient() }
            break

          case CLIENT:
            if (auth.id === client.id) { return deleteClient() }
            break

          default:
            throw new Error('Not authorized or no permissions.')
        }
        throw new Error('Not authorized or no permissions.')
      } catch (e) {
        throw e
      }
    },
    setClientOwner: async (parent, { clientID, email }, { models, request }) => {
      try {
        const { auth } = request
        const [clientFromID] = await models.client
          .get({ _id: clientID })

        if (clientFromID.lifetime === TEMPORARY) {
          throw new Error('Cant update temporary Clients.')
        }

        const lowerCaseEmail = email.toLowerCase()

        const setOwner = async () => {
          const [user] = await models.user.get({ email: lowerCaseEmail })

          if (clientFromID.owners.indexOf(user.id) > -1) {
            return { client: clientFromID }
          }

          const [updatedClient] = await models.client.update(
            { _id: clientID },
            { $push: { owners: user.id } },
          )

          return { client: updatedClient }
        }

        switch (auth.role) {
          case ADMIN:
            return setOwner()

          case USER:
            if (clientFromID.owners.indexOf(auth.id) > -1) {
              return setOwner()
            }
            break

          case CLIENT:
            if (auth.id === clientFromID.id) {
              return setOwner()
            }
            break

          default:
            throw new Error('Not authorized or no permissions.')
        }

        throw new Error('Not authorized or no permissions.')
      } catch (e) {
        throw e
      }
    },
    removeClientOwner: async (parent, { clientID, ownerID }, { models, request }) => {
      try {
        const { auth } = request
        const [clientFromID] = await models.client
          .get({ _id: clientID })

        if (clientFromID.lifetime === TEMPORARY) {
          throw new Error('Cant update temporary Clients.')
        }

        const removeOwner = async () => {
          if (clientFromID.owners.indexOf(ownerID) === -1) {
            return { success: true }
          }

          const [updatedClient] = await models.client.update(
            { _id: clientID },
            { $pull: { owners: ownerID } },
          )

          return { success: updatedClient.owners.indexOf(ownerID) === -1 }
        }

        switch (auth.role) {
          case ADMIN:
            return removeOwner()

          case USER:
            if (clientFromID.owners.indexOf(auth.id) > -1) {
              return removeOwner()
            }
            break

          case CLIENT:
            if (auth.id === clientFromID.id) {
              return removeOwner()
            }
            break

          default:
            throw new Error('Not authorized or no permissions.')
        }

        throw new Error('Not authorized or no permissions.')
      } catch (e) {
        throw e
      }
    },
  },
  Subscription: {
    clientUpdate: {
      async subscribe(rootValue, args, context) {
        if (!context.connection.context.Authorization) {
          throw new Error('Not authorized or no permissions.')
        }

        const auth = decode(context.connection.context.Authorization)
        const matchingAuthId = getMatchingId(auth.id)
        const { clientID } = args
        const [desiredClient] = await context.models.client.get({ _id: clientID })

        switch (auth.type) {
          case 'user': {
            if (!auth.isAdmin) {
              if (!desiredClient.owners.includes(matchingAuthId)) {
                throw new Error('Not authorized or no permissions.')
              }
            }
            break
          }

          case 'client': {
            if (clientID === matchingAuthId) { break }

            if (!desiredClient.domain) {
              throw new Error('Not authorized or no permissions.')
            }

            const clientsOfDomainOfDesiredClient = await context.models
              .client.get({ domain: desiredClient.domain })
            const clientIds = clientsOfDomainOfDesiredClient.map(client => client.id)

            if (!clientIds.includes(matchingAuthId)) {
              throw new Error('Not authorized or no permissions.')
            }
            break
          }

          default: throw new Error('Not authorized or no permissions.')
        }

        return withFilter(
          (__, ___, { pubsub }) => pubsub.asyncIterator(SUB_CLIENT),
          (payload, variables) => payload.clientUpdate
            .client.id === variables.clientID,
        )(rootValue, args, context)
      },
    },
  },
  Client: {
    owners: async (parent, args, { models, request }) => {
      const { auth } = request

      switch (auth.role) {
        case ADMIN:
          if (!arrayExists(parent, 'owners')) { return null }
          return models.user.get({ _id: { $in: parent.owners } })

        case USER:
          if (parent.owners.indexOf(auth.id) > -1) {
            if (!arrayExists(parent, 'owners')) { return null }
            return models.user.get({ _id: { $in: parent.owners } })
          }
          break

        case CLIENT:
          if (parent.id === auth.id) {
            if (!arrayExists(parent, 'owners')) { return null }
            return models.user.get({ _id: { $in: parent.owners } })
          }
          break

        default:
          throw new Error('Not authorized or no permissions.')
      }
      throw new Error('Not authorized or no permissions.')
    },
    domain: async (parent, args, { models }) => {
      if (!stringExists(parent, 'domain')) { return null }

      try {
        return (await models.domain.get({ _id: parent.domain }))[0]
      } catch (e) { return null }
    },
    code: async (parent, args, { models, request }) => {
      const { auth } = request
      if (!stringExists(parent, 'code')) { return null }

      switch (auth.role) {
        case ADMIN:
          return parent.code

        case USER:
          if (parent.owners.indexOf(auth.id) > -1) {
            return parent.code
          }
          break

        case CLIENT:
          if (parent.id === auth.id) {
            return parent.code
          }
          break

        default:
          throw new Error('Not authorized or no permissions.')
      }
      throw new Error('Not authorized or no permissions.')
    },
  },

}
