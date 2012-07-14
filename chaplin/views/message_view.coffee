define [
    'chaplin'
    'templates/message'
], (Chaplin) ->

    class MessageView extends Chaplin.View

        # Template name on global `JST` object.
        templateName: 'message.eco'

        # Automatically prepend before the DOM on render.
        container: '#app'

        containerMethod: 'prepend'

        # Automatically render after initialization
        autoRender: true

        getTemplateFunction: -> JST[@templateName]

        # Not model, but params babe.
        getTemplateData: -> @params

        # Save these.
        initialize: (@params) -> super

        # Events.
        afterRender: ->
            super
            @delegate 'click', @dispose