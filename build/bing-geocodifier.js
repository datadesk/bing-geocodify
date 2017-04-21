(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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
    this.bingApiUrl = 'https://dev.virtualearth.net/REST/v1/Locations/';
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

    this.statusMessage = document.createElement("div");
    this.statusMessage.className = "geocodify-status hidden";
    this.statusMessage.id = "bing-geocodifier-status";

    this.lookupForm.appendChild(this.textInput);
    this.lookupForm.appendChild(this.dropdown);
    this.lookupForm.appendChild(this.statusMessage);
    this.el.appendChild(this.lookupForm);

    if (params.onClick) {
        this.onItemClick = params.onClick;
    }

    var self = this;

    this.lookupForm.addEventListener('keyup', this.onKeyUp.bind(this));
    this.lookupForm.addEventListener('click', this.onClick.bind(this));
    this.lookupForm.onsubmit = function(){ return false};
};


BingGeocodifier.prototype.onItemClick = function(item) {

};


BingGeocodifier.prototype.onClick = function(e) {
    // make sure there are results before allowing this event
    if(this.dropdown.className.indexOf('no-results') == -1){

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
        // check if filter is single string or array of strings
        if(Object.prototype.toString.call( self.filters[filter] ) === '[object Array]'){
            for(var i = 0; i < self.filters[filter].length; i++){
                if (result.address[filter] === self.filters[filter][i]){
                    return true;
                }
            }
            return false
        } else {
            return result.address[filter] === self.filters[filter];
        }
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
        this.dropdown.classList.remove("no-results");
        this.dropdown.classList.remove("hidden");

        this.statusMessage.classList.add("hidden");
    } else {
        // add a message if there are no results
        this.statusMessage.textContent = "No results";
        this.statusMessage.classList.remove("hidden");

        this.dropdown.classList.add("no-results");
        this.dropdown.classList.add("hidden");

    }
};


BingGeocodifier.prototype.getGeocodeData = function(e) {
    var self = this;

    if (this.textInput.value.trim() !== '') {
        var toGeocode = this.textInput.value,
            url = this.bingApiUrl + "?q=" + encodeURIComponent(toGeocode) + '&key=' + this.bingApiKey + "&maxResults=10&jsonp=JSONPCallback";

        this.statusMessage.textContent = "Searching ...";
        this.statusMessage.classList.remove("hidden");
        this.dropdown.classList.add("hidden");
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

},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvYmluZy1nZW9jb2RpZmllci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwidmFyIGpzb25wID0ge1xuICAgIGNhbGxiYWNrQ291bnRlcjogMCxcbiAgICBoZWFkOiBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnaGVhZCcpWzBdLFxuICAgIGZldGNoOiBmdW5jdGlvbih1cmwsIGNhbGxiYWNrKSB7XG4gICAgICAgIHZhciBmbiA9ICdKU09OUENhbGxiYWNrXycgKyB0aGlzLmNhbGxiYWNrQ291bnRlcisrO1xuICAgICAgICB3aW5kb3dbZm5dID0gdGhpcy5ldmFsSlNPTlAoY2FsbGJhY2spO1xuICAgICAgICB1cmwgPSB1cmwucmVwbGFjZSgnPUpTT05QQ2FsbGJhY2snLCAnPScgKyBmbik7XG5cbiAgICAgICAgdmFyIHNjcmlwdFRhZyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NjcmlwdCcpO1xuICAgICAgICBzY3JpcHRUYWcuc3JjID0gdXJsO1xuICAgICAgICB0aGlzLmhlYWQuYXBwZW5kQ2hpbGQoc2NyaXB0VGFnKTtcblxuICAgIH0sXG5cbiAgICBldmFsSlNPTlA6IGZ1bmN0aW9uKGNhbGxiYWNrKSB7XG4gICAgICAgIHRoaXMuaGVhZC5yZW1vdmVDaGlsZCh0aGlzLmhlYWQuY2hpbGROb2Rlc1t0aGlzLmhlYWQuY2hpbGROb2Rlcy5sZW5ndGggLSAxXSk7XG5cbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICAgIGNhbGxiYWNrKGRhdGEpO1xuICAgICAgICB9O1xuICAgIH1cbn07XG5cbnZhciBCaW5nR2VvY29kaWZpZXIgPSBmdW5jdGlvbihlbCwgcGFyYW1zKSB7XG4gICAgdGhpcy5lbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGVsKTtcbiAgICB0aGlzLmJpbmdBcGlVcmwgPSAnaHR0cHM6Ly9kZXYudmlydHVhbGVhcnRoLm5ldC9SRVNUL3YxL0xvY2F0aW9ucy8nO1xuICAgIHRoaXMuYmluZ0FwaUtleSA9IHBhcmFtcy5rZXkgfHwgbnVsbDtcbiAgICAvLyB0aGlzLmdlb2NvZGVyID0gbmV3IEJpbmdHZW9jb2RlcihwYXJhbXMua2V5KTtcbiAgICB0aGlzLnJlc3VsdHMgPSBudWxsO1xuICAgIHRoaXMuZmlsdGVycyA9IHBhcmFtcy5maWx0ZXJzIHx8IG51bGw7XG4gICAgdGhpcy5zZWxlY3RlZFJlc3VsdCA9IG51bGw7XG5cblxuICAgIHRoaXMubG9va3VwRm9ybSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJmb3JtXCIpO1xuICAgIHRoaXMubG9va3VwRm9ybS5pZCA9ICdiaW5nLWdlb2NvZGlmaWVyLWZvcm0nO1xuICAgIHRoaXMubG9va3VwRm9ybS5jbGFzc05hbWUgPSAnZ2VvY29kaWZpZXItZm9ybSc7XG4gICAgdGhpcy50ZXh0SW5wdXQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiaW5wdXRcIik7XG4gICAgdGhpcy50ZXh0SW5wdXQuc2V0QXR0cmlidXRlKFwidHlwZVwiLCBcInRleHRcIik7XG4gICAgdGhpcy50ZXh0SW5wdXQuc2V0QXR0cmlidXRlKFwiYXV0b2NvbXBsZXRlXCIsIFwib2ZmXCIpO1xuICAgIHRoaXMudGV4dElucHV0LmNsYXNzTmFtZSA9IFwiZ2VvY29kaWZ5LWlucHV0XCI7XG5cbiAgICBpZiAocGFyYW1zLmRlZmF1bHRUZXh0KSB7XG4gICAgICAgIHRoaXMudGV4dElucHV0LnNldEF0dHJpYnV0ZShcInBsYWNlaG9sZGVyXCIsIHBhcmFtcy5kZWZhdWx0VGV4dCk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy50ZXh0SW5wdXQuc2V0QXR0cmlidXRlKFwicGxhY2Vob2xkZXJcIiwgXCJTZWFyY2ggYW4gYWRkcmVzc1wiKTtcbiAgICB9XG5cbiAgICB0aGlzLmRyb3Bkb3duID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgICB0aGlzLmRyb3Bkb3duLmNsYXNzTmFtZSA9IFwiZ2VvY29kaWZ5LWRyb3Bkb3duIGhpZGRlblwiO1xuICAgIHRoaXMuaWQgPSBcImJpbmctZ2VvY29kaWZpZXItZHJvcGRvd25cIjtcblxuICAgIHRoaXMuc3RhdHVzTWVzc2FnZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gICAgdGhpcy5zdGF0dXNNZXNzYWdlLmNsYXNzTmFtZSA9IFwiZ2VvY29kaWZ5LXN0YXR1cyBoaWRkZW5cIjtcbiAgICB0aGlzLnN0YXR1c01lc3NhZ2UuaWQgPSBcImJpbmctZ2VvY29kaWZpZXItc3RhdHVzXCI7XG5cbiAgICB0aGlzLmxvb2t1cEZvcm0uYXBwZW5kQ2hpbGQodGhpcy50ZXh0SW5wdXQpO1xuICAgIHRoaXMubG9va3VwRm9ybS5hcHBlbmRDaGlsZCh0aGlzLmRyb3Bkb3duKTtcbiAgICB0aGlzLmxvb2t1cEZvcm0uYXBwZW5kQ2hpbGQodGhpcy5zdGF0dXNNZXNzYWdlKTtcbiAgICB0aGlzLmVsLmFwcGVuZENoaWxkKHRoaXMubG9va3VwRm9ybSk7XG5cbiAgICBpZiAocGFyYW1zLm9uQ2xpY2spIHtcbiAgICAgICAgdGhpcy5vbkl0ZW1DbGljayA9IHBhcmFtcy5vbkNsaWNrO1xuICAgIH1cblxuICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgIHRoaXMubG9va3VwRm9ybS5hZGRFdmVudExpc3RlbmVyKCdrZXl1cCcsIHRoaXMub25LZXlVcC5iaW5kKHRoaXMpKTtcbiAgICB0aGlzLmxvb2t1cEZvcm0uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCB0aGlzLm9uQ2xpY2suYmluZCh0aGlzKSk7XG4gICAgdGhpcy5sb29rdXBGb3JtLm9uc3VibWl0ID0gZnVuY3Rpb24oKXsgcmV0dXJuIGZhbHNlfTtcbn07XG5cblxuQmluZ0dlb2NvZGlmaWVyLnByb3RvdHlwZS5vbkl0ZW1DbGljayA9IGZ1bmN0aW9uKGl0ZW0pIHtcblxufTtcblxuXG5CaW5nR2VvY29kaWZpZXIucHJvdG90eXBlLm9uQ2xpY2sgPSBmdW5jdGlvbihlKSB7XG4gICAgLy8gbWFrZSBzdXJlIHRoZXJlIGFyZSByZXN1bHRzIGJlZm9yZSBhbGxvd2luZyB0aGlzIGV2ZW50XG4gICAgaWYodGhpcy5kcm9wZG93bi5jbGFzc05hbWUuaW5kZXhPZignbm8tcmVzdWx0cycpID09IC0xKXtcblxuICAgICAgICB2YXIgdGFyZ2V0ID0gZS50YXJnZXQ7XG5cbiAgICAgICAgaWYgKHRhcmdldC50YWdOYW1lLnRvTG93ZXJDYXNlKCkgPT09ICdsaScpIHtcbiAgICAgICAgICAgIHZhciBzaWJsaW5ncyA9IHRhcmdldC5wYXJlbnROb2RlLmNoaWxkcmVuLFxuICAgICAgICAgICAgICAgIGl0ZW0sIGNvb3JkcztcblxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzaWJsaW5ncy5sZW5ndGg7IGkgKz0gMSkge1xuICAgICAgICAgICAgICAgIGlmICh0YXJnZXQucGFyZW50Tm9kZS5jaGlsZHJlbltpXSA9PT0gZS50YXJnZXQpIHtcbiAgICAgICAgICAgICAgICAgICAgaXRlbSA9IHRoaXMucmVzdWx0c1tpXTtcbiAgICAgICAgICAgICAgICAgICAgY29vcmRzID0gaXRlbS5nZW9jb2RlUG9pbnRzWzBdLmNvb3JkaW5hdGVzO1xuXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZmlsbFRleHRJbnB1dChpdGVtKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgfVxuICAgIH1cbn07XG5cblxuQmluZ0dlb2NvZGlmaWVyLnByb3RvdHlwZS5maWxsVGV4dElucHV0ID0gZnVuY3Rpb24oaXRlbSkge1xuICAgIC8vIERvbid0IGNhbGwgaWYgdGhpcyBpcyBhbHJlYWR5IHRoZSB2YWx1ZSBpbiB0aGUgdGV4dCBib3hcbiAgICBpZiAodGhpcy50ZXh0SW5wdXQudmFsdWUgIT09IGl0ZW0ubmFtZSkge1xuICAgICAgICB0aGlzLnRleHRJbnB1dC52YWx1ZSA9IGl0ZW0ubmFtZTtcbiAgICAgICAgdGhpcy5kcm9wZG93bi5jbGFzc0xpc3QuYWRkKFwiaGlkZGVuXCIpO1xuICAgICAgICB0aGlzLm9uSXRlbUNsaWNrKGl0ZW0sIGl0ZW0uZ2VvY29kZVBvaW50c1swXS5jb29yZGluYXRlcyk7XG4gICAgfVxufTtcblxuXG5CaW5nR2VvY29kaWZpZXIucHJvdG90eXBlLm9uS2V5VXAgPSBmdW5jdGlvbihlKSB7XG4gICAgc3dpdGNoKGUua2V5Q29kZSkge1xuICAgICAgICAvLyBlc2NhcGUsIGV4aXQgc2VhcmNoIGRyb3AgZG93blxuICAgICAgICBjYXNlIDI3OlxuICAgICAgICAgICAgdGhpcy5oaWRlU2VhcmNoRHJvcERvd24oKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAvLyBlbnRlclxuICAgICAgICBjYXNlIDEzOlxuICAgICAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgIHRoaXMudHJpZ2dlcktleVNlbGVjdCgpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIC8vIHJpZ2h0IGFycm93XG4gICAgICAgIC8vIENoZWNrIGlmIGN1cnNvciBpcyBhdCB0aGUgZW5kIG9mIHRoZSBzZWxlY3Rpb24gc3RyaW5nXG4gICAgICAgIC8vIElmIHNvLCB0aGVuIGF1dG9jb21wbGV0ZSB3aXRoIHRoZSB0b3AgcmV0dXJuZWQgcmVzdWx0XG4gICAgICAgIC8vIChJZiB0aGF0IGV4aXN0cylcbiAgICAgICAgY2FzZSAzOTpcbiAgICAgICAgICAgIGlmICh0aGlzLnRleHRJbnB1dC5zZWxlY3Rpb25TdGFydCA9PT0gdGhpcy50ZXh0SW5wdXQudmFsdWUubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICB0aGlzLnRyaWdnZXJLZXlTZWxlY3QoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAvLyBVcCBhcnJvd1xuICAgICAgICBjYXNlIDM4OlxuICAgICAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcblxuICAgICAgICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLmFjdGl2ZScpLmNsYXNzTGlzdC5yZW1vdmUoJ2FjdGl2ZScpO1xuXG4gICAgICAgICAgICBpZiAodGhpcy5zZWxlY3RlZFJlc3VsdCAmJiB0aGlzLnNlbGVjdGVkUmVzdWx0ID4gMCkge1xuICAgICAgICAgICAgICAgIHRoaXMuc2VsZWN0ZWRSZXN1bHQtLTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5zZWxlY3RlZFJlc3VsdCA9IHRoaXMucmVzdWx0cy5sZW5ndGggLSAxO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcuZ2VvY29kaWZ5LWRyb3Bkb3duIGxpJylbdGhpcy5zZWxlY3RlZFJlc3VsdF0uY2xhc3NMaXN0LmFkZCgnYWN0aXZlJyk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgLy8gRG93biBhcnJvd1xuICAgICAgICBjYXNlIDQwOlxuICAgICAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcblxuICAgICAgICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLmFjdGl2ZScpLmNsYXNzTGlzdC5yZW1vdmUoJ2FjdGl2ZScpO1xuXG4gICAgICAgICAgICBpZiAodGhpcy5zZWxlY3RlZFJlc3VsdCA8IHRoaXMucmVzdWx0cy5sZW5ndGggLSAxKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5zZWxlY3RlZFJlc3VsdCsrO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLnNlbGVjdGVkUmVzdWx0ID0gMDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLmdlb2NvZGlmeS1kcm9wZG93biBsaScpW3RoaXMuc2VsZWN0ZWRSZXN1bHRdLmNsYXNzTGlzdC5hZGQoJ2FjdGl2ZScpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIC8vIEFueSBvdGhlciBrZXlwcmVzc1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgdGhpcy5nZXRHZW9jb2RlRGF0YSgpO1xuICAgIH1cbn07XG5cblxuQmluZ0dlb2NvZGlmaWVyLnByb3RvdHlwZS50cmlnZ2VyS2V5U2VsZWN0ID0gZnVuY3Rpb24oKSB7XG4gICAgaWYgKHRoaXMucmVzdWx0cyAmJiB0aGlzLnJlc3VsdHMubGVuZ3RoID4gLTEpIHtcbiAgICAgICAgdmFyIGluZGV4ID0gdGhpcy5zZWxlY3RlZFJlc3VsdCxcbiAgICAgICAgICAgIGl0ZW0gPSB0aGlzLnJlc3VsdHNbaW5kZXhdO1xuXG4gICAgICAgIHRoaXMuZmlsbFRleHRJbnB1dChpdGVtKTtcbiAgICB9XG5cbn07XG5cblxuQmluZ0dlb2NvZGlmaWVyLnByb3RvdHlwZS5maWx0ZXJSZXN1bHRzID0gZnVuY3Rpb24oYmluZ2RhdGEpIHtcbiAgICB2YXIgcmVzdWx0cyA9IGJpbmdkYXRhLnJlc291cmNlU2V0c1swXS5yZXNvdXJjZXMsXG4gICAgICAgIHNlbGYgPSB0aGlzO1xuXG4gICAgZnVuY3Rpb24gZmlsdGVyUmVzdWx0cyAocmVzdWx0KSB7XG4gICAgICAgIC8vIGNoZWNrIGlmIGZpbHRlciBpcyBzaW5nbGUgc3RyaW5nIG9yIGFycmF5IG9mIHN0cmluZ3NcbiAgICAgICAgaWYoT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKCBzZWxmLmZpbHRlcnNbZmlsdGVyXSApID09PSAnW29iamVjdCBBcnJheV0nKXtcbiAgICAgICAgICAgIGZvcih2YXIgaSA9IDA7IGkgPCBzZWxmLmZpbHRlcnNbZmlsdGVyXS5sZW5ndGg7IGkrKyl7XG4gICAgICAgICAgICAgICAgaWYgKHJlc3VsdC5hZGRyZXNzW2ZpbHRlcl0gPT09IHNlbGYuZmlsdGVyc1tmaWx0ZXJdW2ldKXtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0LmFkZHJlc3NbZmlsdGVyXSA9PT0gc2VsZi5maWx0ZXJzW2ZpbHRlcl07XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmb3IgKHZhciBmaWx0ZXIgaW4gdGhpcy5maWx0ZXJzKSB7XG4gICAgICAgIHJlc3VsdHMgPSByZXN1bHRzLmZpbHRlcihmaWx0ZXJSZXN1bHRzKTtcbiAgICB9XG5cbiAgICByZXR1cm4gcmVzdWx0cztcbn07XG5cblxuQmluZ0dlb2NvZGlmaWVyLnByb3RvdHlwZS5idWlsZEF1dG9maWxsTGlzdCA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciByZXN1bHRzID0gdGhpcy5yZXN1bHRzO1xuXG4gICAgaWYgKHJlc3VsdHMubGVuZ3RoID4gMCkge1xuICAgICAgICB0aGlzLnNlbGVjdGVkUmVzdWx0ID0gMDtcbiAgICAgICAgdGhpcy5kcm9wZG93bi5pbm5lckhUTUwgPSBcIlwiO1xuICAgICAgICB2YXIgc2VhcmNoRHJvcGRvd25MaXN0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInVsXCIpO1xuXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcmVzdWx0cy5sZW5ndGg7IGkgKz0gMSkge1xuICAgICAgICAgICAgdmFyIGxpc3RJdGVtID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImxpXCIpO1xuICAgICAgICAgICAgbGlzdEl0ZW0udGV4dENvbnRlbnQgPSByZXN1bHRzW2ldLm5hbWU7XG5cbiAgICAgICAgICAgIGlmIChpID09PSAwKSB7XG4gICAgICAgICAgICAgICAgbGlzdEl0ZW0uY2xhc3NMaXN0LmFkZChcImFjdGl2ZVwiKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgc2VhcmNoRHJvcGRvd25MaXN0LmFwcGVuZENoaWxkKGxpc3RJdGVtKTtcblxuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5kcm9wZG93bi5hcHBlbmRDaGlsZChzZWFyY2hEcm9wZG93bkxpc3QpO1xuICAgICAgICB0aGlzLmRyb3Bkb3duLmNsYXNzTGlzdC5yZW1vdmUoXCJuby1yZXN1bHRzXCIpO1xuICAgICAgICB0aGlzLmRyb3Bkb3duLmNsYXNzTGlzdC5yZW1vdmUoXCJoaWRkZW5cIik7XG5cbiAgICAgICAgdGhpcy5zdGF0dXNNZXNzYWdlLmNsYXNzTGlzdC5hZGQoXCJoaWRkZW5cIik7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgLy8gYWRkIGEgbWVzc2FnZSBpZiB0aGVyZSBhcmUgbm8gcmVzdWx0c1xuICAgICAgICB0aGlzLnN0YXR1c01lc3NhZ2UudGV4dENvbnRlbnQgPSBcIk5vIHJlc3VsdHNcIjtcbiAgICAgICAgdGhpcy5zdGF0dXNNZXNzYWdlLmNsYXNzTGlzdC5yZW1vdmUoXCJoaWRkZW5cIik7XG5cbiAgICAgICAgdGhpcy5kcm9wZG93bi5jbGFzc0xpc3QuYWRkKFwibm8tcmVzdWx0c1wiKTtcbiAgICAgICAgdGhpcy5kcm9wZG93bi5jbGFzc0xpc3QuYWRkKFwiaGlkZGVuXCIpO1xuXG4gICAgfVxufTtcblxuXG5CaW5nR2VvY29kaWZpZXIucHJvdG90eXBlLmdldEdlb2NvZGVEYXRhID0gZnVuY3Rpb24oZSkge1xuICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgIGlmICh0aGlzLnRleHRJbnB1dC52YWx1ZS50cmltKCkgIT09ICcnKSB7XG4gICAgICAgIHZhciB0b0dlb2NvZGUgPSB0aGlzLnRleHRJbnB1dC52YWx1ZSxcbiAgICAgICAgICAgIHVybCA9IHRoaXMuYmluZ0FwaVVybCArIFwiP3E9XCIgKyBlbmNvZGVVUklDb21wb25lbnQodG9HZW9jb2RlKSArICcma2V5PScgKyB0aGlzLmJpbmdBcGlLZXkgKyBcIiZtYXhSZXN1bHRzPTEwJmpzb25wPUpTT05QQ2FsbGJhY2tcIjtcblxuICAgICAgICB0aGlzLnN0YXR1c01lc3NhZ2UudGV4dENvbnRlbnQgPSBcIlNlYXJjaGluZyAuLi5cIjtcbiAgICAgICAgdGhpcy5zdGF0dXNNZXNzYWdlLmNsYXNzTGlzdC5yZW1vdmUoXCJoaWRkZW5cIik7XG4gICAgICAgIHRoaXMuZHJvcGRvd24uY2xhc3NMaXN0LmFkZChcImhpZGRlblwiKTtcbiAgICAgICAganNvbnAuZmV0Y2godXJsLCBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICAgICBzZWxmLnJlc3VsdHMgPSBzZWxmLmZpbHRlclJlc3VsdHMoZGF0YSk7XG4gICAgICAgICAgICBzZWxmLmJ1aWxkQXV0b2ZpbGxMaXN0KCk7XG4gICAgICAgIH0pO1xuICAgIH1cbn07XG5cblxuQmluZ0dlb2NvZGlmaWVyLnByb3RvdHlwZS5oaWRlU2VhcmNoRHJvcERvd24gPSBmdW5jdGlvbigpIHtcbiAgICB0aGlzLmRyb3Bkb3duLmlubmVySFRNTCA9IFwiXCI7XG4gICAgdGhpcy5kcm9wZG93bi5jbGFzc0xpc3QuYWRkKFwiaGlkZGVuXCIpO1xuICAgIHRoaXMudGV4dElucHV0LnZhbHVlID0gJyc7XG59O1xuXG53aW5kb3cuQmluZ0dlb2NvZGlmaWVyID0gQmluZ0dlb2NvZGlmaWVyO1xuIl19
