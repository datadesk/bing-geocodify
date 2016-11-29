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

    this.lookupForm.addEventListener('keydown', this.onKeyDown.bind(this));
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

BingGeocodifier.prototype.onKeyDown = function(e) {
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvZGVib3VuY2UvaW5kZXguanMiLCJub2RlX21vZHVsZXMvZGVib3VuY2Uvbm9kZV9tb2R1bGVzL2RhdGUtbm93L2luZGV4LmpzIiwic3JjL2JpbmctZ2VvY29kaWZpZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIlxuLyoqXG4gKiBNb2R1bGUgZGVwZW5kZW5jaWVzLlxuICovXG5cbnZhciBub3cgPSByZXF1aXJlKCdkYXRlLW5vdycpO1xuXG4vKipcbiAqIFJldHVybnMgYSBmdW5jdGlvbiwgdGhhdCwgYXMgbG9uZyBhcyBpdCBjb250aW51ZXMgdG8gYmUgaW52b2tlZCwgd2lsbCBub3RcbiAqIGJlIHRyaWdnZXJlZC4gVGhlIGZ1bmN0aW9uIHdpbGwgYmUgY2FsbGVkIGFmdGVyIGl0IHN0b3BzIGJlaW5nIGNhbGxlZCBmb3JcbiAqIE4gbWlsbGlzZWNvbmRzLiBJZiBgaW1tZWRpYXRlYCBpcyBwYXNzZWQsIHRyaWdnZXIgdGhlIGZ1bmN0aW9uIG9uIHRoZVxuICogbGVhZGluZyBlZGdlLCBpbnN0ZWFkIG9mIHRoZSB0cmFpbGluZy5cbiAqXG4gKiBAc291cmNlIHVuZGVyc2NvcmUuanNcbiAqIEBzZWUgaHR0cDovL3Vuc2NyaXB0YWJsZS5jb20vMjAwOS8wMy8yMC9kZWJvdW5jaW5nLWphdmFzY3JpcHQtbWV0aG9kcy9cbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZ1bmN0aW9uIHRvIHdyYXBcbiAqIEBwYXJhbSB7TnVtYmVyfSB0aW1lb3V0IGluIG1zIChgMTAwYClcbiAqIEBwYXJhbSB7Qm9vbGVhbn0gd2hldGhlciB0byBleGVjdXRlIGF0IHRoZSBiZWdpbm5pbmcgKGBmYWxzZWApXG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gZGVib3VuY2UoZnVuYywgd2FpdCwgaW1tZWRpYXRlKXtcbiAgdmFyIHRpbWVvdXQsIGFyZ3MsIGNvbnRleHQsIHRpbWVzdGFtcCwgcmVzdWx0O1xuICBpZiAobnVsbCA9PSB3YWl0KSB3YWl0ID0gMTAwO1xuXG4gIGZ1bmN0aW9uIGxhdGVyKCkge1xuICAgIHZhciBsYXN0ID0gbm93KCkgLSB0aW1lc3RhbXA7XG5cbiAgICBpZiAobGFzdCA8IHdhaXQgJiYgbGFzdCA+IDApIHtcbiAgICAgIHRpbWVvdXQgPSBzZXRUaW1lb3V0KGxhdGVyLCB3YWl0IC0gbGFzdCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRpbWVvdXQgPSBudWxsO1xuICAgICAgaWYgKCFpbW1lZGlhdGUpIHtcbiAgICAgICAgcmVzdWx0ID0gZnVuYy5hcHBseShjb250ZXh0LCBhcmdzKTtcbiAgICAgICAgaWYgKCF0aW1lb3V0KSBjb250ZXh0ID0gYXJncyA9IG51bGw7XG4gICAgICB9XG4gICAgfVxuICB9O1xuXG4gIHJldHVybiBmdW5jdGlvbiBkZWJvdW5jZWQoKSB7XG4gICAgY29udGV4dCA9IHRoaXM7XG4gICAgYXJncyA9IGFyZ3VtZW50cztcbiAgICB0aW1lc3RhbXAgPSBub3coKTtcbiAgICB2YXIgY2FsbE5vdyA9IGltbWVkaWF0ZSAmJiAhdGltZW91dDtcbiAgICBpZiAoIXRpbWVvdXQpIHRpbWVvdXQgPSBzZXRUaW1lb3V0KGxhdGVyLCB3YWl0KTtcbiAgICBpZiAoY2FsbE5vdykge1xuICAgICAgcmVzdWx0ID0gZnVuYy5hcHBseShjb250ZXh0LCBhcmdzKTtcbiAgICAgIGNvbnRleHQgPSBhcmdzID0gbnVsbDtcbiAgICB9XG5cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9O1xufTtcbiIsIm1vZHVsZS5leHBvcnRzID0gRGF0ZS5ub3cgfHwgbm93XG5cbmZ1bmN0aW9uIG5vdygpIHtcbiAgICByZXR1cm4gbmV3IERhdGUoKS5nZXRUaW1lKClcbn1cbiIsIi8vIHZhciBCaW5nR2VvY29kZXIgPSByZXF1aXJlKCd0cmlidW5lLWJpbmctZ2VvY29kZXInKS5CaW5nR2VvY29kZXI7XG52YXIgZGVib3VuY2UgPSByZXF1aXJlKCdkZWJvdW5jZScpO1xuXG52YXIganNvbnAgPSB7XG4gICAgY2FsbGJhY2tDb3VudGVyOiAwLFxuICAgIGhlYWQ6IGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdoZWFkJylbMF0sXG4gICAgZmV0Y2g6IGZ1bmN0aW9uKHVybCwgY2FsbGJhY2spIHtcbiAgICAgICAgdmFyIGZuID0gJ0pTT05QQ2FsbGJhY2tfJyArIHRoaXMuY2FsbGJhY2tDb3VudGVyKys7XG4gICAgICAgIHdpbmRvd1tmbl0gPSB0aGlzLmV2YWxKU09OUChjYWxsYmFjayk7XG4gICAgICAgIHVybCA9IHVybC5yZXBsYWNlKCc9SlNPTlBDYWxsYmFjaycsICc9JyArIGZuKTtcblxuICAgICAgICB2YXIgc2NyaXB0VGFnID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc2NyaXB0Jyk7XG4gICAgICAgIHNjcmlwdFRhZy5zcmMgPSB1cmw7XG4gICAgICAgIHRoaXMuaGVhZC5hcHBlbmRDaGlsZChzY3JpcHRUYWcpO1xuXG4gICAgfSxcblxuICAgIGV2YWxKU09OUDogZnVuY3Rpb24oY2FsbGJhY2spIHtcbiAgICAgICAgdGhpcy5oZWFkLnJlbW92ZUNoaWxkKHRoaXMuaGVhZC5jaGlsZE5vZGVzW3RoaXMuaGVhZC5jaGlsZE5vZGVzLmxlbmd0aCAtIDFdKTtcblxuICAgICAgICByZXR1cm4gZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgICAgY2FsbGJhY2soZGF0YSk7XG4gICAgICAgIH07XG4gICAgfVxufTtcblxudmFyIEJpbmdHZW9jb2RpZmllciA9IGZ1bmN0aW9uKGVsLCBwYXJhbXMpIHtcbiAgICB0aGlzLmVsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoZWwpO1xuICAgIHRoaXMuYmluZ0FwaUtleSA9IHBhcmFtcy5rZXkgfHwgbnVsbDtcbiAgICAvLyB0aGlzLmdlb2NvZGVyID0gbmV3IEJpbmdHZW9jb2RlcihwYXJhbXMua2V5KTtcbiAgICB0aGlzLnJlc3VsdHMgPSBudWxsO1xuICAgIHRoaXMuZmlsdGVycyA9IHBhcmFtcy5maWx0ZXJzIHx8IG51bGw7XG4gICAgdGhpcy5zZWxlY3RlZFJlc3VsdCA9IG51bGw7XG5cblxuICAgIHRoaXMubG9va3VwRm9ybSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJmb3JtXCIpO1xuICAgIHRoaXMubG9va3VwRm9ybS5pZCA9ICdiaW5nLWdlb2NvZGlmaWVyLWZvcm0nO1xuICAgIHRoaXMubG9va3VwRm9ybS5jbGFzc05hbWUgPSAnZ2VvY29kaWZpZXItZm9ybSc7XG4gICAgdGhpcy50ZXh0SW5wdXQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiaW5wdXRcIik7XG4gICAgdGhpcy50ZXh0SW5wdXQuc2V0QXR0cmlidXRlKFwidHlwZVwiLCBcInRleHRcIik7XG4gICAgdGhpcy50ZXh0SW5wdXQuc2V0QXR0cmlidXRlKFwiYXV0b2NvbXBsZXRlXCIsIFwib2ZmXCIpO1xuICAgIHRoaXMudGV4dElucHV0LmNsYXNzTmFtZSA9IFwiZ2VvY29kaWZ5LWlucHV0XCI7XG5cbiAgICBpZiAocGFyYW1zLmRlZmF1bHRUZXh0KSB7XG4gICAgICAgIHRoaXMudGV4dElucHV0LnNldEF0dHJpYnV0ZShcInBsYWNlaG9sZGVyXCIsIHBhcmFtcy5kZWZhdWx0VGV4dCk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy50ZXh0SW5wdXQuc2V0QXR0cmlidXRlKFwicGxhY2Vob2xkZXJcIiwgXCJTZWFyY2ggYW4gYWRkcmVzc1wiKTtcbiAgICB9XG5cbiAgICB0aGlzLmRyb3Bkb3duID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgICB0aGlzLmRyb3Bkb3duLmNsYXNzTmFtZSA9IFwiZ2VvY29kaWZ5LWRyb3Bkb3duIGhpZGRlblwiO1xuICAgIHRoaXMuaWQgPSBcImJpbmctZ2VvY29kaWZpZXItZHJvcGRvd25cIjtcblxuICAgIHRoaXMubG9va3VwRm9ybS5hcHBlbmRDaGlsZCh0aGlzLnRleHRJbnB1dCk7XG4gICAgdGhpcy5sb29rdXBGb3JtLmFwcGVuZENoaWxkKHRoaXMuZHJvcGRvd24pO1xuICAgIHRoaXMuZWwuYXBwZW5kQ2hpbGQodGhpcy5sb29rdXBGb3JtKTtcblxuICAgIGlmIChwYXJhbXMub25DbGljaykge1xuICAgICAgICB0aGlzLm9uSXRlbUNsaWNrID0gcGFyYW1zLm9uQ2xpY2s7XG4gICAgfVxuXG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgdGhpcy5sb29rdXBGb3JtLmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCB0aGlzLm9uS2V5RG93bi5iaW5kKHRoaXMpKTtcbiAgICB0aGlzLmxvb2t1cEZvcm0uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCB0aGlzLm9uQ2xpY2suYmluZCh0aGlzKSk7XG59O1xuXG5CaW5nR2VvY29kaWZpZXIucHJvdG90eXBlLmJpbmdBcGlVcmwgPSAnaHR0cHM6Ly9kZXYudmlydHVhbGVhcnRoLm5ldC9SRVNUL3YxL0xvY2F0aW9ucy8nO1xuXG5CaW5nR2VvY29kaWZpZXIucHJvdG90eXBlLm9uSXRlbUNsaWNrID0gZnVuY3Rpb24oaXRlbSkge1xuXG59O1xuXG5CaW5nR2VvY29kaWZpZXIucHJvdG90eXBlLm9uQ2xpY2sgPSBmdW5jdGlvbihlKSB7XG4gICAgdmFyIHRhcmdldCA9IGUudGFyZ2V0O1xuXG4gICAgaWYgKHRhcmdldC50YWdOYW1lLnRvTG93ZXJDYXNlKCkgPT09ICdsaScpIHtcbiAgICAgICAgdmFyIHNpYmxpbmdzID0gdGFyZ2V0LnBhcmVudE5vZGUuY2hpbGRyZW4sXG4gICAgICAgICAgICBpdGVtLCBjb29yZHM7XG5cbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzaWJsaW5ncy5sZW5ndGg7IGkgKz0gMSkge1xuICAgICAgICAgICAgaWYgKHRhcmdldC5wYXJlbnROb2RlLmNoaWxkcmVuW2ldID09PSBlLnRhcmdldCkge1xuICAgICAgICAgICAgICAgIGl0ZW0gPSB0aGlzLnJlc3VsdHNbaV07XG4gICAgICAgICAgICAgICAgY29vcmRzID0gaXRlbS5nZW9jb2RlUG9pbnRzWzBdLmNvb3JkaW5hdGVzO1xuXG4gICAgICAgICAgICAgICAgdGhpcy5maWxsVGV4dElucHV0KGl0ZW0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICB9XG59O1xuXG5CaW5nR2VvY29kaWZpZXIucHJvdG90eXBlLmZpbGxUZXh0SW5wdXQgPSBmdW5jdGlvbihpdGVtKSB7XG4gICAgLy8gRG9uJ3QgY2FsbCBpZiB0aGlzIGlzIGFscmVhZHkgdGhlIHZhbHVlIGluIHRoZSB0ZXh0IGJveFxuICAgIGlmICh0aGlzLnRleHRJbnB1dC52YWx1ZSAhPT0gaXRlbS5uYW1lKSB7XG4gICAgICAgIHRoaXMudGV4dElucHV0LnZhbHVlID0gaXRlbS5uYW1lO1xuICAgICAgICB0aGlzLmRyb3Bkb3duLmNsYXNzTGlzdC5hZGQoXCJoaWRkZW5cIik7XG4gICAgICAgIHRoaXMub25JdGVtQ2xpY2soaXRlbSwgaXRlbS5nZW9jb2RlUG9pbnRzWzBdLmNvb3JkaW5hdGVzKTtcbiAgICB9XG59O1xuXG5CaW5nR2VvY29kaWZpZXIucHJvdG90eXBlLm9uS2V5RG93biA9IGZ1bmN0aW9uKGUpIHtcbiAgICBzd2l0Y2goZS5rZXlDb2RlKSB7XG4gICAgICAgIC8vIGVzY2FwZSwgZXhpdCBzZWFyY2ggZHJvcCBkb3duXG4gICAgICAgIGNhc2UgMjc6XG4gICAgICAgICAgICB0aGlzLmhpZGVTZWFyY2hEcm9wRG93bigpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIC8vIGVudGVyXG4gICAgICAgIGNhc2UgMTM6XG4gICAgICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgdGhpcy50cmlnZ2VyS2V5U2VsZWN0KCk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgLy8gcmlnaHQgYXJyb3dcbiAgICAgICAgLy8gQ2hlY2sgaWYgY3Vyc29yIGlzIGF0IHRoZSBlbmQgb2YgdGhlIHNlbGVjdGlvbiBzdHJpbmdcbiAgICAgICAgLy8gSWYgc28sIHRoZW4gYXV0b2NvbXBsZXRlIHdpdGggdGhlIHRvcCByZXR1cm5lZCByZXN1bHRcbiAgICAgICAgLy8gKElmIHRoYXQgZXhpc3RzKVxuICAgICAgICBjYXNlIDM5OlxuICAgICAgICAgICAgaWYgKHRoaXMudGV4dElucHV0LnNlbGVjdGlvblN0YXJ0ID09PSB0aGlzLnRleHRJbnB1dC52YWx1ZS5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgIHRoaXMudHJpZ2dlcktleVNlbGVjdCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIC8vIFVwIGFycm93XG4gICAgICAgIGNhc2UgMzg6XG4gICAgICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuXG4gICAgICAgICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuYWN0aXZlJykuY2xhc3NMaXN0LnJlbW92ZSgnYWN0aXZlJyk7XG5cbiAgICAgICAgICAgIGlmICh0aGlzLnNlbGVjdGVkUmVzdWx0ICYmIHRoaXMuc2VsZWN0ZWRSZXN1bHQgPiAwKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5zZWxlY3RlZFJlc3VsdC0tO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLnNlbGVjdGVkUmVzdWx0ID0gdGhpcy5yZXN1bHRzLmxlbmd0aCAtIDE7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJy5nZW9jb2RpZnktZHJvcGRvd24gbGknKVt0aGlzLnNlbGVjdGVkUmVzdWx0XS5jbGFzc0xpc3QuYWRkKCdhY3RpdmUnKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAvLyBEb3duIGFycm93XG4gICAgICAgIGNhc2UgNDA6XG4gICAgICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuXG4gICAgICAgICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuYWN0aXZlJykuY2xhc3NMaXN0LnJlbW92ZSgnYWN0aXZlJyk7XG5cbiAgICAgICAgICAgIGlmICh0aGlzLnNlbGVjdGVkUmVzdWx0IDwgdGhpcy5yZXN1bHRzLmxlbmd0aCAtIDEpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnNlbGVjdGVkUmVzdWx0Kys7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMuc2VsZWN0ZWRSZXN1bHQgPSAwO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcuZ2VvY29kaWZ5LWRyb3Bkb3duIGxpJylbdGhpcy5zZWxlY3RlZFJlc3VsdF0uY2xhc3NMaXN0LmFkZCgnYWN0aXZlJyk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgLy8gQW55IG90aGVyIGtleXByZXNzXG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICB0aGlzLmdldEdlb2NvZGVEYXRhKCk7XG4gICAgfVxufTtcblxuQmluZ0dlb2NvZGlmaWVyLnByb3RvdHlwZS50cmlnZ2VyS2V5U2VsZWN0ID0gZnVuY3Rpb24oKSB7XG4gICAgaWYgKHRoaXMucmVzdWx0cyAmJiB0aGlzLnJlc3VsdHMubGVuZ3RoID4gLTEpIHtcbiAgICAgICAgdmFyIGluZGV4ID0gdGhpcy5zZWxlY3RlZFJlc3VsdCxcbiAgICAgICAgICAgIGl0ZW0gPSB0aGlzLnJlc3VsdHNbaW5kZXhdO1xuXG4gICAgICAgIHRoaXMuZmlsbFRleHRJbnB1dChpdGVtKTtcbiAgICB9XG5cbn07XG5cblxuXG5CaW5nR2VvY29kaWZpZXIucHJvdG90eXBlLmZpbHRlclJlc3VsdHMgPSBmdW5jdGlvbihiaW5nZGF0YSkge1xuICAgIHZhciByZXN1bHRzID0gYmluZ2RhdGEucmVzb3VyY2VTZXRzWzBdLnJlc291cmNlcyxcbiAgICAgICAgc2VsZiA9IHRoaXM7XG5cbiAgICBmdW5jdGlvbiBmaWx0ZXJSZXN1bHRzIChyZXN1bHQpIHtcbiAgICAgICAgcmV0dXJuIHJlc3VsdC5hZGRyZXNzW2ZpbHRlcl0gPT09IHNlbGYuZmlsdGVyc1tmaWx0ZXJdO1xuICAgIH1cblxuICAgIGZvciAodmFyIGZpbHRlciBpbiB0aGlzLmZpbHRlcnMpIHtcbiAgICAgICAgcmVzdWx0cyA9IHJlc3VsdHMuZmlsdGVyKGZpbHRlclJlc3VsdHMpO1xuICAgIH1cblxuICAgIHJldHVybiByZXN1bHRzO1xufTtcblxuXG5CaW5nR2VvY29kaWZpZXIucHJvdG90eXBlLmJ1aWxkQXV0b2ZpbGxMaXN0ID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIHJlc3VsdHMgPSB0aGlzLnJlc3VsdHM7XG5cbiAgICBpZiAocmVzdWx0cy5sZW5ndGggPiAwKSB7XG4gICAgICAgIHRoaXMuc2VsZWN0ZWRSZXN1bHQgPSAwO1xuICAgICAgICB0aGlzLmRyb3Bkb3duLmlubmVySFRNTCA9IFwiXCI7XG4gICAgICAgIHZhciBzZWFyY2hEcm9wZG93bkxpc3QgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwidWxcIik7XG5cbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCByZXN1bHRzLmxlbmd0aDsgaSArPSAxKSB7XG4gICAgICAgICAgICB2YXIgbGlzdEl0ZW0gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwibGlcIik7XG4gICAgICAgICAgICBsaXN0SXRlbS50ZXh0Q29udGVudCA9IHJlc3VsdHNbaV0ubmFtZTtcblxuICAgICAgICAgICAgaWYgKGkgPT09IDApIHtcbiAgICAgICAgICAgICAgICBsaXN0SXRlbS5jbGFzc0xpc3QuYWRkKFwiYWN0aXZlXCIpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBzZWFyY2hEcm9wZG93bkxpc3QuYXBwZW5kQ2hpbGQobGlzdEl0ZW0pO1xuXG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmRyb3Bkb3duLmFwcGVuZENoaWxkKHNlYXJjaERyb3Bkb3duTGlzdCk7XG4gICAgICAgIHRoaXMuZHJvcGRvd24uY2xhc3NMaXN0LnJlbW92ZShcImhpZGRlblwiKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICAvLyBoaWRlIGlmIG5vdGhpbmcgaXMgc2VsZWN0ZWRcbiAgICAgICAgdGhpcy5kcm9wZG93bi5jbGFzc0xpc3QuYWRkKFwiaGlkZGVuXCIpO1xuICAgIH1cbn07XG5cblxuQmluZ0dlb2NvZGlmaWVyLnByb3RvdHlwZS5nZXRHZW9jb2RlRGF0YSA9IGZ1bmN0aW9uKGUpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICBpZiAodGhpcy50ZXh0SW5wdXQudmFsdWUudHJpbSgpICE9PSAnJykge1xuICAgICAgICB2YXIgdG9HZW9jb2RlID0gdGhpcy50ZXh0SW5wdXQudmFsdWUsXG4gICAgICAgICAgICB1cmwgPSB0aGlzLmJpbmdBcGlVcmwgKyBcIj9xPVwiICsgZW5jb2RlVVJJQ29tcG9uZW50KHRvR2VvY29kZSkgKyAnJmtleT0nICsgdGhpcy5iaW5nQXBpS2V5ICsgXCImbWF4UmVzdWx0cz0xMCZqc29ucD1KU09OUENhbGxiYWNrXCI7XG5cblxuICAgICAgICBqc29ucC5mZXRjaCh1cmwsIGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICAgIHNlbGYucmVzdWx0cyA9IHNlbGYuZmlsdGVyUmVzdWx0cyhkYXRhKTtcbiAgICAgICAgICAgIHNlbGYuYnVpbGRBdXRvZmlsbExpc3QoKTtcbiAgICAgICAgfSk7XG4gICAgfVxufTtcblxuXG5CaW5nR2VvY29kaWZpZXIucHJvdG90eXBlLmhpZGVTZWFyY2hEcm9wRG93biA9IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuZHJvcGRvd24uaW5uZXJIVE1MID0gXCJcIjtcbiAgICB0aGlzLmRyb3Bkb3duLmNsYXNzTGlzdC5hZGQoXCJoaWRkZW5cIik7XG4gICAgdGhpcy50ZXh0SW5wdXQudmFsdWUgPSAnJztcbn07XG5cbndpbmRvdy5CaW5nR2VvY29kaWZpZXIgPSBCaW5nR2VvY29kaWZpZXI7XG4iXX0=
