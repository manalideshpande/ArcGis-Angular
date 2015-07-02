/**
 * Created by synerzip on 11/06/15.
 */


angular.module("arcgis-map")
    .directive("arcgisMap", ["$q", "$timeout", "$document", "mapRegistry", "$window", function ($q, $timeout, $document, mapRegistry, $window) {

        return {
            restrict: 'E',
            transclude: true,
            scope: {
                zoom: '=',
                center: '=',
                basemap: '@',
                options: '@',
                layers: '=',
                mapid: '@'

            },


            compile: function ($element, $attrs) {

                $element.append("<nav-bar leftwidget='arcgis-home-button'></nav-bar><div style='width:{{width}}px;height:{{height}}px;' id='myMapId'></div>");

                return function ($scope, $element, $attrs,controllers) {

                    $scope.$watch(function ($scope) {
                        return $element.parent().width();
                    }, function (newvalue) {
                        //mapRegistry.get($attrs.mapid);
                        $scope.width = $element.parent().width();

                    });

                    $scope.$watch(function ($scope) {
                        return $element.parent().height();
                    }, function (newvalue) {
                        $scope.height = $element.parent().height();

                    });

                    /**
                     * Deferred will be resolved when the map created
                     */
                    var mapDeferred = $q.defer();


                    // add this map to the registry
                    var deregister = mapRegistry._register("myMapId", mapDeferred);

                    // remove this from the registry when the scope is destroyed
                    $scope.$on('$destroy', deregister);
                    //}

                    var mapOptions = {slider:true};
                    /*Set mapoptions if it is set as attribute*/
                    if($attrs.zoom){
                        mapOptions.zoom = $attrs.zoom;
                    }
                    if ($attrs.center.lng && $attrs.center.lat) {
                        mapOptions.center = [$scope.center.lng, $scope.center.lat];
                    } else if($attrs.center){
                        mapOptions.center = $attrs.center;
                    }
                    if($attrs.basemap){
                        mapOptions.basemap = $scope.basemap;
                    }

                    /**
                     * Get options objects data
                     */
                    if ($attrs.options) {
                        $timeout(function () {
                            var options = JSON.parse($attrs.options);

                            /**
                             * Define Arcgis map's valid attributes
                             */
                            var validOptions = JSON.parse(JSON.stringify({
                                string: ['navigationMode', 'sliderOrientation', 'sliderPosition'],
                                bools: ['autoResize', 'displayGraphicsOnPan', 'fadeOnZoom', 'fitExtent', 'force3DTransforms', 'logo', 'nav',
                                    'optimizePanAnimation', 'showAttribution', 'showInfoWindowOnClick', 'slider', 'smartNavigation', 'wrapAround180'],
                                numeric: ['attributionWidth', 'maxScale', 'maxZoom', 'minScale', 'minZoom', 'resizeDelay', 'scale']
                            }));
                            /**
                             * Check key with valid options (via validOptions), if available, set value as option to map
                             */
                            angular.forEach(validOptions.bools, function (key) {
                                if (typeof options[key] !== 'undefined') {
                                    //console.log(options[key].toString() === 'true')
                                    mapOptions[key] = options[key].toString() === 'true';
                                }
                            });
                            angular.forEach(validOptions.numeric, function (key) {
                                if (options[key]) {
                                    //console.log(options[key])
                                    mapOptions[key] = options[key];
                                }
                            });
                            if (options.navigationMode && validOptions.string.indexOf('navigationMode') != -1) {
                                //console.log(validOptions.string.indexOf('navigationMode'))
                                if (options.navigationMode !== 'css-transforms' && options.navigationMode !== 'classic') {
                                    throw new Error('navigationMode must be \'css-transforms\' or \'classic\'.');
                                } else {
                                    mapOptions.navigationMode = options.navigationMode;
                                }
                            }
                            if (options.sliderOrientation && validOptions.string.indexOf('sliderOrientation') != -1) {
                                if (options.sliderOrientation !== 'horizontal' && options.sliderOrientation !== 'vertical') {
                                    throw new Error('sliderOrientation must be \'horizontal\' or \'vertical\'.');
                                } else {
                                    mapOptions.sliderOrientation = options.sliderOrientation;
                                }
                            }
                            if (options.sliderPosition && validOptions.string.indexOf('sliderPosition') != -1) {
                                //console.log(validOptions.string.indexOf('sliderPosition'))
                                var allowed = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];
                                if (allowed.indexOf(options.sliderPosition) < 0) {
                                    throw new Error('sliderPosition must be in ' + allowed);
                                } else {
                                    mapOptions.sliderPosition = options.sliderPosition;
                                }
                            }
                        }, 0);
                    }


                    /*Created esri map object using esri/map library*/
                    require(["esri/map"], function (Map, Scalebar) {

                        var map = new Map("myMapId", mapOptions);
                        //var deffered = mapRegistry.get($scope.mapid);
                        mapDeferred.resolve(map);


                        //Add ScaleBar if set
                        if ($attrs.scalebar == "true") {
                            require(["esri/dijit/Scalebar"], function (Scalebar) {
                                var scalebar = new Scalebar({
                                    map: map,
                                    scalebarStyle: "ruler",
                                    attachTo: "bottom-left"

                                });
                            });
                        }

                        //Overview Map
                        if ($attrs.overviewmap == "true") {
                            require(["esri/dijit/OverviewMap"], function (OverviewMap) {
                                var overviewMapDijit = new OverviewMap({
                                    map: map,
                                    attachTo: "top-right",
                                    visible: false

                                });
                                overviewMapDijit.startup();
                            });
                        }


                    });



                    mapRegistry.get("myMapId").then(function (map) {

                        //Set watch for basemap
                        $scope.$watch('basemap', function (newBasemap, oldBasemap) {
                            if (newBasemap !== oldBasemap) {
                                /**
                                 If basemap value is changed, update basemap
                                 */
                                map.setBasemap(newBasemap);
                            }
                        });


                        $scope.inputChangeFlag = false;

                        /**
                         * Set watch for zoom
                         */

                        /**
                         * Set watch for center
                         */
                        $scope.$watch(
                            function ($scope) {
                                return [$scope.center.lng, $scope.center.lat, $scope.zoom].join(',');
                            },
                            function (newCenter, oldCenter) {
                                if ($scope.inputChangeFlag) {
                                    return;
                                }
                                $scope.inputChangeFlag = true;
                                newCenter = newCenter.split(',');

                                if (newCenter[0] !== '' && newCenter[1] !== '' && newCenter[2] !== '') {
                                    map.centerAndZoom([parseFloat(newCenter[0]), parseFloat(newCenter[1])], newCenter[2]);
                                    //map.centerAt([parseFloat(newCenter[0]), parseFloat(newCenter[1])], map.spatialReference);
                                    $scope.inputChangeFlag = false;
                                }
                            });

                        map.on('extent-change', function (e) {
                            if ($scope.inputChangeFlag) {
                                return;
                            }
                            $scope.inputChangeFlag = true;
                            $scope.$apply(function () {
                                var geoCenter = map.geographicExtent.getCenter();
                                $scope.center.lng = geoCenter.x;
                                $scope.center.lat = geoCenter.y;
                                $scope.zoom = map.getZoom();

                                $timeout(function () {
                                    $scope.inputChangeFlag = false;
                                }, 0);
                            });
                        });


                        //How to rid it
                        $scope.$on("centerChangeEvent", function (event, size) {
                            map.resize();

                        });
                    });



                };

            },

            controller: function ($scope, $element, $attrs) {


                // method returns the promise that will be resolved with the map
                this.getMap = function () {
                    return mapRegistry.get("myMapId");
                };

                // adds the layer, returns the promise that will be resolved with the result of map.addLayer
                this.addLayer = function (url, layerName) {

                    mapRegistry.addLayer("myMapId", url);
                };

                this.addMapServiceLayer = function (url, layerName) {
                    mapRegistry.addMapServiceLayer("myMapId", url, layerName);
                };

            }

        };
    }]);

angular.module("arcgis-map")
    .directive('navBar', function () {
        return {
            restrict: 'E',
            require: '^arcgisMap',
            template: '<div class="navbar-fixed search-navBar">' +
            '<nav class="white search-container">' +
            '<div class="nav-wrapper">' +
            '<div class="row">' +
            '<div class="input-field">' +
            '<input type="search" id="search-field" class="field" />' +
            '<label id="search-field-label" for="search-field"></label>' +
            '<div class="right-widget-container" id="right-widget-container"></div>'+
            '<i class="right-widget mdi-maps-my-location"></i>' +
            '<i class="right-widget mdi-navigation-more-vert"></i>' +
            '</div>' +
            '</div>' +
            '</div>' +
            ' </nav>' +
            '</div>',
            link: function (scope, elem, attrs, parentCtrl) {
                scope.addLeftWidget(attrs.leftwidget)
                //scope.addRightWidget(attrs.rightwidget)
            },
            controller: function ($scope, $element, $compile) {
                $scope.addLeftWidget = function (directiveDom) {
                    var el = $compile( '<' + directiveDom +'></'+ directiveDom +'>' )( $scope );
                    $element.find('#search-field-label').html(el);
                };

                /*$scope.addRightWidget = function (directiveDom) {
                    var el = $compile( '<' + directiveDom +'></'+ directiveDom +'>' )( $scope );
                    $element.find('#right-widget-container').html(el);
                };*/
            },
        }
    })
