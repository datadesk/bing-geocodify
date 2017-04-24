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
        this.textInput.setAttribute("placeholder", "Search for an address");
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
            // don't try to search when the box is empty
            if(this.textInput.value.length === 0){
                this.hideSearchDropDown();
            } else {
                this.getGeocodeData();
            }
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
        // this.dropdown.classList.add("hidden");
        jsonp.fetch(url, function(data) {
            self.results = self.filterResults(data);
            self.buildAutofillList();
        });
    }
};


BingGeocodifier.prototype.hideSearchDropDown = function() {
    this.dropdown.innerHTML = "";
    this.dropdown.classList.add("hidden");
    this.statusMessage.classList.add("hidden");
    this.textInput.value = '';
};

window.BingGeocodifier = BingGeocodifier;

},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvYmluZy1nZW9jb2RpZmllci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwidmFyIGpzb25wID0ge1xuICAgIGNhbGxiYWNrQ291bnRlcjogMCxcbiAgICBoZWFkOiBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnaGVhZCcpWzBdLFxuICAgIGZldGNoOiBmdW5jdGlvbih1cmwsIGNhbGxiYWNrKSB7XG4gICAgICAgIHZhciBmbiA9ICdKU09OUENhbGxiYWNrXycgKyB0aGlzLmNhbGxiYWNrQ291bnRlcisrO1xuICAgICAgICB3aW5kb3dbZm5dID0gdGhpcy5ldmFsSlNPTlAoY2FsbGJhY2spO1xuICAgICAgICB1cmwgPSB1cmwucmVwbGFjZSgnPUpTT05QQ2FsbGJhY2snLCAnPScgKyBmbik7XG5cbiAgICAgICAgdmFyIHNjcmlwdFRhZyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NjcmlwdCcpO1xuICAgICAgICBzY3JpcHRUYWcuc3JjID0gdXJsO1xuICAgICAgICB0aGlzLmhlYWQuYXBwZW5kQ2hpbGQoc2NyaXB0VGFnKTtcblxuICAgIH0sXG5cbiAgICBldmFsSlNPTlA6IGZ1bmN0aW9uKGNhbGxiYWNrKSB7XG4gICAgICAgIHRoaXMuaGVhZC5yZW1vdmVDaGlsZCh0aGlzLmhlYWQuY2hpbGROb2Rlc1t0aGlzLmhlYWQuY2hpbGROb2Rlcy5sZW5ndGggLSAxXSk7XG5cbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICAgIGNhbGxiYWNrKGRhdGEpO1xuICAgICAgICB9O1xuICAgIH1cbn07XG5cbnZhciBCaW5nR2VvY29kaWZpZXIgPSBmdW5jdGlvbihlbCwgcGFyYW1zKSB7XG4gICAgdGhpcy5lbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGVsKTtcbiAgICB0aGlzLmJpbmdBcGlVcmwgPSAnaHR0cHM6Ly9kZXYudmlydHVhbGVhcnRoLm5ldC9SRVNUL3YxL0xvY2F0aW9ucy8nO1xuICAgIHRoaXMuYmluZ0FwaUtleSA9IHBhcmFtcy5rZXkgfHwgbnVsbDtcbiAgICAvLyB0aGlzLmdlb2NvZGVyID0gbmV3IEJpbmdHZW9jb2RlcihwYXJhbXMua2V5KTtcbiAgICB0aGlzLnJlc3VsdHMgPSBudWxsO1xuICAgIHRoaXMuZmlsdGVycyA9IHBhcmFtcy5maWx0ZXJzIHx8IG51bGw7XG4gICAgdGhpcy5zZWxlY3RlZFJlc3VsdCA9IG51bGw7XG5cblxuICAgIHRoaXMubG9va3VwRm9ybSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJmb3JtXCIpO1xuICAgIHRoaXMubG9va3VwRm9ybS5pZCA9ICdiaW5nLWdlb2NvZGlmaWVyLWZvcm0nO1xuICAgIHRoaXMubG9va3VwRm9ybS5jbGFzc05hbWUgPSAnZ2VvY29kaWZpZXItZm9ybSc7XG4gICAgdGhpcy50ZXh0SW5wdXQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiaW5wdXRcIik7XG4gICAgdGhpcy50ZXh0SW5wdXQuc2V0QXR0cmlidXRlKFwidHlwZVwiLCBcInRleHRcIik7XG4gICAgdGhpcy50ZXh0SW5wdXQuc2V0QXR0cmlidXRlKFwiYXV0b2NvbXBsZXRlXCIsIFwib2ZmXCIpO1xuICAgIHRoaXMudGV4dElucHV0LmNsYXNzTmFtZSA9IFwiZ2VvY29kaWZ5LWlucHV0XCI7XG5cbiAgICBpZiAocGFyYW1zLmRlZmF1bHRUZXh0KSB7XG4gICAgICAgIHRoaXMudGV4dElucHV0LnNldEF0dHJpYnV0ZShcInBsYWNlaG9sZGVyXCIsIHBhcmFtcy5kZWZhdWx0VGV4dCk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy50ZXh0SW5wdXQuc2V0QXR0cmlidXRlKFwicGxhY2Vob2xkZXJcIiwgXCJTZWFyY2ggZm9yIGFuIGFkZHJlc3NcIik7XG4gICAgfVxuXG4gICAgdGhpcy5kcm9wZG93biA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gICAgdGhpcy5kcm9wZG93bi5jbGFzc05hbWUgPSBcImdlb2NvZGlmeS1kcm9wZG93biBoaWRkZW5cIjtcbiAgICB0aGlzLmlkID0gXCJiaW5nLWdlb2NvZGlmaWVyLWRyb3Bkb3duXCI7XG5cbiAgICB0aGlzLnN0YXR1c01lc3NhZ2UgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICAgIHRoaXMuc3RhdHVzTWVzc2FnZS5jbGFzc05hbWUgPSBcImdlb2NvZGlmeS1zdGF0dXMgaGlkZGVuXCI7XG4gICAgdGhpcy5zdGF0dXNNZXNzYWdlLmlkID0gXCJiaW5nLWdlb2NvZGlmaWVyLXN0YXR1c1wiO1xuXG4gICAgdGhpcy5sb29rdXBGb3JtLmFwcGVuZENoaWxkKHRoaXMudGV4dElucHV0KTtcbiAgICB0aGlzLmxvb2t1cEZvcm0uYXBwZW5kQ2hpbGQodGhpcy5kcm9wZG93bik7XG4gICAgdGhpcy5sb29rdXBGb3JtLmFwcGVuZENoaWxkKHRoaXMuc3RhdHVzTWVzc2FnZSk7XG4gICAgdGhpcy5lbC5hcHBlbmRDaGlsZCh0aGlzLmxvb2t1cEZvcm0pO1xuXG4gICAgaWYgKHBhcmFtcy5vbkNsaWNrKSB7XG4gICAgICAgIHRoaXMub25JdGVtQ2xpY2sgPSBwYXJhbXMub25DbGljaztcbiAgICB9XG5cbiAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICB0aGlzLmxvb2t1cEZvcm0uYWRkRXZlbnRMaXN0ZW5lcigna2V5dXAnLCB0aGlzLm9uS2V5VXAuYmluZCh0aGlzKSk7XG4gICAgdGhpcy5sb29rdXBGb3JtLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgdGhpcy5vbkNsaWNrLmJpbmQodGhpcykpO1xuICAgIHRoaXMubG9va3VwRm9ybS5vbnN1Ym1pdCA9IGZ1bmN0aW9uKCl7IHJldHVybiBmYWxzZX07XG59O1xuXG5cbkJpbmdHZW9jb2RpZmllci5wcm90b3R5cGUub25JdGVtQ2xpY2sgPSBmdW5jdGlvbihpdGVtKSB7XG5cbn07XG5cblxuQmluZ0dlb2NvZGlmaWVyLnByb3RvdHlwZS5vbkNsaWNrID0gZnVuY3Rpb24oZSkge1xuICAgIC8vIG1ha2Ugc3VyZSB0aGVyZSBhcmUgcmVzdWx0cyBiZWZvcmUgYWxsb3dpbmcgdGhpcyBldmVudFxuICAgIGlmKHRoaXMuZHJvcGRvd24uY2xhc3NOYW1lLmluZGV4T2YoJ25vLXJlc3VsdHMnKSA9PSAtMSl7XG5cbiAgICAgICAgdmFyIHRhcmdldCA9IGUudGFyZ2V0O1xuXG4gICAgICAgIGlmICh0YXJnZXQudGFnTmFtZS50b0xvd2VyQ2FzZSgpID09PSAnbGknKSB7XG4gICAgICAgICAgICB2YXIgc2libGluZ3MgPSB0YXJnZXQucGFyZW50Tm9kZS5jaGlsZHJlbixcbiAgICAgICAgICAgICAgICBpdGVtLCBjb29yZHM7XG5cbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc2libGluZ3MubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgICAgICAgICAgICBpZiAodGFyZ2V0LnBhcmVudE5vZGUuY2hpbGRyZW5baV0gPT09IGUudGFyZ2V0KSB7XG4gICAgICAgICAgICAgICAgICAgIGl0ZW0gPSB0aGlzLnJlc3VsdHNbaV07XG4gICAgICAgICAgICAgICAgICAgIGNvb3JkcyA9IGl0ZW0uZ2VvY29kZVBvaW50c1swXS5jb29yZGluYXRlcztcblxuICAgICAgICAgICAgICAgICAgICB0aGlzLmZpbGxUZXh0SW5wdXQoaXRlbSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgIH1cbiAgICB9XG59O1xuXG5cbkJpbmdHZW9jb2RpZmllci5wcm90b3R5cGUuZmlsbFRleHRJbnB1dCA9IGZ1bmN0aW9uKGl0ZW0pIHtcbiAgICAvLyBEb24ndCBjYWxsIGlmIHRoaXMgaXMgYWxyZWFkeSB0aGUgdmFsdWUgaW4gdGhlIHRleHQgYm94XG4gICAgaWYgKHRoaXMudGV4dElucHV0LnZhbHVlICE9PSBpdGVtLm5hbWUpIHtcbiAgICAgICAgdGhpcy50ZXh0SW5wdXQudmFsdWUgPSBpdGVtLm5hbWU7XG4gICAgICAgIHRoaXMuZHJvcGRvd24uY2xhc3NMaXN0LmFkZChcImhpZGRlblwiKTtcbiAgICAgICAgdGhpcy5vbkl0ZW1DbGljayhpdGVtLCBpdGVtLmdlb2NvZGVQb2ludHNbMF0uY29vcmRpbmF0ZXMpO1xuICAgIH1cbn07XG5cblxuQmluZ0dlb2NvZGlmaWVyLnByb3RvdHlwZS5vbktleVVwID0gZnVuY3Rpb24oZSkge1xuICAgIHN3aXRjaChlLmtleUNvZGUpIHtcbiAgICAgICAgLy8gZXNjYXBlLCBleGl0IHNlYXJjaCBkcm9wIGRvd25cbiAgICAgICAgY2FzZSAyNzpcbiAgICAgICAgICAgIHRoaXMuaGlkZVNlYXJjaERyb3BEb3duKCk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgLy8gZW50ZXJcbiAgICAgICAgY2FzZSAxMzpcbiAgICAgICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICB0aGlzLnRyaWdnZXJLZXlTZWxlY3QoKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAvLyByaWdodCBhcnJvd1xuICAgICAgICAvLyBDaGVjayBpZiBjdXJzb3IgaXMgYXQgdGhlIGVuZCBvZiB0aGUgc2VsZWN0aW9uIHN0cmluZ1xuICAgICAgICAvLyBJZiBzbywgdGhlbiBhdXRvY29tcGxldGUgd2l0aCB0aGUgdG9wIHJldHVybmVkIHJlc3VsdFxuICAgICAgICAvLyAoSWYgdGhhdCBleGlzdHMpXG4gICAgICAgIGNhc2UgMzk6XG4gICAgICAgICAgICBpZiAodGhpcy50ZXh0SW5wdXQuc2VsZWN0aW9uU3RhcnQgPT09IHRoaXMudGV4dElucHV0LnZhbHVlLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgdGhpcy50cmlnZ2VyS2V5U2VsZWN0KCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgLy8gVXAgYXJyb3dcbiAgICAgICAgY2FzZSAzODpcbiAgICAgICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICAgICAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5hY3RpdmUnKS5jbGFzc0xpc3QucmVtb3ZlKCdhY3RpdmUnKTtcblxuICAgICAgICAgICAgaWYgKHRoaXMuc2VsZWN0ZWRSZXN1bHQgJiYgdGhpcy5zZWxlY3RlZFJlc3VsdCA+IDApIHtcbiAgICAgICAgICAgICAgICB0aGlzLnNlbGVjdGVkUmVzdWx0LS07XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMuc2VsZWN0ZWRSZXN1bHQgPSB0aGlzLnJlc3VsdHMubGVuZ3RoIC0gMTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLmdlb2NvZGlmeS1kcm9wZG93biBsaScpW3RoaXMuc2VsZWN0ZWRSZXN1bHRdLmNsYXNzTGlzdC5hZGQoJ2FjdGl2ZScpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIC8vIERvd24gYXJyb3dcbiAgICAgICAgY2FzZSA0MDpcbiAgICAgICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICAgICAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5hY3RpdmUnKS5jbGFzc0xpc3QucmVtb3ZlKCdhY3RpdmUnKTtcblxuICAgICAgICAgICAgaWYgKHRoaXMuc2VsZWN0ZWRSZXN1bHQgPCB0aGlzLnJlc3VsdHMubGVuZ3RoIC0gMSkge1xuICAgICAgICAgICAgICAgIHRoaXMuc2VsZWN0ZWRSZXN1bHQrKztcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5zZWxlY3RlZFJlc3VsdCA9IDA7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJy5nZW9jb2RpZnktZHJvcGRvd24gbGknKVt0aGlzLnNlbGVjdGVkUmVzdWx0XS5jbGFzc0xpc3QuYWRkKCdhY3RpdmUnKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAvLyBBbnkgb3RoZXIga2V5cHJlc3NcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIC8vIGRvbid0IHRyeSB0byBzZWFyY2ggd2hlbiB0aGUgYm94IGlzIGVtcHR5XG4gICAgICAgICAgICBpZih0aGlzLnRleHRJbnB1dC52YWx1ZS5sZW5ndGggPT09IDApe1xuICAgICAgICAgICAgICAgIHRoaXMuaGlkZVNlYXJjaERyb3BEb3duKCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMuZ2V0R2VvY29kZURhdGEoKTtcbiAgICAgICAgICAgIH1cbiAgICB9XG59O1xuXG5cbkJpbmdHZW9jb2RpZmllci5wcm90b3R5cGUudHJpZ2dlcktleVNlbGVjdCA9IGZ1bmN0aW9uKCkge1xuICAgIGlmICh0aGlzLnJlc3VsdHMgJiYgdGhpcy5yZXN1bHRzLmxlbmd0aCA+IC0xKSB7XG4gICAgICAgIHZhciBpbmRleCA9IHRoaXMuc2VsZWN0ZWRSZXN1bHQsXG4gICAgICAgICAgICBpdGVtID0gdGhpcy5yZXN1bHRzW2luZGV4XTtcblxuICAgICAgICB0aGlzLmZpbGxUZXh0SW5wdXQoaXRlbSk7XG4gICAgfVxuXG59O1xuXG5cbkJpbmdHZW9jb2RpZmllci5wcm90b3R5cGUuZmlsdGVyUmVzdWx0cyA9IGZ1bmN0aW9uKGJpbmdkYXRhKSB7XG4gICAgdmFyIHJlc3VsdHMgPSBiaW5nZGF0YS5yZXNvdXJjZVNldHNbMF0ucmVzb3VyY2VzLFxuICAgICAgICBzZWxmID0gdGhpcztcblxuICAgIGZ1bmN0aW9uIGZpbHRlclJlc3VsdHMgKHJlc3VsdCkge1xuICAgICAgICAvLyBjaGVjayBpZiBmaWx0ZXIgaXMgc2luZ2xlIHN0cmluZyBvciBhcnJheSBvZiBzdHJpbmdzXG4gICAgICAgIGlmKE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCggc2VsZi5maWx0ZXJzW2ZpbHRlcl0gKSA9PT0gJ1tvYmplY3QgQXJyYXldJyl7XG4gICAgICAgICAgICBmb3IodmFyIGkgPSAwOyBpIDwgc2VsZi5maWx0ZXJzW2ZpbHRlcl0ubGVuZ3RoOyBpKyspe1xuICAgICAgICAgICAgICAgIGlmIChyZXN1bHQuYWRkcmVzc1tmaWx0ZXJdID09PSBzZWxmLmZpbHRlcnNbZmlsdGVyXVtpXSl7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBmYWxzZVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdC5hZGRyZXNzW2ZpbHRlcl0gPT09IHNlbGYuZmlsdGVyc1tmaWx0ZXJdO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZm9yICh2YXIgZmlsdGVyIGluIHRoaXMuZmlsdGVycykge1xuICAgICAgICByZXN1bHRzID0gcmVzdWx0cy5maWx0ZXIoZmlsdGVyUmVzdWx0cyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHJlc3VsdHM7XG59O1xuXG5cbkJpbmdHZW9jb2RpZmllci5wcm90b3R5cGUuYnVpbGRBdXRvZmlsbExpc3QgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgcmVzdWx0cyA9IHRoaXMucmVzdWx0cztcblxuICAgIGlmIChyZXN1bHRzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgdGhpcy5zZWxlY3RlZFJlc3VsdCA9IDA7XG4gICAgICAgIHRoaXMuZHJvcGRvd24uaW5uZXJIVE1MID0gXCJcIjtcbiAgICAgICAgdmFyIHNlYXJjaERyb3Bkb3duTGlzdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJ1bFwiKTtcblxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHJlc3VsdHMubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgICAgICAgIHZhciBsaXN0SXRlbSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJsaVwiKTtcbiAgICAgICAgICAgIGxpc3RJdGVtLnRleHRDb250ZW50ID0gcmVzdWx0c1tpXS5uYW1lO1xuXG4gICAgICAgICAgICBpZiAoaSA9PT0gMCkge1xuICAgICAgICAgICAgICAgIGxpc3RJdGVtLmNsYXNzTGlzdC5hZGQoXCJhY3RpdmVcIik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHNlYXJjaERyb3Bkb3duTGlzdC5hcHBlbmRDaGlsZChsaXN0SXRlbSk7XG5cbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuZHJvcGRvd24uYXBwZW5kQ2hpbGQoc2VhcmNoRHJvcGRvd25MaXN0KTtcbiAgICAgICAgdGhpcy5kcm9wZG93bi5jbGFzc0xpc3QucmVtb3ZlKFwibm8tcmVzdWx0c1wiKTtcbiAgICAgICAgdGhpcy5kcm9wZG93bi5jbGFzc0xpc3QucmVtb3ZlKFwiaGlkZGVuXCIpO1xuXG4gICAgICAgIHRoaXMuc3RhdHVzTWVzc2FnZS5jbGFzc0xpc3QuYWRkKFwiaGlkZGVuXCIpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIGFkZCBhIG1lc3NhZ2UgaWYgdGhlcmUgYXJlIG5vIHJlc3VsdHNcbiAgICAgICAgdGhpcy5zdGF0dXNNZXNzYWdlLnRleHRDb250ZW50ID0gXCJObyByZXN1bHRzXCI7XG4gICAgICAgIHRoaXMuc3RhdHVzTWVzc2FnZS5jbGFzc0xpc3QucmVtb3ZlKFwiaGlkZGVuXCIpO1xuXG4gICAgICAgIHRoaXMuZHJvcGRvd24uY2xhc3NMaXN0LmFkZChcIm5vLXJlc3VsdHNcIik7XG4gICAgICAgIHRoaXMuZHJvcGRvd24uY2xhc3NMaXN0LmFkZChcImhpZGRlblwiKTtcblxuICAgIH1cbn07XG5cblxuQmluZ0dlb2NvZGlmaWVyLnByb3RvdHlwZS5nZXRHZW9jb2RlRGF0YSA9IGZ1bmN0aW9uKGUpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICBpZiAodGhpcy50ZXh0SW5wdXQudmFsdWUudHJpbSgpICE9PSAnJykge1xuICAgICAgICB2YXIgdG9HZW9jb2RlID0gdGhpcy50ZXh0SW5wdXQudmFsdWUsXG4gICAgICAgICAgICB1cmwgPSB0aGlzLmJpbmdBcGlVcmwgKyBcIj9xPVwiICsgZW5jb2RlVVJJQ29tcG9uZW50KHRvR2VvY29kZSkgKyAnJmtleT0nICsgdGhpcy5iaW5nQXBpS2V5ICsgXCImbWF4UmVzdWx0cz0xMCZqc29ucD1KU09OUENhbGxiYWNrXCI7XG5cbiAgICAgICAgdGhpcy5zdGF0dXNNZXNzYWdlLnRleHRDb250ZW50ID0gXCJTZWFyY2hpbmcgLi4uXCI7XG4gICAgICAgIHRoaXMuc3RhdHVzTWVzc2FnZS5jbGFzc0xpc3QucmVtb3ZlKFwiaGlkZGVuXCIpO1xuICAgICAgICAvLyB0aGlzLmRyb3Bkb3duLmNsYXNzTGlzdC5hZGQoXCJoaWRkZW5cIik7XG4gICAgICAgIGpzb25wLmZldGNoKHVybCwgZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgICAgc2VsZi5yZXN1bHRzID0gc2VsZi5maWx0ZXJSZXN1bHRzKGRhdGEpO1xuICAgICAgICAgICAgc2VsZi5idWlsZEF1dG9maWxsTGlzdCgpO1xuICAgICAgICB9KTtcbiAgICB9XG59O1xuXG5cbkJpbmdHZW9jb2RpZmllci5wcm90b3R5cGUuaGlkZVNlYXJjaERyb3BEb3duID0gZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5kcm9wZG93bi5pbm5lckhUTUwgPSBcIlwiO1xuICAgIHRoaXMuZHJvcGRvd24uY2xhc3NMaXN0LmFkZChcImhpZGRlblwiKTtcbiAgICB0aGlzLnN0YXR1c01lc3NhZ2UuY2xhc3NMaXN0LmFkZChcImhpZGRlblwiKTtcbiAgICB0aGlzLnRleHRJbnB1dC52YWx1ZSA9ICcnO1xufTtcblxud2luZG93LkJpbmdHZW9jb2RpZmllciA9IEJpbmdHZW9jb2RpZmllcjtcbiJdfQ==
