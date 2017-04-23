if (!String.prototype.startsWith) {
    String.prototype.startsWith = function (searchString, position) {
        position = position || 0;
        return this.substr(position, searchString.length) === searchString;
    };
}

(function () {
    'use strict';

    angular
        .module('mainApp', ['autoCompleteModule'])
        .controller('SimpleListCtrl', SimpleListCtrl)
        .controller('CustomListUsingTemplateCtrl', CustomListUsingTemplateCtrl)
        .controller('ActivateOnFocusCtrl', ActivateOnFocusCtrl)
        .controller('SimpleListRemoteDataCtrl', SimpleListRemoteDataCtrl)
        .controller('CustomListUsingTemplateUrlCtrl', CustomListUsingTemplateUrlCtrl)
        .controller('RemoteDataUsingRenderItemCtrl', RemoteDataUsingRenderItemCtrl)
        .controller('PluginOptionsCtrl', PluginOptionsCtrl)
        .directive('ngPrism', function() {
            return {
                restrict: 'A',
                link: function (scope, element, attrs) {
                    element.ready(function () {
                        Prism.highlightElement(element[0]);
                    });
                }
            }
        });

    // upper case color code and name
    _.each(MOCK_CSS_COLORS, function (color) {
        color.code = color.code.toUpperCase();
        color.name = color.name.toUpperCase();
    });
    // sort by name
    MOCK_CSS_COLORS = _.sortBy(MOCK_CSS_COLORS, function(color) {
        return color.name;
    });

    function SimpleListCtrl() {
        var that = this;
        that.colorName = null;

        that.autoCompleteOptions = {
            minimumChars: 1,
            data: function (term) {
                term = term.toUpperCase();
                var match = _.filter(MOCK_CSS_COLORS, function (value) {
                    return value.name.startsWith(term);
                });
                return _.pluck(match, 'name');
            }
        }
    }

    // Using itemTemplate
    CustomListUsingTemplateCtrl.$inject = ["$templateCache"];
    function CustomListUsingTemplateCtrl($templateCache) {
        var that = this;
        that.colorName = '';
        that.selectedColor = null;

        that.autoCompleteOptions = {
            minimumChars: 1,
            data: function (term) {
                term = term.toUpperCase();
                return _.filter(MOCK_CSS_COLORS, function (value) {
                    return value.name.startsWith(term);
                });
            },
            dropdownWidth: '400px',
            containerCssClass: 'color-codes',
            selectedTextAttr: 'name',
            itemTemplate: $templateCache.get('color-item-template'),
            itemSelected: function (e) {
                that.selectedColor = e.item;
            }
        }
    }

    // activate on focus
    function ActivateOnFocusCtrl() {
        var that = this;
        that.breakfast = null;

        that.autoCompleteOptions = {
            minimumChars: 0,
            activateOnFocus: true,
            data: function (term) {
                term = term.toUpperCase();
                return _.filter(MOCK_BREAKFAST, function (value) {
                    return value.startsWith(term);
                });
            }
        }
    }

    SimpleListRemoteDataCtrl.$inject = ["$q", "$http"];
    function SimpleListRemoteDataCtrl($q, $http) {
        var that = this;
        that.stateName = null;

        that.autoCompleteOptions = {
            minimumChars: 1,
            data: function (term) {
                return $http.get('data_files/usa_states.json')
                    .then(function (response) {
                        // ideally filtering should be done on server
                        term = term.toUpperCase();
                        var match = _.filter(response.data, function (value) {
                            return value.name.startsWith(term);
                        });
                        return _.pluck(match, 'name');
                    });
            }
        }
    }

    // Using itemTemplateUrl
    function CustomListUsingTemplateUrlCtrl() {
        var that = this;
        that.colorName = '';
        that.selectedColor = null;

        // sort by color code
        var CSS_COLORS = _.sortBy(MOCK_CSS_COLORS, function(color) {
            return color.code;
        });

        that.autoCompleteOptions = {
            minimumChars: 1,
            data: function (term) {
                if (!term.startsWith('#')) {
                    term = '#' + term;
                }
                term = term.toUpperCase();
                return _.filter(CSS_COLORS, function (value) {
                    return value.code.startsWith(term);
                });
            },
            containerCssClass: 'color-codes',
            selectedTextAttr: 'code',
            itemTemplateUrl: 'templates/color-list-item.tpl.html',
            itemSelected: function (e) {
                that.selectedColor = e.item;
            }
        }
    }

    // Using renderItem Callback
    RemoteDataUsingRenderItemCtrl.$inject = ["$q", "$http", "$sce"];
    function RemoteDataUsingRenderItemCtrl($q, $http, $sce) {
        var that = this;
        that.airport = null;

        that.autoCompleteOptions = {
            minimumChars: 1,
            dropdownWidth: '500px',
            dropdownHeight: '200px',
            data: function (term) {
                return $http.get('data_files/airports.json')
                    .then(function (response) {
                        // ideally filtering should be done on the server
                        term = term.toUpperCase();
                        return _.filter(response.data, function (val) {
                            return val.iata == term
                                || val.name.startsWith(term);
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
        }
    }

    PluginOptionsCtrl.$inject = ["autoCompleteService"];
    function PluginOptionsCtrl(autoCompleteService) {
        this.options = autoCompleteService.defaultOptionsDoc();
    }
        
})();
