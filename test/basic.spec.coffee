should = require 'should'
request = require 'request'
querystring = require 'querystring'

exported = require('../server.coffee')
app = exported.app
Blað = exported.Blað

# -------------------------------------------------------------------

class BasicDocument extends Blað.Type

    # Render as JSON as is.
    render: (done) ->
        done
            'type': @type
            'name': @name
            'url':  @url
        , false

Blað.types.BasicDocument = BasicDocument

# -------------------------------------------------------------------

url = 'http://127.0.0.1:1118'

describe "basic document actions", ->

    before (done) ->
        app.start()
        
        setTimeout ( ->
            app.db (collection) ->
                collection.remove {}, (error, removed) ->
                    collection.find({}).toArray (error, results) ->
                        results.length.should.equal 0
                        done()
        ), 100

    describe "create document", ->
        it 'should return 201', (done) ->
            for i in [ 0...2 ] then do (i) ->
                request.post
                    'url': "#{url}/api/document"
                    'form':
                        'type': 'BasicDocument'
                        'name': "document-#{i}"
                        'url':  "/documents/#{i}"
                , (error, response, body) ->
                    done(error) if error

                    response.statusCode.should.equal 201
                    if i is 1 then done()

        it 'should be able to retrieve the document', (done) ->
            for i in [ 0...2 ] then do (i) ->
                request.get "#{url}/documents/#{i}"
                , (error, response, body) ->
                    done(error) if error

                    response.statusCode.should.equal 200
                    response.headers['content-type'].should.equal 'application/json'
                    body.should.equal JSON.stringify
                        'type': 'BasicDocument'
                        'name': "document-#{i}"
                        'url':  "/documents/#{i}"
                    
                    if i is 1 then done()

    describe "retrieve all documents", ->
        it 'should get all of them', (done) ->
            request.get "#{url}/api/documents"
            , (error, response, body) ->
                done(error) if error

                response.statusCode.should.equal 200

                # Parse documents.
                documents = JSON.parse body

                documents.length.should.equal 2

                clean = []
                for doc in documents
                    delete doc._id ; clean.push doc

                clean.should.includeEql
                    "type": "BasicDocument"
                    "name": "document-0"
                    "url":  "/documents/0"
                clean.should.includeEql
                    "type": "BasicDocument"
                    "name": "document-1"
                    "url":  "/documents/1"

                done()