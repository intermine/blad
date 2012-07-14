should = require 'should'
request = require 'request'
querystring = require 'querystring'

exported = require('../server.coffee')
app = exported.app
Blað = exported.Blað

# -------------------------------------------------------------------

class HasChildrenDocument extends Blað.Type

    render: (done) ->
        done
            'all':  @children()
            'lvl0': @children 0
            'lvl1': @children 1
        , false

Blað.types.HasChildrenDocument = HasChildrenDocument

# -------------------------------------------------------------------

url = 'http://127.0.0.1:1118'

describe "document that has children actions", ->

    before (done) ->
        app.start()
        
        setTimeout ( ->
            app.db (collection) ->
                collection.remove {}, (error, removed) ->
                    collection.find({}).toArray (error, results) ->
                        results.length.should.equal 0
                        done()
        ), 100

    describe "create parent document", ->
        it 'should return 201', (done) ->
            request.post
                'url': "#{url}/api/document"
                'form':
                    'type':   'HasChildrenDocument'
                    'name':   "parent"
                    'url':    "/group1"
            , (error, response, body) ->
                response.statusCode.should.equal 201
                done()

    describe "create child level 0", ->
        it 'should return 201', (done) ->
            request.post
                'url': "#{url}/api/document"
                'form':
                    'type':   'HasChildrenDocument'
                    'name':   "child0"
                    'url':    "/group1/child0"
            , (error, response, body) ->
                response.statusCode.should.equal 201
                done()

    describe "create child level 1", ->
        it 'should return 201', (done) ->
            request.post
                'url': "#{url}/api/document"
                'form':
                    'type':   'HasChildrenDocument'
                    'name':   "child1"
                    'url':    "/group1/rubbish/child1"
            , (error, response, body) ->
                response.statusCode.should.equal 201
                done()

    describe "retrieve the parent", ->
        it 'should give us all the children nested', (done) ->
            request.get "#{url}/group1"
            , (error, response, body) ->
                response.statusCode.should.equal 200

                # Parse response.
                children = JSON.parse(body)

                clean = []
                for doc in children.lvl0
                    delete doc._id ; clean.push doc

                clean.should.includeEql
                    "type": "HasChildrenDocument"
                    "name": "child0"
                    "url":  "/group1/child0"

                clean = []
                for doc in children.lvl1
                    delete doc._id ; clean.push doc

                clean.should.includeEql
                    "type": "HasChildrenDocument"
                    "name": "child1"
                    "url":  "/group1/rubbish/child1"

                done()