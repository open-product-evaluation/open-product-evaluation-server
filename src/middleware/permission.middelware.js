const {
  rule, shield, or, allow,
} = require('graphql-shield')
const { PERMANENT } = require('../utils/lifetime')

const { ADMIN, USER, CLIENT } = require('../utils/roles')

const isAuthenticated = rule()(async (parent, args, { request }) => request.auth && request.auth !== null)

const isAdmin = rule()(async (parent, args, { request }) => request.auth.role === ADMIN)

const isUser = rule()(async (parent, args, { request }) => request.auth.role === USER)

const isClient = rule()(async (parent, args, { request }) => request.auth.role === CLIENT)

const isPermanentClient = rule()(async (parent, args, { request }) =>
  request.auth.role === CLIENT && request.auth.client.lifetime === PERMANENT)


const permissions = shield({
  Query: {
    domains: or(isAdmin, isUser, isPermanentClient),
    domain: isAuthenticated,
    state: isAuthenticated,
    domainAmount: isAuthenticated,
    clients: isAuthenticated,
    client: isAuthenticated,
    clientAmount: isAuthenticated,
    surveys: or(isAdmin, isUser),
    survey: or(isAdmin, isUser),
    surveyAmount: or(isAdmin, isUser),
    users: or(isAdmin, isUser),
    user: or(isAdmin, isUser),
    userAmount: or(isAdmin, isUser),
    votes: isAuthenticated,
    voteAmount: isAuthenticated,
  },
  Mutation: {
    createDomain: or(isAdmin, isUser),
    updateDomain: isAuthenticated,
    deleteDomain: or(isAdmin, isUser),
    setDomainOwner: or(isAdmin, isUser),
    removeDomainOwner: or(isAdmin, isUser),
    setState: isAuthenticated,
    removeState: isAuthenticated,
    loginClient: allow,
    createPermanentClient: allow,
    createTemporaryClient: allow,
    updateClient: or(isAdmin, isUser, isClient),
    deleteClient: isAuthenticated,
    setClientOwner: or(isAdmin, isUser, isPermanentClient),
    removeClientOwner: or(isAdmin, isUser, isPermanentClient),
    setSurveyPreviewImage: or(isAdmin, isUser),
    removeSurveyPreviewImage: or(isAdmin, isUser),
    createQuestion: or(isAdmin, isUser),
    updateQuestion: or(isAdmin, isUser),
    deleteQuestion: or(isAdmin, isUser),
    createItem: or(isAdmin, isUser),
    updateItem: or(isAdmin, isUser),
    deleteItem: or(isAdmin, isUser),
    setItemImage: or(isAdmin, isUser),
    removeItemImage: or(isAdmin, isUser),
    createLabel: or(isAdmin, isUser),
    updateLabel: or(isAdmin, isUser),
    deleteLabel: or(isAdmin, isUser),
    setLabelImage: or(isAdmin, isUser),
    removeLabelImage: or(isAdmin, isUser),
    createChoice: or(isAdmin, isUser),
    updateChoice: or(isAdmin, isUser),
    deleteChoice: or(isAdmin, isUser),
    setChoiceImage: or(isAdmin, isUser),
    removeChoiceImage: or(isAdmin, isUser),
    createSurvey: or(isAdmin, isUser),
    updateSurvey: or(isAdmin, isUser),
    deleteSurvey: or(isAdmin, isUser),
    createUser: allow,
    updateUser: or(isAdmin, isUser),
    deleteUser: or(isAdmin, isUser),
    login: allow,
    setAnswer: isClient,
    removeAnswer: isClient,
  },
  Domain: {
    owners: or(isAdmin, isUser),
  },
  Client: {
    owners: isAuthenticated,
  },
})

module.exports = permissions
