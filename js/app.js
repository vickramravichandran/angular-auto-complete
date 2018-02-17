if (!String.prototype.startsWith) {
    String.prototype.startsWith = function (searchString, position) {
        position = position || 0;
        return this.substr(position, searchString.length) === searchString;
    };
}

(function () {
    'use strict';

    angular
        .module('mainApp', ['autoCompleteModule', 'configOptionsModule'])
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
                link: function (scope, element) {
                    element.ready(function () {
                        Prism.highlightElement(element[0]);
                    });
                }
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
            data: function (searchText) {
                searchText = searchText.toUpperCase();

                var colors = _.filter(MOCK_CSS_COLORS, function (color) {
                    return color.name.startsWith(searchText);
                });

                return _.pluck(colors, 'name');
            }
        };
    }

    // Using itemTemplate
    CustomListUsingTemplateCtrl.$inject = ['$templateCache'];
    function CustomListUsingTemplateCtrl($templateCache) {
        var that = this;
        that.colorName = null;
        that.selectedColor = null;

        that.autoCompleteOptions = {
            minimumChars: 1,
            dropdownWidth: '400px',
            containerCssClass: 'color-codes',
            selectedTextAttr: 'name',
            itemTemplate: $templateCache.get('color-item-template'),
            data: function (searchText) {
                searchText = searchText.toUpperCase();

                return _.filter(MOCK_CSS_COLORS, function (color) {
                    return color.name.startsWith(searchText);
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
            data: function (searchText) {
                return $http.get('data_files/usa_states.json')
                    .then(function (response) {
                        that.loading = true;

                        // ideally filtering should be done on server
                        searchText = searchText.toUpperCase();

                        var states = _.filter(response.data, function (state) {
                            return state.name.startsWith(searchText);
                        });

                        that.loading = false;

                        return _.pluck(states, 'name');
                    });
            }
        };
    }

    SimplePagedListRemoteDataCtrl.$inject = ['$http'];
    function SimplePagedListRemoteDataCtrl($http) {
        var that = this;
        that.stateName = null;
        that.loading = false;

        that.autoCompleteOptions = {
            minimumChars: 1,
            dropdownWidth: '500px',
            dropdownHeight: '200px',
            pagingEnabled: true,
            pageSize: 5,
            data: function (searchText, pagingParams) {
                that.loading = true;

                return $http.get('data_files/airports.json')
                    .then(function (response) {
                        // ideally filtering/paging should be done on the server
                        searchText = searchText.toUpperCase();

                        var airports = _.filter(response.data, function (airport) {
                            return airport.name.startsWith(searchText);
                        });
                        airports = getPage(airports, pagingParams.pageIndex, pagingParams.pageSize);

                        that.loading = false;

                        return _.pluck(airports, 'name');
                    });
            }
        };

        function getPage(airports, pageIndex, pageSize) {
            var startIndex = pageIndex * pageSize;
            var endIndex = startIndex + pageSize;

            return airports.slice(startIndex, endIndex);
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
            data: function (searchText) {
                searchText = searchText.toUpperCase();

                return _.filter(MOCK_BREAKFAST, function (breakfast) {
                    return breakfast.startsWith(searchText);
                });
            }
        };
    }

    // Using itemTemplateUrl
    function CustomListUsingTemplateUrlCtrl() {
        var that = this;
        that.colorName = '';
        that.selectedColor = null;

        // sort by code
        var CSS_COLORS = _.sortBy(MOCK_CSS_COLORS, function (color) {
            return color.code;
        });

        that.autoCompleteOptions = {
            minimumChars: 1,
            containerCssClass: 'color-codes',
            selectedTextAttr: 'code',
            itemTemplateUrl: 'templates/color-list-item.tpl.html',
            data: function (searchText) {
                if (!searchText.startsWith('#')) {
                    searchText = '#' + searchText;
                }

                searchText = searchText.toUpperCase();

                return _.filter(CSS_COLORS, function (color) {
                    return color.code.startsWith(searchText);
                });
            },
            itemSelected: function (e) {
                that.selectedColor = e.item;
            }
        };
    }

    // Using renderItem Callback
    RemoteDataUsingRenderItemCtrl.$inject = ['$http', '$sce'];
    function RemoteDataUsingRenderItemCtrl($http, $sce) {
        var that = this;
        that.airport = null;

        that.autoCompleteOptions = {
            minimumChars: 1,
            dropdownWidth: '500px',
            dropdownHeight: '200px',
            data: function (searchText) {
                return $http.get('data_files/airports.json')
                    .then(function (response) {
                        // ideally filtering should be done on the server
                        searchText = searchText.toUpperCase();

                        return _.filter(response.data, function (airport) {
                            return airport.iata === searchText ||
                                airport.name.startsWith(searchText);
                        });
                    });
            },
            renderItem: function (item) {
                return {
                    value: item.name,
                    label: $sce.trustAsHtml("<p class='auto-complete'>" + item.name + "</p>")
                };
            },
            itemSelected: function (e) {
                that.airport = e.item;
            }
        };
    }

})();
