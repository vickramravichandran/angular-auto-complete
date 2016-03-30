(function () {
    angular
        .module('autoCompleteModule', ['ngSanitize'])
        .service('autoCompleteService', autoCompleteService)
        .directive('autoComplete', autoCompleteDirective);

    autoCompleteDirective.$inject = ["$compile", "$document", "$window", "$timeout", "autoCompleteService"];
    function autoCompleteDirective($compile, $document, $window, $timeout, autoCompleteService) {

        return {
            restrict: "A",
            scope: {},
            transclude: false,
            controllerAs: "ctrl",
            bindToController: { options: '&autoComplete' },
            require: ["autoComplete", "ngModel"],
            link: postLinkFn,
            controller: MainCtrl
        }

        function postLinkFn(scope, element, attrs, ctrls) {
            var ctrl = ctrls[0]; //directive controller
            ctrl.textModelCtrl = ctrls[1]; // textbox model controller

            autoCompleteService.addDirectiveCtrl(ctrl);

            // execute the options expression in the parent scope
            var options = ctrl.options() || {};
            ctrl.init(angular.extend({}, defaultOptions, options));

            initContainer();

            function initContainer() {
                var template =
                    "<div class='auto-complete-container' data-instance-id='{{ctrl.instanceId}}' ng-show='ctrl.containerVisible'>" +
                      "<ul class='auto-complete-results'>" +
                        "<li ng-repeat='item in ctrl.renderItems'" +
                            "ng-click='ctrl.selectItem($index, true)' " +
                            "class='auto-complete-item' data-index='{{$index}}' " +
                            "ng-class='ctrl.isSelected($index)'>" +
                                "<div ng-bind-html='item.label'></div>" +
                        "</li>" +
                      "</ul>" +
                    "</div>";

                var templateFn = $compile(template);
                ctrl.container = templateFn(scope);

                if (angular.isDefined(ctrl.options.containerCssClass)) {
                    ctrl.container.addClass(ctrl.options.containerCssClass);
                }

                // if a jquery parent is specified in options append the container to that
                // otherwise append to body
                if (angular.isDefined(ctrl.options.dropdownParent)) {
                    ctrl.options.dropdownParent.append(ctrl.container);
                }
                else {
                    $document.find("body").append(ctrl.container);
                    ctrl.container.addClass("auto-complete-absolute-container");
                }

                // store the jquery element on the controller          
                ctrl.target = element;

                // store a reference to the UL
                ctrl.elementUL = angular.element(ctrl.container[0].querySelector("ul.auto-complete-results"));

                // prevents text select on mouse drag, dblclick
                ctrl.container.css("MozUserSelect", "none").bind("selectstart", function () { return false; });
            }

            // when the target(textbox) gets focus activate the corresponding container
            element.on("focus", function (e) {
                scope.$evalAsync(function () {
                    ctrl.activate();
                });
            });

            // handle key strokes
            element.on("keydown", function (e) {
                scope.$evalAsync(function () {
                    _elementKeyDown(e);
                });
            });

            // hide container on ENTER
            $document.on("keydown", function (e) {
                scope.$evalAsync(function () {
                    _documentKeyDown(e);
                });
            });

            angular.element($window).on("resize", function (e) {
                scope.$evalAsync(function () {
                    ctrl.hide();
                });
            })

            // hide container upon CLICK outside of the dropdown rectangle region
            $document.on("click", function (e) {
                scope.$evalAsync(function () {
                    _documentClick(e);
                });
            });

            // cleanup on destroy
            scope.$on('$destroy', function () {
                ctrl.empty();
                ctrl.container.remove();
            });

            function _elementKeyDown(e) {
                var key = e.charCode || e.keyCode || 0;

                if (key == KEYCODE.UPARROW) {
                    ctrl.scrollToItem(-1);

                    e.stopPropagation();
                    e.preventDefault();

                    return;
                }

                if (key == KEYCODE.DOWNARROW) {
                    ctrl.scrollToItem(1);

                    e.stopPropagation();
                    e.preventDefault();

                    return;
                }

                if (key == KEYCODE.ENTER) {
                    ctrl.confirm();

                    //prevent postback upon hitting enter
                    e.preventDefault();
                    e.stopPropagation();

                    return;
                }

                if (key == KEYCODE.ESCAPE) {
                    ctrl.hide();

                    e.preventDefault();
                    e.stopPropagation();

                    return;
                }

                // fetch if minimum number of chars are types
                // else hide dropdown
                var term = element.val();
                if (term.length >= ctrl.options.minimumChars && term !== ctrl.selectedText())
                    // wait few millisecs before calling fetch()
                    // this allows checking if user has stopped typing
                    var delay = $timeout(function () {
                        // is term unchanged?
                        if (term == element.val()) {
                            ctrl.fetch(term);
                        }

                        //cancel the timeout
                        $timeout.cancel(delay);
                    }, 300);
                else {
                    ctrl.hide();
                    ctrl.empty();
                }
            }

            function _documentKeyDown(e) {
                // if multiple auto complete exist on a page, hide inactive dropdowns
                autoCompleteService.hideIfInactive();
            }

            function _documentClick(e) {
                // if multiple auto complete exist on a page, hide inactive dropdowns
                autoCompleteService.hideIfInactive();

                // hide the active dropdown if user clicks anywhere away from the dropdown list
                var isMouseAwayFromActiveContainer = false;

                try {
                    if (ctrl.instanceId !== ctrl.activeInstanceId()) {
                        return;
                    }

                    var offset = ctrl.container[0].getBoundingClientRect();
                    var awayTolerance = 30;

                    if (e.pageX < offset.left - awayTolerance
                        || e.pageX > offset.left + offset.width + awayTolerance
                        || e.pageY < offset.top - awayTolerance
                        || e.pageY > offset.top + offset.height + awayTolerance) {

                        isMouseAwayFromActiveContainer = true;

                        //check if mouse is over the target
                        offset = ctrl.target[0].getBoundingClientRect();
                        if (e.pageX >= offset.left
                            && e.pageX <= offset.left + offset.width
                            && e.pageY >= offset.top
                            && e.pageY <= offset.top + offset.height) {

                            isMouseAwayFromActiveContainer = false;
                        }

                        if (isMouseAwayFromActiveContainer) {
                            ctrl.hide();
                        }
                    }
                }
                catch (e) { }
            }
        }
    }

    MainCtrl.$inject = ["$q", "$window", "$document", "$sce", "autoCompleteService"];
    function MainCtrl($q, $window, $document, $sce, autoCompleteService) {
        var activeInstanceId = 0,
            selectedText,
            selectedValue;

        var that = this;

        this.target = null;

        this.selectedIndex = -1;

        this.renderItems = [];

        this.containerVisible = false;

        this.activeInstanceId = function () {
            return activeInstanceId;
        }

        // hide any open containers other than the active container
        this.hideIfInactive = function () {
            // do not hide container if appended to dropdown parent specified in options
            if (angular.isDefined(that.options.dropdownParent)) {
                return;
            }

            if (that.instanceId !== activeInstanceId) {
                that.hide();
            }
        }

        this.init = function (options) {
            this.options = options;
            this.instanceId = ++instanceCount;
        }

        this.activate = function () {
            activeInstanceId = that.instanceId;
        }

        this.fetch = function (term) {
            // callback
            _safeCallback(that.options.loading);

            $q.when(that.options.data(term),
                function success_callback(result) {
                    // there might some lag when remote web services are involved
                    // to get data. so check if current element value has changed
                    var value = that.textModelCtrl.$viewValue;
                    if (term != value) {
                        return;
                    }

                    that.renderList(result, term);

                    // callback
                    _safeCallback(that.options.loadingComplete);
                },
                function error_callback(error) {
                    that.hide();

                    // callback
                    _safeCallback(that.options.loadingComplete, { error: error });
                });
        }

        this.renderList = function (result) {
            that.empty();

            if (!angular.isDefined(result) || result.length === 0) {
                that.hide();
                return;
            }

            var renderFn = null;
            if (angular.isFunction(that.options.renderItem) && that.options.renderItem !== angular.noop) {
                // delegate to user provided function
                renderFn = that.options.renderItem;
            }
            else {
                // delegate to local function
                renderFn = _renderItem;
            }

            // limit number of items rendered in the dropdown
            var maxItemsToRender = result.length < that.options.maxItemsToRender ? result.length : that.options.maxItemsToRender;
            for (var i = 0; i < maxItemsToRender; i++) {
                var data = result[i];

                //invoke render callback with the data item as parameter
                //this should return an object with a 'label' and 'value' property
                var item = renderFn(data);

                if (item !== null && angular.isDefined(item)) {
                    // store the data on the renderItem and add to array
                    item.data = data;
                    that.renderItems.push(item);
                }
            }

            that.show();
        }


        this.show = function () {
            // the show gets called after the items are ready for display
            // the textbox position can change (ex: window resize) when it has focus
            // so reposition the dropdown before it's shown
            _positionDropdown();

            that.containerVisible = true;

            // callback
            _safeCallback(that.options.dropdownShown);
        }

        this.hide = function () {
            if (that.containerVisible === false) {
                return;
            }

            // reset scroll position
            that.elementUL[0].scrollTop = 0;

            that.containerVisible = false;

            // callback
            _safeCallback(that.options.dropdownHidden);
        }


        this.empty = function () {
            that.selectedIndex = -1;
            that.renderItems = [];
        }


        this.scrollToItem = function (offset) {
            if (that.containerVisible === false) {
                return;
            }

            var index = that.selectedIndex + offset;

            var item = that.renderItems[index];
            if (item) {
                that.selectItem(index);

                // use jquery.scrollTo plugin if available
                // http://flesler.blogspot.com/2007/10/jqueryscrollto.html
                if (window.jQuery) {  // requires jquery to be loaded
                    var li = that.elementUL.find("li[data-index='" + index + "']");
                    if (jQuery.scrollTo) {
                        that.elementUL.scrollTo(li);
                    }
                }
                else {
                    var li = that.elementUL[0].querySelector("li[data-index='" + index + "']");
                    if (li) {
                        // this was causing the page to jump/scroll 
                        //    li.scrollIntoView(true);
                        that.elementUL[0].scrollTop = li.offsetTop;
                    }
                }
            }
        }

        this.selectItem = function (index, confirm) {
            var item = that.renderItems[index];

            if (!angular.isDefined(item)) {
                return;
            }

            that.selectedIndex = index;

            if (confirm === true) {
                // updates textbox and raises callback
                that.confirm();
            }
            else {
                // only updates textbox
                _updateTextBox();
            }
        }

        this.confirm = function () {
            if (that.containerVisible === false) {
                return;
            }

            that.hide();

            selectedValue = _updateTextBox();

            _safeCallback(that.options.itemSelected, { item: selectedValue });
        }

        this.isSelected = function (index) {
            if (index == that.selectedIndex) {
                return that.options.selectedCssClass;
            }

            return "";
        }

        this.selectedText = function () {
            return selectedText;
        }


        function _safeCallback(fn, args) {
            if (angular.isFunction(fn)) {
                try {
                    return fn.call(that.target, args);
                } catch (e) {
                    //ignore
                }
            }
        }

        function _positionDropdown() {
            // no need to position if container has been appended to 
            // parent specified in options
            if (angular.isDefined(that.options.dropdownParent)) {
                return;
            }

            var rect = that.target[0].getBoundingClientRect();

            if (that.options.dropdownWidth == "auto") {
                // same as textbox width
                that.container.css({ "width": rect.width + "px" });
            }
            else {
                that.container.css({ "width": that.options.dropdownWidth });
            }

            if (that.options.dropdownHeight !== "auto") {
                that.elementUL.css({ "height": that.options.dropdownHeight });
            }

            // use the .position() function from jquery.ui if available
            // requires both jquery and jquery-ui to be loaded
            if (window.jQuery && window.jQuery.ui) {
                that.container.position({ my: "left top", at: "left bottom", of: that.target, collision: "none flip" });
            }
            else {
                var scrollTop = $document[0].body.scrollTop || $document[0].documentElement.scrollTop || $window.pageYOffset,
                    scrollLeft = $document[0].body.scrollLeft || $document[0].documentElement.scrollLeft || $window.pageXOffset;

                that.container.css({ "left": rect.left + scrollLeft + "px" });
                that.container.css({ "top": rect.top + rect.height + scrollTop + "px" });
            }
        }

        function _updateTextBox() {
            if (that.selectedIndex === -1) {
                return;
            }

            var item = that.renderItems[that.selectedIndex];
            var textboxValue;

            // first check if the data is a simple string type 
            if (angular.isString(item.data)) {
                textboxValue = item.data;
            }
            else {
                textboxValue = item.value;
            }

            // update the textbox 
            _updateModel(textboxValue);

            return item.data;
        }

        function _updateModel(modelValue) {
            // update only if different from current value
            if (modelValue !== that.textModelCtrl.$modelValue) {
                that.textModelCtrl.$setViewValue(modelValue);
                that.textModelCtrl.$render();

                selectedText = modelValue;
            }
        }

        function _renderItem(item) {
            return {
                value: item,
                label: $sce.trustAsHtml("<span>" + item + "</span>")
            };
        }


        autoCompleteService.defaultOptionsDoc = function () {
            return defaultOptionsDoc;
        }
    }

    function autoCompleteService() {
        var directiveCtrls = [];

        this.addDirectiveCtrl = function (ctrl) {
            if (ctrl) {
                directiveCtrls.push(ctrl);
            }
        }

        this.hideIfInactive = function (ctrl) {
            angular.forEach(directiveCtrls, function (value) {
                value.hideIfInactive();
            });
        }
    }

    var KEYCODE = {
        ENTER: 13,
        ESCAPE: 27,
        UPARROW: 38,
        DOWNARROW: 40
    };

    var instanceCount = 0;

    var defaultOptions = {
        containerCssClass: "",
        selectedCssClass: "auto-complete-item-selected",
        minimumChars: "1",
        maxItemsToRender: 20,
        dropdownWidth: "auto",
        dropdownHeight: "auto",
        dropdownParent: undefined,
        loading: angular.noop,
        data: angular.noop,
        loadingComplete: angular.noop,
        renderItem: angular.noop,
        itemSelected: angular.noop,
        dropdownShown: angular.noop,
        dropdownHidden: angular.noop
    };

    var defaultOptionsDoc = {
        containerCssClass: { def: "undefined", doc: "CSS class applied to the dropdown container" },
        selectedCssClass: { def: "auto-complete-item-selected", doc: "CSS class applied to the selected list element" },
        minimumChars: { def: "1", doc: "Minimum number of characters required to display the dropdown." },
        maxItemsToRender: { def: "20", doc: "Maximum number of items to render in the list." },
        dropdownWidth: { def: "auto", doc: "Width in 'px' of the dropddown list." },
        dropdownHeight: { def: "auto", doc: "Height in 'px' of the dropddown list." },
        dropdownParent: { def: "undefined", doc: "a jQuery object to append the dropddown list." },
        loading: { def: "noop", doc: "Callback before getting the data for the dropdown." },
        data: { def: "noop", doc: "Callback for data for the dropdown. Must return a promise" },
        loadingComplete: { def: "noop", doc: "Callback after the items are rendered in the dropdown." },
        renderItem: { def: "noop", doc: "Callback for custom rendering a list item. This is called for each item in the dropdown. It must return an object literal with 'value' and 'label' properties, where label is the safe html for display and value is the text for the textbox" },
        itemSelected: { def: "noop", doc: "Callback after an item is selected from the dropdown." },
        dropdownShown: { def: "noop", doc: "Callback after the dropdown is hidden." },
        dropdownHidden: { def: "noop", doc: "Callback after the dropdown is shown." }
    };

})();
