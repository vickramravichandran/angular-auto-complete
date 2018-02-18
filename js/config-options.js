(function () {
    'use strict';

    angular
        .module('configOptionsModule', [])
        .controller('PluginOptionsCtrl', PluginOptionsCtrl);

    PluginOptionsCtrl.$inject = ['$http'];
    function PluginOptionsCtrl($http) {
        var that = this;
        that.options = [];

        $http.get('docs.json').then(processResponse);

        function processResponse(response) {
            if (!response) {
                return;
            }

            that.options = createOptions(response.data) || [];
        }

        function createOptions(jsDocs) {
            if (_.isEmpty(jsDocs)) {
                return;
            }

            var defaultOptions = _.filter(jsDocs, function (jsDoc) {
                return jsDoc.memberof === 'defaultOptions';
            });
            if (_.isEmpty(defaultOptions)) {
                return;
            }

            return _.map(defaultOptions, function (jsDoc) {
                var optionName = jsDoc.name;

                var doc = {
                    name: optionName,
                    description: getDescription(jsDoc),
                    default: getDescriptionFromTag(jsDoc, 'default'),
                    bindAsHtml: (getDescriptionFromTag(jsDoc, 'bindAsHtml') === 'true'),
                };

                if (moreDocs[optionName]) {
                    doc = angular.merge({}, doc, moreDocs[optionName]);
                }

                return doc;
            });
        }

        function getDescription(jsDoc) {
            return getDescriptionFromTag(jsDoc, 'description') || getDescriptionParagraph(jsDoc);
        }

        function getDescriptionParagraph(jsDoc) {
            if (!jsDoc || !jsDoc.description || _.isEmpty(jsDoc.description.children)) {
                return;
            }

            var paragraph = _.find(jsDoc.description.children, { type: 'paragraph' });
            if (!paragraph || _.isEmpty(paragraph.children)) {
                return;
            }

            return _.reduce(paragraph.children, function (memo, child) {
                return memo + child.value;
            }, '');
        }

        function getDescriptionFromTag(jsDoc, tagTitle) {
            if (!jsDoc || _.isEmpty(jsDoc.tags)) {
                return;
            }

            var tag = _.find(jsDoc.tags, { title: tagTitle });
            if (!tag) {
                return;
            }

            return tag.description;
        }
    }

    var moreDocs = {
        ready: {
            docArray: [
                {
                    'setOptions({key: value})': 'Sets the supplied options on the plugin. The method takes an object hash of key/value pairs where key is any valid option name.'
                },
                {
                    'positionDropdown()': 'Positions the dropdown list.'
                },
                {
                    'hideDropdown()': 'Hides the dropdown list.'
                }
            ]
        }
    };

})();

