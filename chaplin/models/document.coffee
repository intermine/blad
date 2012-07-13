define [
    'chaplin'
], (Chaplin) ->

    class Document extends Chaplin.Model

        idAttribute: "_id"

        defaults:
            'type': 'BasicDocument'

        url: -> '/api/document?_id=' + @get '_id'

        # Modify the attributes of a document on presenter code.
        getAttributes: -> _.extend(@attrDescription(), @attributes)

        # Format labels in a description, accessed with `_description`.
        attrDescription: ->
            return {} unless @get('description')?
            
            '_description': @get('description').replace /label:(\S*)/g, '<span class="radius label">$1</span>'