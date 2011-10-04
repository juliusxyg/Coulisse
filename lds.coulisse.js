/**
@license LuvDaSun Coulisse - v0.8 - 2011-03-01
http://coulisse.luvdasun.com/

Copyright 2010-2011 "Elmer Bulthuis" <elmerbulthuis@gmail.com>
Dual licensed under the MIT and GPL licenses.
*/

(function () {
    var global = this;

    /**
    @namespace
    */
    this.lds = this.lds || {};

    /**
    Execute the specified getter on the specified object-instance and return the result
    @inner
    @function
    @param {Object} instance the object to execute the getter on
    @param {string|function(...[Object]):string} [getter]
    @returns {Object}
    */
    var executeGetter = function (instance, getter) {
        if (!getter) return instance;

        var typeofGetter = typeof getter;

        switch (typeofGetter) {
            case 'function':
                return getter.apply(instance);
                break;

            case 'string':
            case 'number':
                var member = instance[getter];
                var typeofMember = typeof member;
                switch (typeofMember) {
                    case 'function':
                        return member();
                        break;

                    default:
                        return member;
                }
                break;

            case 'object':
                switch (getter.constructor) {
                    case Array:
                        if (getter.length == 0) return instance;
                        else return executeGetter(executeGetter(instance, getter[0]), getter.slice(1));

                    default:
                        throw 'unknown object is not supported as a getter'
                }
                break;

            default:
                throw typeofGetter + ' is not supported as a getter'
        }
    };

    /**
    bind an event-handler to an object instance
    @inner
    @function
    @param {Object} instance the instance to bind the event to
    @param {string} eventName name of the event
    @param {function(Object)} handler that is triggered when the event is fired
    */
    var bindEvent = function (instance, eventName, handler) {
        if ('addEventListener' in instance) instance.addEventListener(eventName, handler, false);
        else if ('attachEvent' in instance) instance.attachEvent('on' + eventName, handler);
        else throw '' + eventName + ' event could not be bound';
    };
    /**
    unbind an event-handler from an object instance
    @inner
    @function
    @param {Object} instance the instance to unbind the event from
    @param {string} eventName name of the event
    @param {function(Object)} handler reference to the function that is being unbound
    */
    var unbindEvent = function (instance, eventName, handler) {
        if ('removeEventListener' in instance) instance.removeEventListener(eventName, handler, false);
        else if ('detachEvent' in instance) instance.detachEvent('on' + eventName, handler);
        else throw '' + eventName + ' event could not be unbound';
    };

    var lastAnimationHandle = 0;
    var animationHandles = {};
    /**
    @inner
    @function
    @param {number} offsetValue
    @param {number} targetValue
    @param {function(number,boolean)} onLoop
    @param {function(number,number,number,number,number):number} onCalculate
    @param {number} duration
    @param {number} interval
    @returns {number}
    */
    var setAnimation = function (offsetValue, targetValue, onLoop, onCalculate, duration, interval) {
        var animationHandle = ++lastAnimationHandle;
        var windowValue = targetValue - offsetValue;
        var offsetTimestamp = (new Date()).getTime();
        var loop = function () {
            var loopTimestamp = (new Date()).getTime();
            var time = loopTimestamp - offsetTimestamp;
            if (time < duration) {
                var loopValue = onCalculate(offsetValue, targetValue, windowValue, time, duration);
                onLoop(loopValue, false);
                animationHandles[animationHandle] = window.setTimeout(loop, interval);
            }
            else {
                delete animationHandles[animationHandle];
                onLoop(targetValue, true);
            }
        };
        loop();
        return animationHandle;
    };
    /**
    @inner
    @function
    @param {number} animationHandle
    */
    var clearAnimation = function (animationHandle) {
        window.clearTimeout(animationHandles[animationHandle]);
        delete animationHandles[animationHandle];
    };


    /**
    @inner
    @function
    @param {CanvasRenderingContext2D} context
    @param {HTMLImage|HTMLCanvas} source
    @param {number} pinch
    @param {number} [sliceCount]
    */
    var pinchLeft = function (context, source, pinch, sliceCount) {
        var canvasWidth = context.canvas.width;
        var canvasHeight = context.canvas.height;
        var sourceWidth = source.width;
        var sourceHeight = source.height;

        sliceCount = sliceCount || canvasWidth;
        for (var sliceIndex = 0; sliceIndex < sliceCount; sliceIndex++) {
            var sourceSliceLeft = Math.floor(sourceWidth * sliceIndex / sliceCount);
            var sourceSliceRight = Math.ceil(sourceWidth * (sliceIndex + 1) / sliceCount);

            var canvasSliceLeft = Math.floor(canvasWidth * sliceIndex / sliceCount);
            var canvasSliceRight = Math.ceil(canvasWidth * (sliceIndex + 1) / sliceCount);

            var canvasSlicePinch = pinch * canvasHeight * (sliceCount - sliceIndex - 1) / (sliceCount - 1);

            context.drawImage(
            source
            , sourceSliceLeft, 0, sourceSliceRight - sourceSliceLeft, sourceHeight
            , canvasSliceLeft, canvasSlicePinch / 2, canvasSliceRight - canvasSliceLeft, canvasHeight - canvasSlicePinch
            );
        }
    };

    /**
    @inner
    @function
    @param {CanvasRenderingContext2D} context
    @param {HTMLImage|HTMLCanvas} source
    @param {number} pinch
    @param {number} [sliceCount]
    */
    var pinchRight = function (context, source, pinch, sliceCount) {
        var canvasWidth = context.canvas.width;
        var canvasHeight = context.canvas.height;
        var sourceWidth = source.width;
        var sourceHeight = source.height;

        sliceCount = sliceCount || canvasWidth;
        for (var sliceIndex = 0; sliceIndex < sliceCount; sliceIndex++) {
            var sourceSliceLeft = Math.floor(sourceWidth * sliceIndex / sliceCount);
            var sourceSliceRight = Math.ceil(sourceWidth * (sliceIndex + 1) / sliceCount);

            var canvasSliceLeft = Math.floor(canvasWidth * sliceIndex / sliceCount);
            var canvasSliceRight = Math.ceil(canvasWidth * (sliceIndex + 1) / sliceCount);

            var canvasSlicePinch = pinch * canvasHeight * sliceIndex / (sliceCount - 1);

            context.drawImage(
            source
            , sourceSliceLeft, 0, sourceSliceRight - sourceSliceLeft, sourceHeight
            , canvasSliceLeft, canvasSlicePinch / 2, canvasSliceRight - canvasSliceLeft, canvasHeight - canvasSlicePinch
            );
        }
    };


    /**
    @class
    @param {HTMLElement} container
    @param {Object} [options]
    */
    this.lds.Coulisse = function (container, options) {
        var coulisse = this;

        /**
        duration of the animation
        @field {number}
        */
        var duration = options.duration || 800;
        /**
        interval between animation steps (increase for better quality)
        @field {number}
        */
        var interval = options.interval || 20;
        /**
        slices of animating panels (increase or 0 for better quality)
        @field {number}
        */
        var sliceCount = options.sliceCount || 10;
        /**
        amount of the inactive panel that is visible (non-overlapped)
        @field {number}
        */
        var area = options.area || 0.5;
        /**
        amount of pinch for inactive panels
        @field {number}
        */
        var pinch = options.pinch || 0.2;
        /**
        width of inactive panels
        @field {number}
        */
        var scale = options.scale || 0.4;
        /**
        diagonal size of the active panel
        @field {number}
        */
        var activeSize = options.activeSize || 800;
        /**
        diagonal size of inactive panels
        @field {number}
        */
        var inactiveSize = options.inactiveSize || 400;

        /**
        event fired when an inactive panel is clicked
        @event
        */
        var onActivateIndex = options.onActivateIndex || null;
        /**
        event fired when the index starts changing
        @event
        */
        var onIndexChange = options.onIndexChange || null;
        /**
        event fired when the index has changed, but is not finished changing yet
        @event
        */
        var onIndexChanging = options.onIndexChanging || null;
        /**
        event fired when the index has finished changing
        @event
        */
        var onIndexChanged = options.onIndexChanged || null;

        /**
        @field {string}
        */
        var imageSrcGetter = options.imageSrcGetter || null;

        /**
        @field {string}
        */
        var linkHrefGetter = options.linkHrefGetter || null;


        var panels = [];
        /**
        @class
        @param {string} imageSrc
        */
        var Panel = function (panelIndex, imageSrc, linkHref) {
            var panel = this;
            var currentFaceIndex = null;
            var image = document.createElement('img');
            var link = linkHref ? document.createElement('a') : null;
            var canvas = ('HTMLCanvasElement' in global) ? document.createElement('canvas') : null;
            var context = canvas ? canvas.getContext('2d') : null;
            var loaded = false;
            var face = canvas || image;
            var element = link || face;
            var style = element.style;

            /**
            @function
            @param {Object} e
            */
            var elementClick = function (e) {
                if (index != panelIndex) {
                    if (!(onActivateIndex && onActivateIndex({ index: panelIndex }) === false)) {
                        coulisse.setIndex(panelIndex);
                    }
                    'preventDefault' in e && e.preventDefault();
                    return false;
                }
            };
            /**
            @function
            @param {Object} e
            */
            var imageLoad = function (e) {
                var imageWidth2 = image.width * image.width;
                var imageHeight2 = image.height * image.height;
                var imageDiagonal2 = imageWidth2 + imageHeight2;
                var imageDiagonal = Math.sqrt(imageDiagonal2);

                panel.activePanelWidth = image.width * activeSize / imageDiagonal;
                panel.activePanelHeight = image.height * activeSize / imageDiagonal;
                panel.inactivePanelWidth = scale * image.width * inactiveSize / imageDiagonal;
                panel.inactivePanelHeight = image.height * inactiveSize / imageDiagonal;
                panel.deltaWidth = panel.activePanelWidth - panel.inactivePanelWidth;
                panel.deltaHeight = panel.activePanelHeight - panel.inactivePanelHeight;

                if (link) {
                    link.appendChild(face);
                }
                container.appendChild(element);

                loaded = true;
                update(true);
            };

            /**
            (re)draw the panel
            @function
            @param {Object} state
            */
            this.drawPanel = function (state) {
                var result = true;

                if (!loaded) {
                    return result;
                }

                var display = true;
                var faceIndex = panelIndex - realIndex;
                var zIndex = state.panelCount - Math.abs(Math.round(faceIndex));

                if (faceIndex < 0) {
                    if (faceIndex > -1) {
                        var panel2 = panels[panelIndex + 1];
                        face.width = panel.inactivePanelWidth + panel.deltaWidth * state.realIndexModInv;
                        face.height = panel.inactivePanelHeight + panel.deltaHeight * state.realIndexModInv;
                        context && pinchRight(context, image, pinch * state.realIndexMod, sliceCount);
                        state.panelLeft = (container.offsetWidth - panel.activePanelWidth) / 2;
                        state.panelLeft -= (panel.inactivePanelWidth * area) * state.realIndexMod;
                        state.panelLeft -= (panel2.activePanelWidth - panel.activePanelWidth) / 2 * state.realIndexMod;
                    }
                    else {
                        if (currentFaceIndex > -1) {
                            face.width = panel.inactivePanelWidth;
                            face.height = panel.inactivePanelHeight;
                            context && pinchRight(context, image, pinch);
                        }
                        display = state.panelLeft >= 0 - face.width;
                        state.panelLeft -= face.width * area;
                    }
                    if (display) {
                        style.left = (state.panelLeft) + 'px';
                        style.right = '';
                    }
                }
                else if (faceIndex > 0) {
                    if (faceIndex < 1) {
                        var panel2 = panels[panelIndex - 1];
                        face.width = panel.inactivePanelWidth + panel.deltaWidth * state.realIndexMod;
                        face.height = panel.inactivePanelHeight + panel.deltaHeight * state.realIndexMod;
                        context && pinchLeft(context, image, pinch * state.realIndexModInv, sliceCount);
                        state.panelRight = (container.offsetWidth - panel.activePanelWidth) / 2;
                        state.panelRight -= (panel.inactivePanelWidth * area) * state.realIndexModInv;
                        state.panelRight -= (panel2.activePanelWidth - panel.activePanelWidth) / 2 * state.realIndexModInv;
                    }
                    else {
                        if (currentFaceIndex < 1) {
                            face.width = panel.inactivePanelWidth;
                            face.height = panel.inactivePanelHeight;
                            context && pinchLeft(context, image, pinch);
                        }
                        display = state.panelRight >= 0 - face.width;
                        state.panelRight -= face.width * area;
                    }
                    if (display) {
                        style.left = '';
                        style.right = (state.panelRight) + 'px';
                    }
                }
                else {
                    face.width = panel.activePanelWidth;
                    face.height = panel.activePanelHeight;
                    context && context.drawImage(image, 0, 0, image.width, image.height, 0, 0, face.width, face.height);
                    state.panelLeft = (container.offsetWidth - panel.activePanelWidth) / 2;
                    state.panelRight = (container.offsetWidth - panel.activePanelWidth) / 2;
                    if (display) {
                        style.left = (state.panelLeft) + 'px';
                        style.right = (state.panelRight) + 'px';
                    }
                }

                if (display) {
                    style.zIndex = zIndex;
                    style.top = style.bottom = ((container.offsetHeight - face.height) / 2) + 'px';
                    style.display = 'block';
                }
                else {
                    result = style.display != 'none';
                    style.display = 'none';
                }

                currentFaceIndex = faceIndex;

                return result;
            };


            /**
            destructor for the Panel object
            @function
            */
            this.destruct = function () {
                unbindEvent(element, 'click', elementClick);
                unbindEvent(image, 'load', imageLoad);

                container.removeChild(element);

                delete element;
                delete image;
                delete canvas;
            };

            //construct

            bindEvent(element, 'click', elementClick);
            bindEvent(image, 'load', imageLoad);

            style.display = 'none';
            style.position = 'absolute';

            if (link) link.href = linkHref;
            image.src = imageSrc;
        };


        /**
        @function
        @param {boolean} updateAll
        */
        var update = function (updateAll) {
            var panelCount = panels.length;

            if (!panelCount) return;

            var state = {
                panelLeft: null
                , panelRight: null
                , panelCount: panelCount
                , realIndexInt: parseInt(realIndex)
                , realIndexMod: realIndex % 1
                , realIndexModInv: 1 - realIndex % 1
            };

            for (var panelIndex = state.realIndexInt; panelIndex >= 0; panelIndex--) {
                var panel = panels[panelIndex];
                if (panel) {
                    if (!panel.drawPanel(state) && !updateAll) break;
                }
            }

            for (var panelIndex = state.realIndexInt + 1; panelIndex < state.panelCount; panelIndex++) {
                var panel = panels[panelIndex];
                if (panel) {
                    if (!panel.drawPanel(state) && !updateAll) break;
                }
            }

        };


        /**
        @function
        */
        var windowResize = function () {
            update(true);
        };

        /**
        @function
        @param {number} newRealIndex
        @param {boolean} isFinal
        */
        var animationLoop = function (newRealIndex, isFinal) {
            var newIndex = Math.round(newRealIndex);
            if (index != newIndex) {
                index = newIndex;
                onIndexChanging && onIndexChanging({ index: index });
            }
            if (realIndex != newRealIndex) {
                realIndex = newRealIndex;
                update(false);
            }
            isFinal && stopAnimation();
        };


        /**
        @function
        @param {number} offsetValue
        @param {number} windowValue
        @param {number} time
        @param {number} duration
        @returns {number}
        */
        var animationCalculate = options.animationCalculate || function (offsetValue, targetValue, windowValue, time, duration) {
            return offsetValue + windowValue * Math.sin(Math.PI * time / duration / 2);
        };


        /**
        Pointer to the animation
        @field {?number}
        @type {?number}
        */
        var animationHandle;
        /**
        @function
        @param {number} newRealIndex
        */
        var startAnimation = function (newRealIndex) {
            var newIndex = Math.round(newRealIndex);

            onIndexChange && onIndexChange({ index: newIndex });

            animationHandle = setAnimation(
            realIndex
            , newIndex
            , animationLoop
            , animationCalculate
            , duration
            , interval
            );
        };
        /**
        @function
        */
        var stopAnimation = function () {
            if (animationHandle) {
                clearAnimation(animationHandle);
                animationHandle = null;
                onIndexChanged && onIndexChanged({ index: index });
            }
        };


        /**
        index of the panel
        @field {number}
        */
        var index = options.index || 0;
        /**
        real index
        @field {number}
        */
        var realIndex = index;
        /**
        set index of the panel
        @function
        @param {number} index
        */
        this.setIndex = function (value) {
            stopAnimation();
            startAnimation(value);
        };
        /**
        get index of the panel
        @function
        @returns {number}
        */
        this.getIndex = function () {
            return index;
        };

        /**
        destructor for the Coulisse object
        @function
        */
        this.destruct = function () {
            stopAnimation();
            unbindEvent(window, 'resize', windowResize);
            for (var panel = panels.pop(); panel; panel = panels.pop()) {
                panel.destruct();
                delete panel;
            }
        };


        this.addImages = function (images) {
            for (var imageIndex = 0, imageCount = images.length; imageIndex < imageCount; imageIndex++) {
                var image = images[imageIndex];
                var imageSrc = executeGetter(image, imageSrcGetter);
                var linkHref = options.linkHrefGetter ? executeGetter(image, linkHrefGetter) : null;
                var panelIndex = panels.length;
                var panel = new Panel(panelIndex, imageSrc, linkHref)
                panels[panelIndex] = panel;
            }
        };
        this.countImages = function (images) {
            return panels.length;
        };


        //construct

        options.images && this.addImages(options.images);

        bindEvent(window, 'resize', windowResize);

        delete options;
    };
})();

