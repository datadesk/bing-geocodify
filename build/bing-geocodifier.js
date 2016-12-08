(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){

/**
 * Module dependencies.
 */

var now = require('date-now');

/**
 * Returns a function, that, as long as it continues to be invoked, will not
 * be triggered. The function will be called after it stops being called for
 * N milliseconds. If `immediate` is passed, trigger the function on the
 * leading edge, instead of the trailing.
 *
 * @source underscore.js
 * @see http://unscriptable.com/2009/03/20/debouncing-javascript-methods/
 * @param {Function} function to wrap
 * @param {Number} timeout in ms (`100`)
 * @param {Boolean} whether to execute at the beginning (`false`)
 * @api public
 */

module.exports = function debounce(func, wait, immediate){
  var timeout, args, context, timestamp, result;
  if (null == wait) wait = 100;

  function later() {
    var last = now() - timestamp;

    if (last < wait && last > 0) {
      timeout = setTimeout(later, wait - last);
    } else {
      timeout = null;
      if (!immediate) {
        result = func.apply(context, args);
        if (!timeout) context = args = null;
      }
    }
  };

  return function debounced() {
    context = this;
    args = arguments;
    timestamp = now();
    var callNow = immediate && !timeout;
    if (!timeout) timeout = setTimeout(later, wait);
    if (callNow) {
      result = func.apply(context, args);
      context = args = null;
    }

    return result;
  };
};

},{"date-now":2}],2:[function(require,module,exports){
module.exports = Date.now || now

function now() {
    return new Date().getTime()
}

},{}],3:[function(require,module,exports){
// var BingGeocoder = require('tribune-bing-geocoder').BingGeocoder;
var debounce = require('debounce');

var jsonp = {
    callbackCounter: 0,
    head: document.getElementsByTagName('head')[0],
    fetch: function(url, callback) {
        var fn = 'JSONPCallback_' + this.callbackCounter++;
        window[fn] = this.evalJSONP(callback);
        url = url.replace('=JSONPCallback', '=' + fn);

        var scriptTag = document.createElement('script');
        scriptTag.src = url;
        this.head.appendChild(scriptTag);

    },

    evalJSONP: function(callback) {
        this.head.removeChild(this.head.childNodes[this.head.childNodes.length - 1]);

        return function(data) {
            callback(data);
        };
    }
};

var BingGeocodifier = function(el, params) {
    this.el = document.getElementById(el);
    this.bingApiKey = params.key || null;
    // this.geocoder = new BingGeocoder(params.key);
    this.results = null;
    this.filters = params.filters || null;
    this.selectedResult = null;


    this.lookupForm = document.createElement("form");
    this.lookupForm.id = 'bing-geocodifier-form';
    this.lookupForm.className = 'geocodifier-form';
    this.textInput = document.createElement("input");
    this.textInput.setAttribute("type", "text");
    this.textInput.setAttribute("autocomplete", "off");
    this.textInput.className = "geocodify-input";

    if (params.defaultText) {
        this.textInput.setAttribute("placeholder", params.defaultText);
    } else {
        this.textInput.setAttribute("placeholder", "Search an address");
    }

    this.dropdown = document.createElement("div");
    this.dropdown.className = "geocodify-dropdown hidden";
    this.id = "bing-geocodifier-dropdown";

    this.lookupForm.appendChild(this.textInput);
    this.lookupForm.appendChild(this.dropdown);
    this.el.appendChild(this.lookupForm);

    if (params.onClick) {
        this.onItemClick = params.onClick;
    }

    var self = this;

    this.lookupForm.addEventListener('keyup', this.onKeyUp.bind(this));
    this.lookupForm.addEventListener('click', this.onClick.bind(this));
};

BingGeocodifier.prototype.bingApiUrl = 'https://dev.virtualearth.net/REST/v1/Locations/';

BingGeocodifier.prototype.onItemClick = function(item) {

};

BingGeocodifier.prototype.onClick = function(e) {
    var target = e.target;

    if (target.tagName.toLowerCase() === 'li') {
        var siblings = target.parentNode.children,
            item, coords;

        for (var i = 0; i < siblings.length; i += 1) {
            if (target.parentNode.children[i] === e.target) {
                item = this.results[i];
                coords = item.geocodePoints[0].coordinates;

                this.fillTextInput(item);
            }
        }

    }
};


BingGeocodifier.prototype.fillTextInput = function(item) {
    // Don't call if this is already the value in the text box
    if (this.textInput.value !== item.name) {
        this.textInput.value = item.name;
        this.dropdown.classList.add("hidden");
        this.onItemClick(item, item.geocodePoints[0].coordinates);
    }
};

BingGeocodifier.prototype.onKeyUp = function(e) {
    switch(e.keyCode) {
        // escape, exit search drop down
        case 27:
            this.hideSearchDropDown();
            break;
        // enter
        case 13:
            e.stopPropagation();
            e.preventDefault();
            this.triggerKeySelect();
            break;
        // right arrow
        // Check if cursor is at the end of the selection string
        // If so, then autocomplete with the top returned result
        // (If that exists)
        case 39:
            if (this.textInput.selectionStart === this.textInput.value.length) {
               this.triggerKeySelect();
            }
            break;
        // Up arrow
        case 38:
            e.stopPropagation();
            e.preventDefault();

            document.querySelector('.active').classList.remove('active');

            if (this.selectedResult && this.selectedResult > 0) {
                this.selectedResult--;
            } else {
                this.selectedResult = this.results.length - 1;
            }

            document.querySelectorAll('.geocodify-dropdown li')[this.selectedResult].classList.add('active');
            break;
        // Down arrow
        case 40:
            e.stopPropagation();
            e.preventDefault();

            document.querySelector('.active').classList.remove('active');

            if (this.selectedResult < this.results.length - 1) {
                this.selectedResult++;
            } else {
                this.selectedResult = 0;
            }

            document.querySelectorAll('.geocodify-dropdown li')[this.selectedResult].classList.add('active');
            break;
        // Any other keypress
        default:
            this.getGeocodeData();
    }
};

BingGeocodifier.prototype.triggerKeySelect = function() {
    if (this.results && this.results.length > -1) {
        var index = this.selectedResult,
            item = this.results[index];

        this.fillTextInput(item);
    }

};



BingGeocodifier.prototype.filterResults = function(bingdata) {
    var results = bingdata.resourceSets[0].resources,
        self = this;

    function filterResults (result) {
        return result.address[filter] === self.filters[filter];
    }

    for (var filter in this.filters) {
        results = results.filter(filterResults);
    }

    return results;
};


BingGeocodifier.prototype.buildAutofillList = function() {
    var results = this.results;

    if (results.length > 0) {
        this.selectedResult = 0;
        this.dropdown.innerHTML = "";
        var searchDropdownList = document.createElement("ul");

        for (var i = 0; i < results.length; i += 1) {
            var listItem = document.createElement("li");
            listItem.textContent = results[i].name;

            if (i === 0) {
                listItem.classList.add("active");
            }

            searchDropdownList.appendChild(listItem);

        }

        this.dropdown.appendChild(searchDropdownList);
        this.dropdown.classList.remove("hidden");
    } else {
        // hide if nothing is selected
        this.dropdown.classList.add("hidden");
    }
};


BingGeocodifier.prototype.getGeocodeData = function(e) {
    var self = this;

    if (this.textInput.value.trim() !== '') {
        var toGeocode = this.textInput.value,
            url = this.bingApiUrl + "?q=" + encodeURIComponent(toGeocode) + '&key=' + this.bingApiKey + "&maxResults=10&jsonp=JSONPCallback";


        jsonp.fetch(url, function(data) {
            self.results = self.filterResults(data);
            self.buildAutofillList();
        });
    }
};


BingGeocodifier.prototype.hideSearchDropDown = function() {
    this.dropdown.innerHTML = "";
    this.dropdown.classList.add("hidden");
    this.textInput.value = '';
};

window.BingGeocodifier = BingGeocodifier;

},{"debounce":1}]},{},[3])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvZGVib3VuY2UvaW5kZXguanMiLCJub2RlX21vZHVsZXMvZGVib3VuY2Uvbm9kZV9tb2R1bGVzL2RhdGUtbm93L2luZGV4LmpzIiwic3JjL2JpbmctZ2VvY29kaWZpZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiXG4vKipcbiAqIE1vZHVsZSBkZXBlbmRlbmNpZXMuXG4gKi9cblxudmFyIG5vdyA9IHJlcXVpcmUoJ2RhdGUtbm93Jyk7XG5cbi8qKlxuICogUmV0dXJucyBhIGZ1bmN0aW9uLCB0aGF0LCBhcyBsb25nIGFzIGl0IGNvbnRpbnVlcyB0byBiZSBpbnZva2VkLCB3aWxsIG5vdFxuICogYmUgdHJpZ2dlcmVkLiBUaGUgZnVuY3Rpb24gd2lsbCBiZSBjYWxsZWQgYWZ0ZXIgaXQgc3RvcHMgYmVpbmcgY2FsbGVkIGZvclxuICogTiBtaWxsaXNlY29uZHMuIElmIGBpbW1lZGlhdGVgIGlzIHBhc3NlZCwgdHJpZ2dlciB0aGUgZnVuY3Rpb24gb24gdGhlXG4gKiBsZWFkaW5nIGVkZ2UsIGluc3RlYWQgb2YgdGhlIHRyYWlsaW5nLlxuICpcbiAqIEBzb3VyY2UgdW5kZXJzY29yZS5qc1xuICogQHNlZSBodHRwOi8vdW5zY3JpcHRhYmxlLmNvbS8yMDA5LzAzLzIwL2RlYm91bmNpbmctamF2YXNjcmlwdC1tZXRob2RzL1xuICogQHBhcmFtIHtGdW5jdGlvbn0gZnVuY3Rpb24gdG8gd3JhcFxuICogQHBhcmFtIHtOdW1iZXJ9IHRpbWVvdXQgaW4gbXMgKGAxMDBgKVxuICogQHBhcmFtIHtCb29sZWFufSB3aGV0aGVyIHRvIGV4ZWN1dGUgYXQgdGhlIGJlZ2lubmluZyAoYGZhbHNlYClcbiAqIEBhcGkgcHVibGljXG4gKi9cblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBkZWJvdW5jZShmdW5jLCB3YWl0LCBpbW1lZGlhdGUpe1xuICB2YXIgdGltZW91dCwgYXJncywgY29udGV4dCwgdGltZXN0YW1wLCByZXN1bHQ7XG4gIGlmIChudWxsID09IHdhaXQpIHdhaXQgPSAxMDA7XG5cbiAgZnVuY3Rpb24gbGF0ZXIoKSB7XG4gICAgdmFyIGxhc3QgPSBub3coKSAtIHRpbWVzdGFtcDtcblxuICAgIGlmIChsYXN0IDwgd2FpdCAmJiBsYXN0ID4gMCkge1xuICAgICAgdGltZW91dCA9IHNldFRpbWVvdXQobGF0ZXIsIHdhaXQgLSBsYXN0KTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGltZW91dCA9IG51bGw7XG4gICAgICBpZiAoIWltbWVkaWF0ZSkge1xuICAgICAgICByZXN1bHQgPSBmdW5jLmFwcGx5KGNvbnRleHQsIGFyZ3MpO1xuICAgICAgICBpZiAoIXRpbWVvdXQpIGNvbnRleHQgPSBhcmdzID0gbnVsbDtcbiAgICAgIH1cbiAgICB9XG4gIH07XG5cbiAgcmV0dXJuIGZ1bmN0aW9uIGRlYm91bmNlZCgpIHtcbiAgICBjb250ZXh0ID0gdGhpcztcbiAgICBhcmdzID0gYXJndW1lbnRzO1xuICAgIHRpbWVzdGFtcCA9IG5vdygpO1xuICAgIHZhciBjYWxsTm93ID0gaW1tZWRpYXRlICYmICF0aW1lb3V0O1xuICAgIGlmICghdGltZW91dCkgdGltZW91dCA9IHNldFRpbWVvdXQobGF0ZXIsIHdhaXQpO1xuICAgIGlmIChjYWxsTm93KSB7XG4gICAgICByZXN1bHQgPSBmdW5jLmFwcGx5KGNvbnRleHQsIGFyZ3MpO1xuICAgICAgY29udGV4dCA9IGFyZ3MgPSBudWxsO1xuICAgIH1cblxuICAgIHJldHVybiByZXN1bHQ7XG4gIH07XG59O1xuIiwibW9kdWxlLmV4cG9ydHMgPSBEYXRlLm5vdyB8fCBub3dcblxuZnVuY3Rpb24gbm93KCkge1xuICAgIHJldHVybiBuZXcgRGF0ZSgpLmdldFRpbWUoKVxufVxuIiwiLy8gdmFyIEJpbmdHZW9jb2RlciA9IHJlcXVpcmUoJ3RyaWJ1bmUtYmluZy1nZW9jb2RlcicpLkJpbmdHZW9jb2RlcjtcbnZhciBkZWJvdW5jZSA9IHJlcXVpcmUoJ2RlYm91bmNlJyk7XG5cbnZhciBqc29ucCA9IHtcbiAgICBjYWxsYmFja0NvdW50ZXI6IDAsXG4gICAgaGVhZDogZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2hlYWQnKVswXSxcbiAgICBmZXRjaDogZnVuY3Rpb24odXJsLCBjYWxsYmFjaykge1xuICAgICAgICB2YXIgZm4gPSAnSlNPTlBDYWxsYmFja18nICsgdGhpcy5jYWxsYmFja0NvdW50ZXIrKztcbiAgICAgICAgd2luZG93W2ZuXSA9IHRoaXMuZXZhbEpTT05QKGNhbGxiYWNrKTtcbiAgICAgICAgdXJsID0gdXJsLnJlcGxhY2UoJz1KU09OUENhbGxiYWNrJywgJz0nICsgZm4pO1xuXG4gICAgICAgIHZhciBzY3JpcHRUYWcgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzY3JpcHQnKTtcbiAgICAgICAgc2NyaXB0VGFnLnNyYyA9IHVybDtcbiAgICAgICAgdGhpcy5oZWFkLmFwcGVuZENoaWxkKHNjcmlwdFRhZyk7XG5cbiAgICB9LFxuXG4gICAgZXZhbEpTT05QOiBmdW5jdGlvbihjYWxsYmFjaykge1xuICAgICAgICB0aGlzLmhlYWQucmVtb3ZlQ2hpbGQodGhpcy5oZWFkLmNoaWxkTm9kZXNbdGhpcy5oZWFkLmNoaWxkTm9kZXMubGVuZ3RoIC0gMV0pO1xuXG4gICAgICAgIHJldHVybiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICAgICBjYWxsYmFjayhkYXRhKTtcbiAgICAgICAgfTtcbiAgICB9XG59O1xuXG52YXIgQmluZ0dlb2NvZGlmaWVyID0gZnVuY3Rpb24oZWwsIHBhcmFtcykge1xuICAgIHRoaXMuZWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChlbCk7XG4gICAgdGhpcy5iaW5nQXBpS2V5ID0gcGFyYW1zLmtleSB8fCBudWxsO1xuICAgIC8vIHRoaXMuZ2VvY29kZXIgPSBuZXcgQmluZ0dlb2NvZGVyKHBhcmFtcy5rZXkpO1xuICAgIHRoaXMucmVzdWx0cyA9IG51bGw7XG4gICAgdGhpcy5maWx0ZXJzID0gcGFyYW1zLmZpbHRlcnMgfHwgbnVsbDtcbiAgICB0aGlzLnNlbGVjdGVkUmVzdWx0ID0gbnVsbDtcblxuXG4gICAgdGhpcy5sb29rdXBGb3JtID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImZvcm1cIik7XG4gICAgdGhpcy5sb29rdXBGb3JtLmlkID0gJ2JpbmctZ2VvY29kaWZpZXItZm9ybSc7XG4gICAgdGhpcy5sb29rdXBGb3JtLmNsYXNzTmFtZSA9ICdnZW9jb2RpZmllci1mb3JtJztcbiAgICB0aGlzLnRleHRJbnB1dCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJpbnB1dFwiKTtcbiAgICB0aGlzLnRleHRJbnB1dC5zZXRBdHRyaWJ1dGUoXCJ0eXBlXCIsIFwidGV4dFwiKTtcbiAgICB0aGlzLnRleHRJbnB1dC5zZXRBdHRyaWJ1dGUoXCJhdXRvY29tcGxldGVcIiwgXCJvZmZcIik7XG4gICAgdGhpcy50ZXh0SW5wdXQuY2xhc3NOYW1lID0gXCJnZW9jb2RpZnktaW5wdXRcIjtcblxuICAgIGlmIChwYXJhbXMuZGVmYXVsdFRleHQpIHtcbiAgICAgICAgdGhpcy50ZXh0SW5wdXQuc2V0QXR0cmlidXRlKFwicGxhY2Vob2xkZXJcIiwgcGFyYW1zLmRlZmF1bHRUZXh0KTtcbiAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLnRleHRJbnB1dC5zZXRBdHRyaWJ1dGUoXCJwbGFjZWhvbGRlclwiLCBcIlNlYXJjaCBhbiBhZGRyZXNzXCIpO1xuICAgIH1cblxuICAgIHRoaXMuZHJvcGRvd24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICAgIHRoaXMuZHJvcGRvd24uY2xhc3NOYW1lID0gXCJnZW9jb2RpZnktZHJvcGRvd24gaGlkZGVuXCI7XG4gICAgdGhpcy5pZCA9IFwiYmluZy1nZW9jb2RpZmllci1kcm9wZG93blwiO1xuXG4gICAgdGhpcy5sb29rdXBGb3JtLmFwcGVuZENoaWxkKHRoaXMudGV4dElucHV0KTtcbiAgICB0aGlzLmxvb2t1cEZvcm0uYXBwZW5kQ2hpbGQodGhpcy5kcm9wZG93bik7XG4gICAgdGhpcy5lbC5hcHBlbmRDaGlsZCh0aGlzLmxvb2t1cEZvcm0pO1xuXG4gICAgaWYgKHBhcmFtcy5vbkNsaWNrKSB7XG4gICAgICAgIHRoaXMub25JdGVtQ2xpY2sgPSBwYXJhbXMub25DbGljaztcbiAgICB9XG5cbiAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICB0aGlzLmxvb2t1cEZvcm0uYWRkRXZlbnRMaXN0ZW5lcigna2V5dXAnLCB0aGlzLm9uS2V5VXAuYmluZCh0aGlzKSk7XG4gICAgdGhpcy5sb29rdXBGb3JtLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgdGhpcy5vbkNsaWNrLmJpbmQodGhpcykpO1xufTtcblxuQmluZ0dlb2NvZGlmaWVyLnByb3RvdHlwZS5iaW5nQXBpVXJsID0gJ2h0dHBzOi8vZGV2LnZpcnR1YWxlYXJ0aC5uZXQvUkVTVC92MS9Mb2NhdGlvbnMvJztcblxuQmluZ0dlb2NvZGlmaWVyLnByb3RvdHlwZS5vbkl0ZW1DbGljayA9IGZ1bmN0aW9uKGl0ZW0pIHtcblxufTtcblxuQmluZ0dlb2NvZGlmaWVyLnByb3RvdHlwZS5vbkNsaWNrID0gZnVuY3Rpb24oZSkge1xuICAgIHZhciB0YXJnZXQgPSBlLnRhcmdldDtcblxuICAgIGlmICh0YXJnZXQudGFnTmFtZS50b0xvd2VyQ2FzZSgpID09PSAnbGknKSB7XG4gICAgICAgIHZhciBzaWJsaW5ncyA9IHRhcmdldC5wYXJlbnROb2RlLmNoaWxkcmVuLFxuICAgICAgICAgICAgaXRlbSwgY29vcmRzO1xuXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc2libGluZ3MubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgICAgICAgIGlmICh0YXJnZXQucGFyZW50Tm9kZS5jaGlsZHJlbltpXSA9PT0gZS50YXJnZXQpIHtcbiAgICAgICAgICAgICAgICBpdGVtID0gdGhpcy5yZXN1bHRzW2ldO1xuICAgICAgICAgICAgICAgIGNvb3JkcyA9IGl0ZW0uZ2VvY29kZVBvaW50c1swXS5jb29yZGluYXRlcztcblxuICAgICAgICAgICAgICAgIHRoaXMuZmlsbFRleHRJbnB1dChpdGVtKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgfVxufTtcblxuXG5CaW5nR2VvY29kaWZpZXIucHJvdG90eXBlLmZpbGxUZXh0SW5wdXQgPSBmdW5jdGlvbihpdGVtKSB7XG4gICAgLy8gRG9uJ3QgY2FsbCBpZiB0aGlzIGlzIGFscmVhZHkgdGhlIHZhbHVlIGluIHRoZSB0ZXh0IGJveFxuICAgIGlmICh0aGlzLnRleHRJbnB1dC52YWx1ZSAhPT0gaXRlbS5uYW1lKSB7XG4gICAgICAgIHRoaXMudGV4dElucHV0LnZhbHVlID0gaXRlbS5uYW1lO1xuICAgICAgICB0aGlzLmRyb3Bkb3duLmNsYXNzTGlzdC5hZGQoXCJoaWRkZW5cIik7XG4gICAgICAgIHRoaXMub25JdGVtQ2xpY2soaXRlbSwgaXRlbS5nZW9jb2RlUG9pbnRzWzBdLmNvb3JkaW5hdGVzKTtcbiAgICB9XG59O1xuXG5CaW5nR2VvY29kaWZpZXIucHJvdG90eXBlLm9uS2V5VXAgPSBmdW5jdGlvbihlKSB7XG4gICAgc3dpdGNoKGUua2V5Q29kZSkge1xuICAgICAgICAvLyBlc2NhcGUsIGV4aXQgc2VhcmNoIGRyb3AgZG93blxuICAgICAgICBjYXNlIDI3OlxuICAgICAgICAgICAgdGhpcy5oaWRlU2VhcmNoRHJvcERvd24oKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAvLyBlbnRlclxuICAgICAgICBjYXNlIDEzOlxuICAgICAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgIHRoaXMudHJpZ2dlcktleVNlbGVjdCgpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIC8vIHJpZ2h0IGFycm93XG4gICAgICAgIC8vIENoZWNrIGlmIGN1cnNvciBpcyBhdCB0aGUgZW5kIG9mIHRoZSBzZWxlY3Rpb24gc3RyaW5nXG4gICAgICAgIC8vIElmIHNvLCB0aGVuIGF1dG9jb21wbGV0ZSB3aXRoIHRoZSB0b3AgcmV0dXJuZWQgcmVzdWx0XG4gICAgICAgIC8vIChJZiB0aGF0IGV4aXN0cylcbiAgICAgICAgY2FzZSAzOTpcbiAgICAgICAgICAgIGlmICh0aGlzLnRleHRJbnB1dC5zZWxlY3Rpb25TdGFydCA9PT0gdGhpcy50ZXh0SW5wdXQudmFsdWUubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICB0aGlzLnRyaWdnZXJLZXlTZWxlY3QoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAvLyBVcCBhcnJvd1xuICAgICAgICBjYXNlIDM4OlxuICAgICAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcblxuICAgICAgICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLmFjdGl2ZScpLmNsYXNzTGlzdC5yZW1vdmUoJ2FjdGl2ZScpO1xuXG4gICAgICAgICAgICBpZiAodGhpcy5zZWxlY3RlZFJlc3VsdCAmJiB0aGlzLnNlbGVjdGVkUmVzdWx0ID4gMCkge1xuICAgICAgICAgICAgICAgIHRoaXMuc2VsZWN0ZWRSZXN1bHQtLTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5zZWxlY3RlZFJlc3VsdCA9IHRoaXMucmVzdWx0cy5sZW5ndGggLSAxO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcuZ2VvY29kaWZ5LWRyb3Bkb3duIGxpJylbdGhpcy5zZWxlY3RlZFJlc3VsdF0uY2xhc3NMaXN0LmFkZCgnYWN0aXZlJyk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgLy8gRG93biBhcnJvd1xuICAgICAgICBjYXNlIDQwOlxuICAgICAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcblxuICAgICAgICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLmFjdGl2ZScpLmNsYXNzTGlzdC5yZW1vdmUoJ2FjdGl2ZScpO1xuXG4gICAgICAgICAgICBpZiAodGhpcy5zZWxlY3RlZFJlc3VsdCA8IHRoaXMucmVzdWx0cy5sZW5ndGggLSAxKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5zZWxlY3RlZFJlc3VsdCsrO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLnNlbGVjdGVkUmVzdWx0ID0gMDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLmdlb2NvZGlmeS1kcm9wZG93biBsaScpW3RoaXMuc2VsZWN0ZWRSZXN1bHRdLmNsYXNzTGlzdC5hZGQoJ2FjdGl2ZScpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIC8vIEFueSBvdGhlciBrZXlwcmVzc1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgdGhpcy5nZXRHZW9jb2RlRGF0YSgpO1xuICAgIH1cbn07XG5cbkJpbmdHZW9jb2RpZmllci5wcm90b3R5cGUudHJpZ2dlcktleVNlbGVjdCA9IGZ1bmN0aW9uKCkge1xuICAgIGlmICh0aGlzLnJlc3VsdHMgJiYgdGhpcy5yZXN1bHRzLmxlbmd0aCA+IC0xKSB7XG4gICAgICAgIHZhciBpbmRleCA9IHRoaXMuc2VsZWN0ZWRSZXN1bHQsXG4gICAgICAgICAgICBpdGVtID0gdGhpcy5yZXN1bHRzW2luZGV4XTtcblxuICAgICAgICB0aGlzLmZpbGxUZXh0SW5wdXQoaXRlbSk7XG4gICAgfVxuXG59O1xuXG5cblxuQmluZ0dlb2NvZGlmaWVyLnByb3RvdHlwZS5maWx0ZXJSZXN1bHRzID0gZnVuY3Rpb24oYmluZ2RhdGEpIHtcbiAgICB2YXIgcmVzdWx0cyA9IGJpbmdkYXRhLnJlc291cmNlU2V0c1swXS5yZXNvdXJjZXMsXG4gICAgICAgIHNlbGYgPSB0aGlzO1xuXG4gICAgZnVuY3Rpb24gZmlsdGVyUmVzdWx0cyAocmVzdWx0KSB7XG4gICAgICAgIHJldHVybiByZXN1bHQuYWRkcmVzc1tmaWx0ZXJdID09PSBzZWxmLmZpbHRlcnNbZmlsdGVyXTtcbiAgICB9XG5cbiAgICBmb3IgKHZhciBmaWx0ZXIgaW4gdGhpcy5maWx0ZXJzKSB7XG4gICAgICAgIHJlc3VsdHMgPSByZXN1bHRzLmZpbHRlcihmaWx0ZXJSZXN1bHRzKTtcbiAgICB9XG5cbiAgICByZXR1cm4gcmVzdWx0cztcbn07XG5cblxuQmluZ0dlb2NvZGlmaWVyLnByb3RvdHlwZS5idWlsZEF1dG9maWxsTGlzdCA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciByZXN1bHRzID0gdGhpcy5yZXN1bHRzO1xuXG4gICAgaWYgKHJlc3VsdHMubGVuZ3RoID4gMCkge1xuICAgICAgICB0aGlzLnNlbGVjdGVkUmVzdWx0ID0gMDtcbiAgICAgICAgdGhpcy5kcm9wZG93bi5pbm5lckhUTUwgPSBcIlwiO1xuICAgICAgICB2YXIgc2VhcmNoRHJvcGRvd25MaXN0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInVsXCIpO1xuXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcmVzdWx0cy5sZW5ndGg7IGkgKz0gMSkge1xuICAgICAgICAgICAgdmFyIGxpc3RJdGVtID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImxpXCIpO1xuICAgICAgICAgICAgbGlzdEl0ZW0udGV4dENvbnRlbnQgPSByZXN1bHRzW2ldLm5hbWU7XG5cbiAgICAgICAgICAgIGlmIChpID09PSAwKSB7XG4gICAgICAgICAgICAgICAgbGlzdEl0ZW0uY2xhc3NMaXN0LmFkZChcImFjdGl2ZVwiKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgc2VhcmNoRHJvcGRvd25MaXN0LmFwcGVuZENoaWxkKGxpc3RJdGVtKTtcblxuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5kcm9wZG93bi5hcHBlbmRDaGlsZChzZWFyY2hEcm9wZG93bkxpc3QpO1xuICAgICAgICB0aGlzLmRyb3Bkb3duLmNsYXNzTGlzdC5yZW1vdmUoXCJoaWRkZW5cIik7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgLy8gaGlkZSBpZiBub3RoaW5nIGlzIHNlbGVjdGVkXG4gICAgICAgIHRoaXMuZHJvcGRvd24uY2xhc3NMaXN0LmFkZChcImhpZGRlblwiKTtcbiAgICB9XG59O1xuXG5cbkJpbmdHZW9jb2RpZmllci5wcm90b3R5cGUuZ2V0R2VvY29kZURhdGEgPSBmdW5jdGlvbihlKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgaWYgKHRoaXMudGV4dElucHV0LnZhbHVlLnRyaW0oKSAhPT0gJycpIHtcbiAgICAgICAgdmFyIHRvR2VvY29kZSA9IHRoaXMudGV4dElucHV0LnZhbHVlLFxuICAgICAgICAgICAgdXJsID0gdGhpcy5iaW5nQXBpVXJsICsgXCI/cT1cIiArIGVuY29kZVVSSUNvbXBvbmVudCh0b0dlb2NvZGUpICsgJyZrZXk9JyArIHRoaXMuYmluZ0FwaUtleSArIFwiJm1heFJlc3VsdHM9MTAmanNvbnA9SlNPTlBDYWxsYmFja1wiO1xuXG5cbiAgICAgICAganNvbnAuZmV0Y2godXJsLCBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICAgICBzZWxmLnJlc3VsdHMgPSBzZWxmLmZpbHRlclJlc3VsdHMoZGF0YSk7XG4gICAgICAgICAgICBzZWxmLmJ1aWxkQXV0b2ZpbGxMaXN0KCk7XG4gICAgICAgIH0pO1xuICAgIH1cbn07XG5cblxuQmluZ0dlb2NvZGlmaWVyLnByb3RvdHlwZS5oaWRlU2VhcmNoRHJvcERvd24gPSBmdW5jdGlvbigpIHtcbiAgICB0aGlzLmRyb3Bkb3duLmlubmVySFRNTCA9IFwiXCI7XG4gICAgdGhpcy5kcm9wZG93bi5jbGFzc0xpc3QuYWRkKFwiaGlkZGVuXCIpO1xuICAgIHRoaXMudGV4dElucHV0LnZhbHVlID0gJyc7XG59O1xuXG53aW5kb3cuQmluZ0dlb2NvZGlmaWVyID0gQmluZ0dlb2NvZGlmaWVyO1xuIl19
