/**
 * Created by sharadau on 17-06-2015.
 */
var scripts = document.getElementsByTagName("script")
var currentScriptPath = scripts[scripts.length-1].src;
angular.module("arcgis-map")
    .directive("arcgisHomeButton", ["$q","mapRegistry", function ($q,mapRegistry) {
        return {
            restrict:'E',
            scope:{
                mapid:"@"
            },
            // define an interface for working with this directive
            controller: function ($scope, $element, $attrs) {
                var mappromise = mapRegistry.get("myMapId");
                ///$element.attr("id","legendId")
                mappromise.then(function(map){
                    require([
                        'esri/dijit/HomeButton'], function (HomeButton) {
                        var homeButton = new HomeButton({
                            theme: "HomeButton",
                            map: map,
                            extent: null,
                            visible: true
                        }, "homeWidgetId");
                        homeButton.startup();
                    });

                });
            },
            templateUrl:currentScriptPath.substring(0, currentScriptPath.lastIndexOf('/') + 1)
            + 'templates/homeWidget.html'

        };
    }]);/**
 * Created by synerzip on 17/06/15.
 */
