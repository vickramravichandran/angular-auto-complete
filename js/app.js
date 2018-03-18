if (!String.prototype.startsWith) {
    String.prototype.startsWith = function (searchString, position) {
        position = position || 0;
        return this.substr(position, searchString.length) === searchString;
    };
}

if (!String.prototype.includes) {
    String.prototype.includes = function (search, start) {
        'use strict';
        if (typeof start !== 'number') {
            start = 0;
        }

        if (start + search.length > this.length) {
            return false;
        } else {
            return this.indexOf(search, start) !== -1;
        }
    };
}

(function () {
    'use strict';

    angular
        .module('mainApp', ['autoCompleteModule'])
        .controller('SimpleListCtrl', SimpleListCtrl)
        .controller('CustomListUsingTemplateCtrl', CustomListUsingTemplateCtrl)
        .controller('SimpleListRemoteDataCtrl', SimpleListRemoteDataCtrl)
        .controller('SimplePagedListRemoteDataCtrl', SimplePagedListRemoteDataCtrl)
        .controller('ActivateOnFocusCtrl', ActivateOnFocusCtrl)
        .controller('CustomListUsingTemplateUrlCtrl', CustomListUsingTemplateUrlCtrl)
        .controller('RemoteDataUsingRenderItemCtrl', RemoteDataUsingRenderItemCtrl)
        .directive('ngPrism', function () {
            return {
                restrict: 'A',
                link: function (scope, element, attrs) {
                    element.ready(function () {
                        Prism.highlightElement(element[0]);
                    });
                }
            };
        })
        /**
         * Highlights text that matches entry.searchText
         * Taken from AngularUI Bootstrap Typeahead
         * See https://github.com/angular-ui/bootstrap/blob/master/src/typeahead/typeahead.js#L669
         */
        .filter('highlight', function () {
            function escapeRegexp(queryToEscape) {
                // Regex: capture the whole query string and replace it with the string that will be used to match
                // the results, for example if the capture is "a" the result will be \a
                return ('' + queryToEscape).replace(/([.?*+^$[\]\\(){}|-])/g, '\\$1');
            }

            return function (matchItem, query) {
                // Replaces the capture string with a the same string inside of a "<span>" tag
                return query && matchItem ? ('' + matchItem).replace(new RegExp(escapeRegexp(query), 'gi'), '<span class="search-text-highlight">$&</span>') : matchItem;
            };
        });

    // upper case color code and name
    _.each(MOCK_CSS_COLORS, function (color) {
        color.code = color.code.toUpperCase();
        color.name = color.name.toUpperCase();
    });
    // sort by name
    MOCK_CSS_COLORS = _.sortBy(MOCK_CSS_COLORS, function (color) {
        return color.name;
    });

    function SimpleListCtrl() {
        var that = this;
        that.colorName = null;

        that.autoCompleteOptions = {
            minimumChars: 1,
            data: function (searchTerm) {
                searchTerm = searchTerm.toUpperCase();

                var colors = _.filter(MOCK_CSS_COLORS, function (color) {
                    return color.name.startsWith(searchTerm);
                });

                return _.map(colors, 'name');
            }
        };
    }

    // Using itemTemplate
    CustomListUsingTemplateCtrl.$inject = ['$templateCache'];
    function CustomListUsingTemplateCtrl($templateCache) {
        var that = this;
        that.colorName = '';
        that.selectedColor = null;

        that.autoCompleteOptions = {
            minimumChars: 1,
            maxItemsToRender: 10,
            dropdownWidth: '400px',
            containerCssClass: 'color-codes',
            selectedTextAttr: 'name',
            itemTemplate: $templateCache.get('color-item-template'),
            data: function (searchTerm) {
                searchTerm = searchTerm.toUpperCase();

                return _.filter(MOCK_CSS_COLORS, function (color) {
                    return color.name.includes(searchTerm);
                });
            },
            itemSelected: function (e) {
                that.selectedColor = e.item;
            }
        };
    }

    SimpleListRemoteDataCtrl.$inject = ['$http'];
    function SimpleListRemoteDataCtrl($http) {
        var that = this;
        that.stateName = null;
        that.loading = false;

        that.autoCompleteOptions = {
            minimumChars: 1,
            data: function (searchTerm) {
                return $http.get('data_files/usa_states.json')
                    .then(function (response) {
                        that.loading = true;

                        // ideally filtering should be done on server
                        searchTerm = searchTerm.toUpperCase();

                        var match = _.filter(response.data, function (state) {
                            return state.name.startsWith(searchTerm);
                        });

                        that.loading = false;

                        return _.map(match, 'name');
                    });
            }
        };
    }

    SimplePagedListRemoteDataCtrl.$inject = ['$http'];
    function SimplePagedListRemoteDataCtrl($http) {
        var that = this;
        that.airportName = null;
        that.loading = false;

        that.autoCompleteOptions = {
            minimumChars: 1,
            dropdownWidth: '500px',
            dropdownHeight: '200px',
            pagingEnabled: true,
            pageSize: 5,
            data: function (searchTerm, pagingParams) {
                that.loading = true;

                return $http.get('data_files/airports.json')
                    .then(function (response) {
                        // ideally filtering should be done on server
                        searchTerm = searchTerm.toUpperCase();

                        var airports = _.filter(response.data, function (airport) {
                            return airport.name.startsWith(searchTerm);
                        });
                        airports = getPage(airports, pagingParams.pageIndex, pagingParams.pageSize);

                        that.loading = false;

                        return _.map(airports, 'name');
                    });
            }
        };

        function getPage(data, pageIndex, pageSize) {
            var startIndex = pageIndex * pageSize;
            var endIndex = startIndex + pageSize;

            return data.slice(startIndex, endIndex);
        }
    }

    // activate on focus
    function ActivateOnFocusCtrl() {
        var that = this;
        that.breakfast = null;

        that.autoCompleteOptions = {
            minimumChars: 0,
            activateOnFocus: true,
            hideDropdownOnWindowResize: false,
            data: function (searchTerm) {
                searchTerm = searchTerm.toUpperCase();

                return _.filter(MOCK_BREAKFAST, function (breakfast) {
                    return breakfast.startsWith(searchTerm);
                });
            }
        };
    }

    // Using itemTemplateUrl
    function CustomListUsingTemplateUrlCtrl() {
        var that = this;
        that.colorName = '';
        that.selectedColor = null;

        // sort by color code
        var CSS_COLORS = _.sortBy(MOCK_CSS_COLORS, function (color) {
            return color.code;
        });

        that.autoCompleteOptions = {
            minimumChars: 1,
            maxItemsToRender: 10,
            containerCssClass: 'color-codes',
            selectedTextAttr: 'code',
            itemTemplateUrl: 'templates/color-list-item.tpl.html',
            data: function (searchTerm) {
                if (!searchTerm.startsWith('#')) {
                    searchTerm = '#' + searchTerm;
                }

                searchTerm = searchTerm.toUpperCase();

                return _.filter(CSS_COLORS, function (color) {
                    return color.code.includes(searchTerm);
                });
            },
            itemSelected: function (e) {
                that.selectedColor = e.item;
            }
        };
    }

    // Using renderItem Callback
    RemoteDataUsingRenderItemCtrl.$inject = ['$http'];
    function RemoteDataUsingRenderItemCtrl($http) {
        var that = this;
        that.airport = null;

        that.autoCompleteOptions = {
            minimumChars: 1,
            dropdownWidth: '500px',
            dropdownHeight: '200px',
            data: function (searchTerm) {
                return $http.get('data_files/airports.json')
                    .then(function (response) {
                        // ideally filtering should be done on the server
                        searchTerm = searchTerm.toUpperCase();

                        return _.filter(response.data, function (airport) {
                            return airport.iata == searchTerm ||
                                airport.name.startsWith(searchTerm);
                        });
                    });
            },
            renderItem: function (item) {
                return {
                    value: item.name,
                    label: "<p class='auto-complete' ng-bind-html='entry.item.name'></p>"
                };
            },
            itemSelected: function (e) {
                that.airport = e.item;
            }
        };
    }

})();
