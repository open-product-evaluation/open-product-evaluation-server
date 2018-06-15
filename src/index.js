'use strict'

const { GraphQLServer } = require('graphql-yoga')
const { express: middleware } = require('graphql-voyager/middleware')
const {fileLoader, mergeTypes, mergeResolvers} = require('merge-graphql-schemas')
const path = require('path')

const schemaList = fileLoader(path.join(__dirname, './entities/*/schema.graphql'))
const resolverList = fileLoader(path.join(__dirname, './entities/*/resolvers.js'))

const server = new GraphQLServer({
    typeDefs : mergeTypes(schemaList, {all : true}),
    resolvers : mergeResolvers(resolverList, {all : true}),
    mocks : {
        DateTime: () => new Date()
    }
})

const schemaListClient = fileLoader(path.join(__dirname, '../oldSchemata/clientCalls/*/schemaClient.graphql'))

const serverClient = new GraphQLServer({
    typeDefs : mergeTypes(schemaListClient, {all : true}),
    resolvers : {},
    mocks : {
        DateTime: () => new Date()
    }
})

server.express.use('/voyager', middleware({endpointUrl: '/'}))
serverClient.express.use('/voyager', middleware({endpointUrl: '/'}))

server.start({port: 3000}, () => console.log('Server is running on http://localhost:3000'))
serverClient.start({port: 4000}, () => console.log('Server is running on http://localhost:4000'))