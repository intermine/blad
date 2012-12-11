should = require 'should'
request = require 'request'
querystring = require 'querystring'

{ start, blað } = require('../blad.coffee')

config = 'env': 'test', 'browserid': 'hashes': [ '@dummy' ]

# -------------------------------------------------------------------

marked = require 'marked'

class MarkdownDocument extends blað.Type

    render: (done) ->
        done
            'html': marked @markup
        , false

blað.types.MarkdownDocument = MarkdownDocument

# -------------------------------------------------------------------

url = 'http://127.0.0.1'

describe "markdown document actions", ->

    before (done) ->
        start config, null, (service) ->
            service.db (collection) ->
                collection.remove {}, (error, removed) ->
                    collection.find({}).toArray (error, results) ->
                        results.length.should.equal 0
                        # Set the service port on the main url.
                        url = [ url , service.server.address().port ].join(':')
                        # Callback.
                        done()

    describe "create document", ->
        it 'should return 201', (done) ->
            request.post
                'url': "#{url}/api/document"
                'form':
                    'type':   'MarkdownDocument'
                    'name':   "markdown"
                    'url':    "/documents/markdown"
                    'markup': "__hello__"
                    'public': true
                'headers':
                    'x-blad-apikey': '@dummy'
            , (error, response, body) ->
                response.statusCode.should.equal 201
                done()

        it 'should be able to retrieve the document', (done) ->
            request.get "#{url}/documents/markdown"
            , (error, response, body) ->
                done(error) if error

                response.statusCode.should.equal 200
                response.headers['content-type'].should.equal 'application/json'
                body.should.equal JSON.stringify
                    'html': "<p><strong>hello</strong></p>\n"
                
                done()

    describe "retrieve all documents", ->
        it 'should get all of them', (done) ->
            request.get
                'url': "#{url}/api/documents"
                'headers':
                    'x-blad-apikey': '@dummy'
            , (error, response, body) ->
                response.statusCode.should.equal 200

                # Parse documents.
                documents = JSON.parse body

                documents.length.should.equal 1

                delete documents[0]._id
                delete documents[0].modified

                documents.should.includeEql
                    'type':   'MarkdownDocument'
                    "name":   "markdown"
                    "url":    "/documents/markdown"
                    "markup": "__hello__"
                    'public': true

                done()