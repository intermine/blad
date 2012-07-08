define [
    'chaplin',
    'views/base/view'
], (Chaplin, View) ->

    class CollectionView extends Chaplin.CollectionView

        # This class doesn’t inherit from the application-specific View class,
        # so we need to borrow the method from the View prototype:
        getTemplateFunction: View::getTemplateFunction