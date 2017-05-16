(function (global, factory) {
    if (typeof exports === 'object' && typeof module !== 'undefined') {
        // commonJS
        module.exports = factory(require('angular'));
    }
    else if (typeof define === 'function' && define.amd) {
        // AMD
        define(['module', 'angular'], function (module, angular) {
            module.exports = factory(angular);
        });
    }
    else {
        factory(global.angular);
    }
}(this, function (angular) {

    var internalService = new InternalService();

    angular
        .module('autoCompleteModule', ['ngSanitize'])
        .service('autoCompleteService', autoCompleteService)
        .directive('autoComplete', autoCompleteDirective);

    autoCompleteDirective.$inject = ['$compile', '$document', '$window', '$timeout'];
    function autoCompleteDirective($compile, $document, $window, $timeout) {

        return {
            restrict: 'A',
            scope: {},
            transclude: false,
            controllerAs: 'ctrl',
            bindToController: {
                options: '&autoComplete'
            },
            require: ['autoComplete', 'ngModel'],
            link: postLinkFn,
            controller: MainCtrl
        };

        function postLinkFn(scope, element, attrs, ctrls) {
            var ctrl = ctrls[0]; //directive controller
            ctrl.textModelCtrl = ctrls[1]; // textbox model controller

            internalService.addDirectiveCtrl(ctrl);

            // store the jquery element on the controller
            ctrl.target = element;

            // wait for page load before initialization to avoid any missing selectors
            $timeout(function () {
                // execute the options expression
                var options = ctrl.options() || {};
                ctrl.init(angular.extend({}, defaultOptions, options));

                _initContainer();
                _wireupEvents();
            });

            function _initContainer() {
                var templateFn = $compile(_getTemplate());
                ctrl.container = templateFn(scope);

                if (ctrl.options.containerCssClass) {
                    ctrl.container.addClass(ctrl.options.containerCssClass);
                }

                // if a jquery parent is specified in options append the container to that
                // otherwise append to body
                if (ctrl.options.dropdownParent) {
                    ctrl.options.dropdownParent.append(ctrl.container);
                }
                else {
                    $document.find('body').append(ctrl.container);
                    ctrl.container.addClass('auto-complete-absolute-container');
                }

                // keep a reference to the <ul> element
                ctrl.elementUL = angular.element(ctrl.container[0].querySelector('ul.auto-complete-results'));
            }

            function _getTemplate() {
                var html = '';
                html += '<div class="auto-complete-container unselectable"';
                html += '     data-instance-id="{{ ctrl.instanceId }}"';
                html += '     ng-show="ctrl.containerVisible">';
                html += '     <ul class="auto-complete-results">';
                html += '         <li ng-repeat="item in ctrl.renderItems track by $index"';
                html += '             ng-click="ctrl.selectItem($index, true)"';
                html += '             class="auto-complete-item" data-index="{{ $index }}"';
                html += '             ng-class="ctrl.getSelectedCssClass($index)">';
                html += '                 <div ng-bind-html="item.label"></div>';
                html += '         </li>';
                html += '     </ul>';
                html += '</div>';

                return html;
            }

            function _wireupEvents() {

                // when the target(textbox) gets focus activate the corresponding container
                element.on('focus', function () {
                    scope.$evalAsync(function () {
                        ctrl.activate();
                        if (ctrl.options.activateOnFocus) {
                            _waitAndFetch(element.val(), 100);
                        }
                    });
                });

                element.on('input', function () {
                    scope.$evalAsync(_fetch);
                });

                // handle key strokes
                element.on('keydown', function (event) {
                    var $event = event;
                    scope.$evalAsync(function () {
                        _elementKeyDown($event);
                    });
                });

                // hide container on ENTER
                $document.on('keydown', function (event) {
                    var $event = event;
                    scope.$evalAsync(function () {
                        _documentKeyDown($event);
                    });
                });

                angular.element($window).on('resize', function () {
                    scope.$evalAsync(function () {
                        ctrl.hide();
                    });
                });

                $document.on('click', function (event) {
                    var $event = event;
                    scope.$evalAsync(function () {
                        _documentClick($event);
                    });
                });

                function _ignoreKeyCode(keyCode) {
                    return [
                            KEYCODE.TAB,
                            KEYCODE.ALT,
                            KEYCODE.CTRL,
                            KEYCODE.LEFTARROW,
                            KEYCODE.RIGHTARROW,
                            KEYCODE.MAC_COMMAND_LEFT,
                            KEYCODE.MAC_COMMAND_RIGHT
                        ].indexOf(keyCode) !== -1;
                }

                function _elementKeyDown(event) {
                    var keyCode = event.charCode || event.keyCode || 0;

                    if (_ignoreKeyCode(keyCode)) {
                        return;
                    }

                    if (keyCode === KEYCODE.UPARROW) {
                        ctrl.scrollToItem(-1);

                        event.stopPropagation();
                        event.preventDefault();

                        return;
                    }

                    if (keyCode === KEYCODE.DOWNARROW) {
                        ctrl.scrollToItem(1);

                        event.stopPropagation();
                        event.preventDefault();

                        return;
                    }

                    if (keyCode === KEYCODE.ENTER) {
                        ctrl.selectItem(ctrl.selectedIndex, true);

                        //prevent postback upon hitting enter
                        event.preventDefault();
                        event.stopPropagation();

                        return;
                    }

                    if (keyCode === KEYCODE.ESCAPE) {
                        ctrl.hide();
                        ctrl.restoreOriginalText();

                        event.preventDefault();
                        event.stopPropagation();

                        return;
                    }
                }

                function _fetch() {
                    // fetch only if minimum number of chars are typed
                    // else hide dropdown
                    var term = element.val();
                    if (term.length < ctrl.options.minimumChars) {
                        ctrl.hide();
                        ctrl.empty();

                        return;
                    }

                    _waitAndFetch(term);
                }

                function _waitAndFetch(term, delay) {
                    // wait few millisecs before calling fetch()
                    // this allows checking if user has stopped typing
                    var promise = $timeout(function () {
                        // is term unchanged?
                        if (term === element.val()) {
                            ctrl.fetch(term);
                        }

                        //cancel the timeout
                        $timeout.cancel(promise);
                    }, (delay || 300));
                }

                function _documentKeyDown() {
                    // hide inactive dropdowns when multiple auto complete exist on a page
                    internalService.hideAllInactive();
                }

                function _documentClick(event) {
                    // hide inactive dropdowns when multiple auto complete exist on a page
                    internalService.hideAllInactive();

                    // ignore inline
                    if (ctrl.isInline()) {
                        return;
                    }

                    // no container. probably destroyed in scope $destroy
                    if (!ctrl.container) {
                        return;
                    }

                    // ignore target click
                    if (event.target === ctrl.target[0]) {
                        event.stopPropagation();
                        return;
                    }

                    if (ctrl.container.has(event.target).length > 0) {
                        event.stopPropagation();
                        return;
                    }

                    ctrl.hide();
                }

            }

            // cleanup on destroy
            var destroyFn = scope.$on('$destroy', function () {
                if (ctrl.container) {
                    ctrl.container.remove();
                    ctrl.container = null;
                }

                destroyFn();
            });
        }
    }

    MainCtrl.$inject = ['$q', '$window', '$document', '$sce', '$timeout', '$interpolate', '$templateRequest', '$exceptionHandler'];
    function MainCtrl($q, $window, $document, $sce, $timeout, $interpolate, $templateRequest, $exceptionHandler) {
        var that = this;
        var originalValue = null;

        this.target = null;
        this.selectedIndex = -1;
        this.renderItems = [];
        this.containerVisible = false;

        this.isInline = function () {
            // if a dropdown jquery parent is provided it is assumed inline
            return angular.isElement(that.options.dropdownParent);
        };

        this.init = function (options) {
            this.options = options;
            this.instanceId = internalService.getNewInstanceId();
        };

        this.activate = function () {
            originalValue = null;
            internalService.setActiveInstanceId(that.instanceId);
        };

        this.fetch = function (term) {
            // backup original value in case we need to restore later
            originalValue = term;

            // callback
            _safeCallback(that.options.loading);

            $q.when(that.options.data(term),
                function successCallback(result) {
                    // there might be some lag in getting data when remote web services are involved
                    // so check if the current value of the element is has changed
                    var value = that.textModelCtrl.$viewValue;
                    if (value && term !== value) {
                        return;
                    }

                    that.renderList(result, term);

                    // callback
                    _safeCallback(that.options.loadingComplete);
                },
                function errorCallback(error) {
                    that.hide();

                    // callback
                    _safeCallback(that.options.loadingComplete, {error: error});
                });
        };

        this.renderList = function (result) {
            that.empty();

            if (!result || result.length === 0) {
                that.hide();
                return;
            }

            _getRenderFn().then(function (renderFn) {
                _renderList(renderFn, result);
            });
        };

        this.show = function () {
            // the show gets called after the items are ready for display
            // the textbox position can change (ex: window resize) when it has focus
            // so reposition the dropdown before it's shown
            _positionDropdown();

            // callback
            _safeCallback(that.options.dropdownShown);
        };

        this.hide = function () {
            if (!that.containerVisible) {
                return;
            }

            // reset scroll position
            that.elementUL[0].scrollTop = 0;
            that.containerVisible = false;

            // callback
            _safeCallback(that.options.dropdownHidden);
        };

        this.restoreOriginalText = function () {
            if (!originalValue) {
                return;
            }

            _setTargetValue(originalValue);
        };

        this.empty = function () {
            that.selectedIndex = -1;
            that.renderItems = [];
        };

        this.scrollToItem = function (offset) {
            if (!that.containerVisible) {
                return;
            }

            var index = that.selectedIndex + offset;
            var item = that.renderItems[index];
            if (!item) {
                return;
            }

            that.selectItem(index);

            var attrSelector = 'li[data-index="' + index + '"]';

            // use jquery.scrollTo plugin if available
            // http://flesler.blogspot.com/2007/10/jqueryscrollto.html
            if (window.jQuery && window.jQuery.scrollTo) {  // requires jquery to be loaded
                that.elementUL.scrollTo(that.elementUL.find(attrSelector));
                return;
            }

            var li = that.elementUL[0].querySelector(attrSelector);
            if (li) {
                // this was causing the page to jump/scroll
                //    li.scrollIntoView(true);
                that.elementUL[0].scrollTop = li.offsetTop;
            }
        };

        this.selectItem = function (index, closeDropdownAndRaiseCallback) {
            var item = that.renderItems[index];
            if (!item) {
                return;
            }

            that.selectedIndex = index;

            _updateTarget();

            if (closeDropdownAndRaiseCallback) {
                if (!that.isInline()) {
                    that.hide();
                }

                _safeCallback(that.options.itemSelected, {item: item.data});
            }
        };

        this.getSelectedCssClass = function (index) {
            if (index === that.selectedIndex) {
                return that.options.selectedCssClass;
            }
            return '';
        };


        function _safeCallback(fn, args) {
            if (!angular.isFunction(fn)) {
                return;
            }

            try {
                return fn.call(that.target, args);
            } catch (ex) {
                //ignore
            }
        }

        function _positionDropdown() {
            // no need to position if container has been appended to
            // parent specified in options
            if (that.isInline()) {
                return;
            }

            var rect = that.target[0].getBoundingClientRect();

            if (that.options.dropdownWidth === 'auto') {
                // same as textbox width
                that.container.css({'width': rect.width + 'px'});
            }
            else {
                that.container.css({'width': that.options.dropdownWidth});
            }

            if (that.options.dropdownHeight !== 'auto') {
                that.elementUL.css({'height': that.options.dropdownHeight});
            }

            if (that.options.positionUsingJQuery && _hasJQueryUI()) {
                _positionUsingJQuery();
            }
            else {
                _positionUsingDomAPI();
            }
        }

        function _hasJQueryUI() {
            return (window.jQuery && window.jQuery.ui);
        }

        function _positionUsingJQuery() {
            // use the .position() function from jquery.ui if available
            // requires both jquery and jquery-ui
            if (!_hasJQueryUI()) {
                return;
            }

            var defaultPosition = {
                my: 'left top',
                at: 'left bottom',
                of: that.target,
                collision: 'none flip'
            };

            var pos = angular.extend({}, defaultPosition, that.options.positionUsing);

            // jquery.ui position() requires the container to be visible to calculate its position.
            that.containerVisible = true; // used in the template to set ng-show.
            that.container.css({'visibility': 'hidden'});
            $timeout(function () {
                that.container.position(pos);
                that.container.css({'visibility': 'visible'});
            });
        }

        function _positionUsingDomAPI() {
            var rect = that.target[0].getBoundingClientRect();

            var scrollTop = $document[0].body.scrollTop || $document[0].documentElement.scrollTop || $window.pageYOffset,
                scrollLeft = $document[0].body.scrollLeft || $document[0].documentElement.scrollLeft || $window.pageXOffset;

            that.container.css({
                'left': rect.left + scrollLeft + 'px',
                'top': rect.top + rect.height + scrollTop + 'px'
            });

            that.containerVisible = true;
        }

        function _updateTarget() {
            var item = that.renderItems[that.selectedIndex];
            if (!item) {
                return;
            }

            _setTargetValue(item.value);
        }

        function _setTargetValue(value) {
            that.target.val(value);
            that.textModelCtrl.$setViewValue(value);
        }

        function _renderList(renderFn, result) {
            // limit number of items rendered in the dropdown
            var maxItemsToRender = (result.length < that.options.maxItemsToRender) ? result.length : that.options.maxItemsToRender;
            var itemsToRender = result.slice(0, maxItemsToRender);
            var items = [];

            angular.forEach(itemsToRender, function (data) {
                // invoke render callback with the data as parameter
                // this should return an object with a 'label' and 'value' property where
                // 'label' is the safe html for display and 'value' is the text for the textbox
                var item = renderFn(data);
                if (item && item.label && item.value) {
                    // store the data on the renderItem and add to array
                    item.data = data;
                    items.push(item);
                }
            });

            that.renderItems = items;

            that.show();
        }

        function _getRenderFn() {
            // user provided function
            if (angular.isFunction(that.options.renderItem) && that.options.renderItem !== angular.noop) {
                return $q.when(that.options.renderItem);
            }

            // itemTemplateUrl
            if (that.options.itemTemplateUrl) {
                return _getRenderFn_TemplateUrl();
            }

            // itemTemplate or default
            var template = that.options.itemTemplate || '<span>{{item}}</span>';
            return $q.when(_renderItem.bind(null, $interpolate(template, false)));
        }

        function _getRenderFn_TemplateUrl() {
            return $templateRequest(that.options.itemTemplateUrl)
                .then(function (content) {
                    // delegate to local function
                    return _renderItem.bind(null, $interpolate(content, false));
                })
                .catch($exceptionHandler)
                .catch(angular.noop);
        }

        function _renderItem(interpolationFn, data) {
            var value = (angular.isObject(data) && that.options.selectedTextAttr) ? data[that.options.selectedTextAttr] : data;
            return {
                value: value,
                label: $sce.trustAsHtml(interpolationFn({item: data}))
            };
        }
    }

    function InternalService() {
        var that = this;
        var pluginCtrls = [];
        var instanceCount = 0;
        var activeInstanceId = 0;

        this.addDirectiveCtrl = function (ctrl) {
            if (ctrl) {
                pluginCtrls.push(ctrl);
            }
        };

        this.getNewInstanceId = function () {
            return instanceCount++;
        };

        this.setActiveInstanceId = function (instanceId) {
            activeInstanceId = instanceId;
            that.hideAllInactive();
        };

        this.hideAllInactive = function () {
            angular.forEach(pluginCtrls, function (ctrl) {
                // hide if this is not the active instance
                if (!ctrl.isInline() && ctrl.instanceId !== activeInstanceId) {
                    ctrl.hide();
                }
            });
        };
    }

    function autoCompleteService() {
        this.getDefaultOptionsDoc = function () {
            return defaultOptionsDoc;
        };
    }

    var KEYCODE = {
        TAB: 9,
        ENTER: 13,
        CTRL: 17,
        ALT: 18,
        ESCAPE: 27,
        LEFTARROW: 37,
        UPARROW: 38,
        RIGHTARROW: 39,
        DOWNARROW: 40,
        MAC_COMMAND_LEFT: 91,
        MAC_COMMAND_RIGHT: 93
    };

    var defaultOptions = {
        containerCssClass: null,
        selectedCssClass: 'auto-complete-item-selected',
        minimumChars: 1,
        maxItemsToRender: 20,
        activateOnFocus: false,
        //
        dropdownWidth: 'auto',
        dropdownHeight: 'auto',
        dropdownParent: null,
        //
        selectedTextAttr: null,
        itemTemplate: null,
        itemTemplateUrl: null,
        /*position using jQuery*/
        positionUsingJQuery: true,
        positionUsing: null,
        /*callbacks*/
        loading: angular.noop,
        data: angular.noop,
        loadingComplete: angular.noop,
        renderItem: angular.noop,
        itemSelected: angular.noop,
        dropdownShown: angular.noop,
        dropdownHidden: angular.noop
    };

    var defaultOptionsDoc = {
        containerCssClass: {
            def: 'null',
            doc: 'CSS class applied to the dropdown container'
        },
        selectedCssClass: {
            def: 'auto-complete-item-selected',
            doc: 'CSS class applied to the selected list element'
        },
        minimumChars: {
            def: '1',
            doc: 'Minimum number of characters required to display the dropdown.'
        },
        maxItemsToRender: {
            def: '20',
            doc: 'Maximum number of items to render in the list.'
        },
        activateOnFocus: {
            def: 'false',
            doc: 'If true will display the dropdown list when the textbox gets focus.'
        },
        dropdownWidth: {
            def: 'auto',
            doc: 'Width in "px" of the dropddown list.'
        },
        dropdownHeight: {
            def: 'auto',
            doc: 'Height in "px" of the dropddown list.'
        },
        dropdownParent: {
            def: 'null',
            doc: 'a jQuery object to append the dropddown list.'
        },
        selectedTextAttr: {
            def: 'null',
            doc: 'If the data for the dropdown is a collection of objects, this should be the name of a property on the object. The property value will be used to update the input textbox.'
        },
        itemTemplate: {
            def: 'null',
            doc: 'A template for the dropddown list item. For example "<div>{{item.lastName}} - {{item.jobTitle}}</div>".'
        },
        itemTemplateUrl: {
            def: 'null',
            doc: 'This is similar to template but the template is loaded from the specified URL, asynchronously.'
        },
        positionUsingJQuery: {
            def: 'false',
            doc: 'If true will position the dropdown list using the position() method from the jQueryUI library. See <a href="https://api.jqueryui.com/position/">jQueryUI.position() documentation</a>'
        },
        positionUsing: {
            def: 'null',
            doc: 'Options that will be passed to jQueryUI position() method.'
        },
        loading: {
            def: 'noop',
            doc: 'Callback before getting the data for the dropdown.'
        },
        data: {
            def: 'noop',
            doc: 'Callback for data for the dropdown. Must return a promise'
        },
        loadingComplete: {
            def: 'noop',
            doc: 'Callback after the items are rendered in the dropdown.'
        },
        renderItem: {
            def: 'noop',
            doc: 'Callback for custom rendering a list item. This is called for each item in the dropdown. It must return an object literal with "value" and "label" properties, where "label" is the safe html for display and "value" is the text for the textbox'
        },
        itemSelected: {
            def: 'noop',
            doc: 'Callback after an item is selected from the dropdown.'
        },
        dropdownShown: {
            def: 'noop',
            doc: 'Callback after the dropdown is hidden.'
        },
        dropdownHidden: {
            def: 'noop',
            doc: 'Callback after the dropdown is shown.'
        }
    };

}));
