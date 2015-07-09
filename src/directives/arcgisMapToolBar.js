/**
 * Created by Manali on 3/7/15.
 */

var scripts = document.getElementsByTagName("script");
var currentScriptPath = scripts[scripts.length-1].src;
angular.module("arcgis-map")
    .directive('arcgisMapToolBar', function () {
        return {
            restrict: 'E',
            require: '^arcgisMap',
            transclude: true,
            templateUrl:currentScriptPath.substring(0, currentScriptPath.lastIndexOf('/')) +'/'
            + 'templates/arcgisMapToolBar.html'
        }
    })