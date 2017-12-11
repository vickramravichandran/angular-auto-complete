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
    'use strict';

    var internalService = new InternalService();

    angular
        .module('autoCompleteModule', ['ngSanitize'])
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
                ctrl.container = _getContainer();

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

            function _getContainer() {
                if (angular.isElement(ctrl.options.dropdownParent)) {
                    return _getCustomContainer();
                }

                return _getDefaultContainer();
            }

            function _getCustomContainer() {
                var container = ctrl.options.dropdownParent;

                container.addClass('auto-complete-container unselectable');
                container.attr('data-instance-id', ctrl.instanceId);

                var templateFn = $compile(_getDropdownListTemplate());
                var elementUL = templateFn(scope);
                container.append(elementUL);

                return container;
            }

            function _getDefaultContainer() {
                var templateFn = $compile(_getContainerTemplate());
                return templateFn(scope);
            }

            function _getContainerTemplate() {
                var html = '';
                html += '<div class="auto-complete-container unselectable"';
                html += '     data-instance-id="{{ ctrl.instanceId }}"';
                html += '     ng-show="ctrl.containerVisible">';
                html += _getDropdownListTemplate();
                html += '</div>';

                return html;
            }

            function _getDropdownListTemplate() {
                var html = '';
                html += '     <ul class="auto-complete-results">';
                html += '         <li ng-repeat="item in ctrl.renderItems track by $index"';
                html += '             ng-click="ctrl.selectItem($index, true)"';
                html += '             class="auto-complete-item" data-index="{{ $index }}"';
                html += '             ng-class="ctrl.getSelectedCssClass($index)">';
                html += '               <div ng-bind-html="item.label"></div>';
                html += '         </li>';
                html += '     </ul>';

                return html;
            }

            function _wireupEvents() {

                // when the target(textbox) gets focus activate the corresponding container
                element.on('focus', function () {
                    scope.$evalAsync(function () {
                        ctrl.activate();
                        if (ctrl.options.activateOnFocus) {
                            _waitAndQuery(element.val(), 100);
                        }
                    });
                });

                element.on('input', function () {
                    scope.$evalAsync(function () {
                        _tryQuery(element.val());
                    });
                });

                // handle key strokes
                element.on('keydown', function (event) {
                    var $event = event;
                    scope.$evalAsync(function () {
                        _elementKeyDown($event);
                    });
                });

                if (ctrl.options.pagingEnabled) {
                    ctrl.container.find('ul').on('scroll', function () {
                        var list = this;
                        scope.$evalAsync(function () {
                            if (!ctrl.containerVisible) {
                                return;
                            }

                            // scrolled to the bottom?
                            if ((list.offsetHeight + list.scrollTop) >= list.scrollHeight) {
                                ctrl.tryLoadNextPage();
                            }
                        });
                    });
                }

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
                        ctrl.scrollToPreviousItem();

                        event.stopPropagation();
                        event.preventDefault();

                        return;
                    }

                    if (keyCode === KEYCODE.DOWNARROW) {
                        ctrl.scrollToNextItem();

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
                        ctrl.restoreOriginalText();
                        ctrl.hide();

                        event.preventDefault();
                        event.stopPropagation();

                        return;
                    }
                }

                function _tryQuery(searchText) {
                    // query only if minimum number of chars are typed; else hide dropdown
                    if (!searchText || searchText.length < ctrl.options.minimumChars) {
                        ctrl.hide();
                        return;
                    }

                    _waitAndQuery(searchText);
                }

                function _waitAndQuery(searchText, delay) {
                    // wait few millisecs before calling query(); this to check if the user has stopped typing
                    var promise = $timeout(function () {
                        // has searchText unchanged?
                        if (searchText === element.val()) {
                            ctrl.query(searchText);
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

                    if (_containerContainsTarget(event.target)) {
                        event.stopPropagation();
                        return;
                    }

                    ctrl.hide();
                }
            }

            function _containerContainsTarget(target) {
                // use native Node.contains
                // https://developer.mozilla.org/en-US/docs/Web/API/Node/contains
                if (angular.isFunction(ctrl.container[0].contains) &&
                    ctrl.container[0].contains(target)) {

                    return true;
                }

                // otherwise use .has() if jQuery is available
                if (window.jQuery && angular.isFunction(ctrl.container.has) &&
                    ctrl.container.has(target).length > 0) {

                    return true;
                }

                // assume target is not in container
                return false;
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
        var originalSearchText = null;
        var queryCounter = 0;
        var dataLoadInProgress = false;
        var endOfPagedList = false;
        var currentPageIndex = 0;

        this.target = null;
        this.instanceId = -1;
        this.selectedIndex = -1;
        this.renderItems = [];
        this.containerVisible = false;

        this.isInline = function () {
            // if a dropdown jquery parent is provided it is assumed inline
            return angular.isElement(that.options.dropdownParent);
        };

        this.init = function (options) {
            that.instanceId = internalService.getNewInstanceId();
            that.options = options;
            that.containerVisible = that.isInline();
        };

        this.activate = function () {
            internalService.setActiveInstanceId(that.instanceId);
            originalSearchText = null;
        };

        this.query = function (searchText) {
            that.empty();
            _reset();

            return _query(searchText, 0);
        };

        this.show = function () {
            // the show() method is called after the items are ready for display
            // the textbox position can change (ex: window resize) when it has focus
            // so reposition the dropdown before it's shown
            _positionDropdown();

            // callback
            _safeCallback(that.options.dropdownShown);
        };

        this.hide = function () {
            if (that.isInline() || !that.containerVisible) {
                return;
            }

            // reset scroll position
            //that.elementUL[0].scrollTop = 0;
            that.containerVisible = false;
            that.empty();

            _reset();

            // callback
            _safeCallback(that.options.dropdownHidden);
        };

        this.empty = function () {
            that.selectedIndex = -1;
            that.renderItems = [];
        };

        this.restoreOriginalText = function () {
            if (!originalSearchText) {
                return;
            }

            _setTargetValue(originalSearchText);
        };

        this.scrollToPreviousItem = function () {
            var itemIndex = _getItemIndexFromOffset(-1);
            if (itemIndex === -1) {
                return;
            }

            _scrollToItem(itemIndex);
        };

        this.scrollToNextItem = function () {
            var itemIndex = _getItemIndexFromOffset(1);
            if (itemIndex === -1) {
                return;
            }

            _scrollToItem(itemIndex);

            if (_shouldLoadNextPageAtItemIndex(itemIndex)) {
                _loadNextPage();
            }
        };

        this.selectItem = function (itemIndex, closeDropdownAndRaiseCallback) {
            var item = that.renderItems[itemIndex];
            if (!item) {
                return;
            }

            that.selectedIndex = itemIndex;

            _updateTarget();

            if (closeDropdownAndRaiseCallback) {
                that.hide();

                _safeCallback(that.options.itemSelected, { item: item.data });
            }
        };

        this.getSelectedCssClass = function (itemIndex) {
            return (itemIndex === that.selectedIndex) ? that.options.selectedCssClass : '';
        };

        this.tryLoadNextPage = function () {
            if (_shouldLoadNextPage()) {
                _loadNextPage();
            }
        };


        function _loadNextPage() {
            return _query(originalSearchText, (currentPageIndex + 1));
        }

        function _query(searchText, pageIndex) {
            var params = {
                searchText: searchText,
                paging: {
                    pageIndex: pageIndex,
                    pageSize: that.options.pageSize
                },
                queryId: ++queryCounter
            };

            var renderListFn = (that.options.pagingEnabled ? _renderPagedList : _renderList);

            return _queryInternal(params, renderListFn.bind(that, params));
        }

        function _queryInternal(params, renderListFn) {
            // backup original search term in case we need to restore if user hits ESCAPE
            originalSearchText = params.searchText;
            dataLoadInProgress = true;

            _safeCallback(that.options.loading);

            return $q.when(that.options.data(params.searchText, params.paging),
                function successCallback(result) {
                    if (_shouldHideDropdown(params, result)) {
                        that.hide();
                        return;
                    }

                    renderListFn(result).then(that.show);

                    // callback
                    _safeCallback(that.options.loadingComplete);
                },
                function errorCallback(error) {
                    that.hide();

                    _safeCallback(that.options.loadingComplete, { error: error });
                }).then(function () {
                    dataLoadInProgress = false;
                });
        }

        function _getItemIndexFromOffset(itemOffset) {
            var itemIndex = that.selectedIndex + itemOffset;

            if (itemIndex >= that.renderItems.length) {
                return -1;
            }

            return itemIndex;
        }

        function _scrollToItem(itemIndex) {
            if (!that.containerVisible) {
                return;
            }

            that.selectItem(itemIndex);

            var attrSelector = 'li[data-index="' + itemIndex + '"]';

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
        }

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

            if (that.options.dropdownWidth === 'auto') {
                // same as textbox width
                var rect = that.target[0].getBoundingClientRect();
                that.container.css({ 'width': rect.width + 'px' });
            }
            else {
                that.container.css({ 'width': that.options.dropdownWidth });
            }

            if (that.options.dropdownHeight !== 'auto') {
                that.elementUL.css({ 'max-height': that.options.dropdownHeight });
            }

            // use the .position() function from jquery.ui if available (requires both jquery and jquery-ui)
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
            var defaultPosition = {
                my: 'left top',
                at: 'left bottom',
                of: that.target,
                collision: 'none flip'
            };

            var position = angular.extend({}, defaultPosition, that.options.positionUsing);

            // jquery.ui position() requires the container to be visible to calculate its position.
            if (!that.containerVisible) {
                that.container.css({ 'visibility': 'hidden' });
            }
            that.containerVisible = true; // used in the template to set ng-show.
            $timeout(function () {
                that.container.position(position);
                that.container.css({ 'visibility': 'visible' });
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

        function _shouldHideDropdown(params, result) {
            // verify the queryId since there might be some lag when getting data from a remote web service.
            if (params.queryId !== queryCounter) {
                return true;
            }

            // do we have results to render?
            var hasResult = (result && result.length !== 0);
            if (hasResult) {
                return false;
            }

            // if paging is enabled hide the dropdown only when rendering the first page
            if (that.options.pagingEnabled) {
                return (params.paging.pageIndex === 0);
            }

            return true;
        }

        function _renderList(params, result) {
            return _getRenderFn().then(function (renderFn) {
                if (!result || result.length === 0) {
                    return;
                }

                that.renderItems = _renderItems(renderFn, result);
            });
        }

        function _renderPagedList(params, result) {
            return _getRenderFn().then(function (renderFn) {
                if (!result || result.length === 0) {
                    return;
                }

                var items = _renderItems(renderFn, result);

                angular.forEach(items, function (item) {
                    that.renderItems.push(item);
                });

                currentPageIndex = params.paging.pageIndex;
                endOfPagedList = (items.length < that.options.pageSize);
            });
        }

        function _renderItems(renderFn, result) {
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

            return items;
        }

        function _getRenderFn() {
            // user provided function
            if (angular.isFunction(that.options.renderItem) && that.options.renderItem !== angular.noop) {
                return $q.when(that.options.renderItem);
            }

            // itemTemplateUrl
            if (that.options.itemTemplateUrl) {
                return _getRenderFnUsingTemplateUrl();
            }

            // itemTemplate or default
            var template = that.options.itemTemplate || '<span>{{item}}</span>';
            return $q.when(_renderItem.bind(null, $interpolate(template, false)));
        }

        function _getRenderFnUsingTemplateUrl() {
            return $templateRequest(that.options.itemTemplateUrl)
                .then(function (content) {
                    // delegate to local function
                    return _renderItem.bind(null, $interpolate(content, false));
                })
                .catch($exceptionHandler);
        }

        function _renderItem(interpolationFn, data) {
            var value = (angular.isObject(data) && that.options.selectedTextAttr) ? data[that.options.selectedTextAttr] : data;
            return {
                value: value,
                label: $sce.trustAsHtml(interpolationFn({ item: data }))
            };
        }

        function _shouldLoadNextPage() {
            return that.options.pagingEnabled && !dataLoadInProgress && !endOfPagedList;
        }

        function _shouldLoadNextPageAtItemIndex(itemIndex) {
            if (!_shouldLoadNextPage()) {
                return false;
            }

            var triggerIndex = that.renderItems.length - that.options.invokePageLoadWhenItemsRemaining - 1;
            return itemIndex >= triggerIndex;
        }

        function _reset() {
            originalSearchText = null;
            currentPageIndex = 0;
            endOfPagedList = false;
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
                if (ctrl.instanceId !== activeInstanceId) {
                    ctrl.hide();
                }
            });
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
        /**
         * CSS class applied to the dropdown container.
         * @default null
         */
        containerCssClass: null,
        /**
         * CSS class applied to the selected list element.
         * @default auto-complete-item-selected
         */
        selectedCssClass: 'auto-complete-item-selected',
        /**
         * Minimum number of characters required to display the dropdown.
         * @default 1
         */
        minimumChars: 1,
        /**
         * Maximum number of items to render in the list.
         * @default 20
         */
        maxItemsToRender: 20,
        /**
         * If true displays the dropdown list when the textbox gets focus.
         * @default false
         */
        activateOnFocus: false,
        /**
         * Width in "px" of the dropddown list. This can also be applied using CSS.
         * @default 'auto'
         */
        dropdownWidth: 'auto',
        /**
         * Maximum height in "px" of the dropddown list. This can also be applied using CSS.
         * @default 'auto'
         */
        dropdownHeight: 'auto',
        /**
         * a jQuery object to append the dropddown list.
         * @default null
         */
        dropdownParent: null,
        /**
         * If the data for the dropdown is a collection of objects, this should be the name 
         * of a property on the object. The property value will be used to update the input textbox.
         * @default null
         */
        selectedTextAttr: null,
        /**
         * A template for the dropddown list item. For example "<div>{{item.lastName}} - {{item.jobTitle}}</div>".
         * @default null
         */
        itemTemplate: null,
        /**
         * This is similar to template but the template is loaded from the specified URL, asynchronously.
         * @default null
         */
        itemTemplateUrl: null,
        /**
         * Set to true to enable server side paging. See "data" callback for more information.
         * @default false
         */
        pagingEnabled: false,
        /**
         * The number of items to display per page when paging is enabled.
         * @default 5
         */
        pageSize: 5,
        /**
         * When using the keyboard arrow key to scroll down the list, the "data" callback will be invoked when at least this many items remain below the current focused item. Note that dragging the vertical scrollbar to the bottom of the list might also invoke a "data" callback.
         * @default 1
         */
        invokePageLoadWhenItemsRemaining: 1,
        /**
         * Set to true to position the dropdown list using the position() method from the jQueryUI library. See <a href="https://api.jqueryui.com/position/">jQueryUI.position() documentation</a>
         * @default true
         * @bindAsHtml true                  
         */
        positionUsingJQuery: true,
        /**
         * Options that will be passed to jQueryUI position() method.
         * @default null
         */
        positionUsing: null,
        /**
         * Callback before the "data" callback is invoked.
         * @default angular.noop
         */
        loading: angular.noop,
        /**
         * Callback to get the data for the dropdown. The callback receives the search text as the first parameter. If paging is enabled the callback receives an object with "pageIndex" and "pageSize" properties as the second parameter. This function must return a promise.
         * @default angular.noop
         */
        data: angular.noop,
        /**
         * Callback after the items are rendered in the dropdown
         * @default angular.noop
         */
        loadingComplete: angular.noop,
        /**
         * Callback for custom rendering a list item. This is called for each item in the dropdown. This must return an object literal with "value" and "label" properties where "label" is the safe html for display and "value" is the text for the textbox.
         * @default angular.noop
         */
        renderItem: angular.noop,
        /**
         * Callback after an item is selected from the dropdown. The callback receives an object with an "item" property representing the selected item.
         * @default angular.noop
         */
        itemSelected: angular.noop,
        /**
         * Callback after the dropdown is shown.
         * @default angular.noop
         */
        dropdownShown: angular.noop,
        /**
         * Callback after the dropdown is hidden.
         * @default angular.noop
         */
        dropdownHidden: angular.noop
    };

}));