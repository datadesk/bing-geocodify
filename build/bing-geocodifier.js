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

    this.lookupForm.appendChild(this.textInput);
    this.lookupForm.appendChild(this.dropdown);
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
    } else {
        // add a message if there are no results
        this.dropdown.innerHTML = "";
        var searchDropdownList = document.createElement("ul");
        var listItem = document.createElement("li");
        listItem.id = "no-result-message";
        listItem.textContent = "No results";

        searchDropdownList.appendChild(listItem);
        this.dropdown.appendChild(searchDropdownList);
        this.dropdown.classList.add("no-results");
        this.dropdown.classList.remove("hidden");

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

},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvYmluZy1nZW9jb2RpZmllci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJ2YXIganNvbnAgPSB7XG4gICAgY2FsbGJhY2tDb3VudGVyOiAwLFxuICAgIGhlYWQ6IGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdoZWFkJylbMF0sXG4gICAgZmV0Y2g6IGZ1bmN0aW9uKHVybCwgY2FsbGJhY2spIHtcbiAgICAgICAgdmFyIGZuID0gJ0pTT05QQ2FsbGJhY2tfJyArIHRoaXMuY2FsbGJhY2tDb3VudGVyKys7XG4gICAgICAgIHdpbmRvd1tmbl0gPSB0aGlzLmV2YWxKU09OUChjYWxsYmFjayk7XG4gICAgICAgIHVybCA9IHVybC5yZXBsYWNlKCc9SlNPTlBDYWxsYmFjaycsICc9JyArIGZuKTtcblxuICAgICAgICB2YXIgc2NyaXB0VGFnID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc2NyaXB0Jyk7XG4gICAgICAgIHNjcmlwdFRhZy5zcmMgPSB1cmw7XG4gICAgICAgIHRoaXMuaGVhZC5hcHBlbmRDaGlsZChzY3JpcHRUYWcpO1xuXG4gICAgfSxcblxuICAgIGV2YWxKU09OUDogZnVuY3Rpb24oY2FsbGJhY2spIHtcbiAgICAgICAgdGhpcy5oZWFkLnJlbW92ZUNoaWxkKHRoaXMuaGVhZC5jaGlsZE5vZGVzW3RoaXMuaGVhZC5jaGlsZE5vZGVzLmxlbmd0aCAtIDFdKTtcblxuICAgICAgICByZXR1cm4gZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgICAgY2FsbGJhY2soZGF0YSk7XG4gICAgICAgIH07XG4gICAgfVxufTtcblxudmFyIEJpbmdHZW9jb2RpZmllciA9IGZ1bmN0aW9uKGVsLCBwYXJhbXMpIHtcbiAgICB0aGlzLmVsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoZWwpO1xuICAgIHRoaXMuYmluZ0FwaVVybCA9ICdodHRwczovL2Rldi52aXJ0dWFsZWFydGgubmV0L1JFU1QvdjEvTG9jYXRpb25zLyc7XG4gICAgdGhpcy5iaW5nQXBpS2V5ID0gcGFyYW1zLmtleSB8fCBudWxsO1xuICAgIC8vIHRoaXMuZ2VvY29kZXIgPSBuZXcgQmluZ0dlb2NvZGVyKHBhcmFtcy5rZXkpO1xuICAgIHRoaXMucmVzdWx0cyA9IG51bGw7XG4gICAgdGhpcy5maWx0ZXJzID0gcGFyYW1zLmZpbHRlcnMgfHwgbnVsbDtcbiAgICB0aGlzLnNlbGVjdGVkUmVzdWx0ID0gbnVsbDtcblxuXG4gICAgdGhpcy5sb29rdXBGb3JtID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImZvcm1cIik7XG4gICAgdGhpcy5sb29rdXBGb3JtLmlkID0gJ2JpbmctZ2VvY29kaWZpZXItZm9ybSc7XG4gICAgdGhpcy5sb29rdXBGb3JtLmNsYXNzTmFtZSA9ICdnZW9jb2RpZmllci1mb3JtJztcbiAgICB0aGlzLnRleHRJbnB1dCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJpbnB1dFwiKTtcbiAgICB0aGlzLnRleHRJbnB1dC5zZXRBdHRyaWJ1dGUoXCJ0eXBlXCIsIFwidGV4dFwiKTtcbiAgICB0aGlzLnRleHRJbnB1dC5zZXRBdHRyaWJ1dGUoXCJhdXRvY29tcGxldGVcIiwgXCJvZmZcIik7XG4gICAgdGhpcy50ZXh0SW5wdXQuY2xhc3NOYW1lID0gXCJnZW9jb2RpZnktaW5wdXRcIjtcblxuICAgIGlmIChwYXJhbXMuZGVmYXVsdFRleHQpIHtcbiAgICAgICAgdGhpcy50ZXh0SW5wdXQuc2V0QXR0cmlidXRlKFwicGxhY2Vob2xkZXJcIiwgcGFyYW1zLmRlZmF1bHRUZXh0KTtcbiAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLnRleHRJbnB1dC5zZXRBdHRyaWJ1dGUoXCJwbGFjZWhvbGRlclwiLCBcIlNlYXJjaCBhbiBhZGRyZXNzXCIpO1xuICAgIH1cblxuICAgIHRoaXMuZHJvcGRvd24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICAgIHRoaXMuZHJvcGRvd24uY2xhc3NOYW1lID0gXCJnZW9jb2RpZnktZHJvcGRvd24gaGlkZGVuXCI7XG4gICAgdGhpcy5pZCA9IFwiYmluZy1nZW9jb2RpZmllci1kcm9wZG93blwiO1xuXG4gICAgdGhpcy5sb29rdXBGb3JtLmFwcGVuZENoaWxkKHRoaXMudGV4dElucHV0KTtcbiAgICB0aGlzLmxvb2t1cEZvcm0uYXBwZW5kQ2hpbGQodGhpcy5kcm9wZG93bik7XG4gICAgdGhpcy5lbC5hcHBlbmRDaGlsZCh0aGlzLmxvb2t1cEZvcm0pO1xuXG4gICAgaWYgKHBhcmFtcy5vbkNsaWNrKSB7XG4gICAgICAgIHRoaXMub25JdGVtQ2xpY2sgPSBwYXJhbXMub25DbGljaztcbiAgICB9XG5cbiAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICB0aGlzLmxvb2t1cEZvcm0uYWRkRXZlbnRMaXN0ZW5lcigna2V5dXAnLCB0aGlzLm9uS2V5VXAuYmluZCh0aGlzKSk7XG4gICAgdGhpcy5sb29rdXBGb3JtLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgdGhpcy5vbkNsaWNrLmJpbmQodGhpcykpO1xuICAgIHRoaXMubG9va3VwRm9ybS5vbnN1Ym1pdCA9IGZ1bmN0aW9uKCl7IHJldHVybiBmYWxzZX07XG59O1xuXG5cbkJpbmdHZW9jb2RpZmllci5wcm90b3R5cGUub25JdGVtQ2xpY2sgPSBmdW5jdGlvbihpdGVtKSB7XG5cbn07XG5cblxuQmluZ0dlb2NvZGlmaWVyLnByb3RvdHlwZS5vbkNsaWNrID0gZnVuY3Rpb24oZSkge1xuICAgIC8vIG1ha2Ugc3VyZSB0aGVyZSBhcmUgcmVzdWx0cyBiZWZvcmUgYWxsb3dpbmcgdGhpcyBldmVudFxuICAgIGlmKHRoaXMuZHJvcGRvd24uY2xhc3NOYW1lLmluZGV4T2YoJ25vLXJlc3VsdHMnKSA9PSAtMSl7XG5cbiAgICAgICAgdmFyIHRhcmdldCA9IGUudGFyZ2V0O1xuXG4gICAgICAgIGlmICh0YXJnZXQudGFnTmFtZS50b0xvd2VyQ2FzZSgpID09PSAnbGknKSB7XG4gICAgICAgICAgICB2YXIgc2libGluZ3MgPSB0YXJnZXQucGFyZW50Tm9kZS5jaGlsZHJlbixcbiAgICAgICAgICAgICAgICBpdGVtLCBjb29yZHM7XG5cbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc2libGluZ3MubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgICAgICAgICAgICBpZiAodGFyZ2V0LnBhcmVudE5vZGUuY2hpbGRyZW5baV0gPT09IGUudGFyZ2V0KSB7XG4gICAgICAgICAgICAgICAgICAgIGl0ZW0gPSB0aGlzLnJlc3VsdHNbaV07XG4gICAgICAgICAgICAgICAgICAgIGNvb3JkcyA9IGl0ZW0uZ2VvY29kZVBvaW50c1swXS5jb29yZGluYXRlcztcblxuICAgICAgICAgICAgICAgICAgICB0aGlzLmZpbGxUZXh0SW5wdXQoaXRlbSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgIH1cbiAgICB9XG59O1xuXG5cbkJpbmdHZW9jb2RpZmllci5wcm90b3R5cGUuZmlsbFRleHRJbnB1dCA9IGZ1bmN0aW9uKGl0ZW0pIHtcbiAgICAvLyBEb24ndCBjYWxsIGlmIHRoaXMgaXMgYWxyZWFkeSB0aGUgdmFsdWUgaW4gdGhlIHRleHQgYm94XG4gICAgaWYgKHRoaXMudGV4dElucHV0LnZhbHVlICE9PSBpdGVtLm5hbWUpIHtcbiAgICAgICAgdGhpcy50ZXh0SW5wdXQudmFsdWUgPSBpdGVtLm5hbWU7XG4gICAgICAgIHRoaXMuZHJvcGRvd24uY2xhc3NMaXN0LmFkZChcImhpZGRlblwiKTtcbiAgICAgICAgdGhpcy5vbkl0ZW1DbGljayhpdGVtLCBpdGVtLmdlb2NvZGVQb2ludHNbMF0uY29vcmRpbmF0ZXMpO1xuICAgIH1cbn07XG5cblxuQmluZ0dlb2NvZGlmaWVyLnByb3RvdHlwZS5vbktleVVwID0gZnVuY3Rpb24oZSkge1xuICAgIHN3aXRjaChlLmtleUNvZGUpIHtcbiAgICAgICAgLy8gZXNjYXBlLCBleGl0IHNlYXJjaCBkcm9wIGRvd25cbiAgICAgICAgY2FzZSAyNzpcbiAgICAgICAgICAgIHRoaXMuaGlkZVNlYXJjaERyb3BEb3duKCk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgLy8gZW50ZXJcbiAgICAgICAgY2FzZSAxMzpcbiAgICAgICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICB0aGlzLnRyaWdnZXJLZXlTZWxlY3QoKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAvLyByaWdodCBhcnJvd1xuICAgICAgICAvLyBDaGVjayBpZiBjdXJzb3IgaXMgYXQgdGhlIGVuZCBvZiB0aGUgc2VsZWN0aW9uIHN0cmluZ1xuICAgICAgICAvLyBJZiBzbywgdGhlbiBhdXRvY29tcGxldGUgd2l0aCB0aGUgdG9wIHJldHVybmVkIHJlc3VsdFxuICAgICAgICAvLyAoSWYgdGhhdCBleGlzdHMpXG4gICAgICAgIGNhc2UgMzk6XG4gICAgICAgICAgICBpZiAodGhpcy50ZXh0SW5wdXQuc2VsZWN0aW9uU3RhcnQgPT09IHRoaXMudGV4dElucHV0LnZhbHVlLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgdGhpcy50cmlnZ2VyS2V5U2VsZWN0KCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgLy8gVXAgYXJyb3dcbiAgICAgICAgY2FzZSAzODpcbiAgICAgICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICAgICAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5hY3RpdmUnKS5jbGFzc0xpc3QucmVtb3ZlKCdhY3RpdmUnKTtcblxuICAgICAgICAgICAgaWYgKHRoaXMuc2VsZWN0ZWRSZXN1bHQgJiYgdGhpcy5zZWxlY3RlZFJlc3VsdCA+IDApIHtcbiAgICAgICAgICAgICAgICB0aGlzLnNlbGVjdGVkUmVzdWx0LS07XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMuc2VsZWN0ZWRSZXN1bHQgPSB0aGlzLnJlc3VsdHMubGVuZ3RoIC0gMTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLmdlb2NvZGlmeS1kcm9wZG93biBsaScpW3RoaXMuc2VsZWN0ZWRSZXN1bHRdLmNsYXNzTGlzdC5hZGQoJ2FjdGl2ZScpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIC8vIERvd24gYXJyb3dcbiAgICAgICAgY2FzZSA0MDpcbiAgICAgICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICAgICAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5hY3RpdmUnKS5jbGFzc0xpc3QucmVtb3ZlKCdhY3RpdmUnKTtcblxuICAgICAgICAgICAgaWYgKHRoaXMuc2VsZWN0ZWRSZXN1bHQgPCB0aGlzLnJlc3VsdHMubGVuZ3RoIC0gMSkge1xuICAgICAgICAgICAgICAgIHRoaXMuc2VsZWN0ZWRSZXN1bHQrKztcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5zZWxlY3RlZFJlc3VsdCA9IDA7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJy5nZW9jb2RpZnktZHJvcGRvd24gbGknKVt0aGlzLnNlbGVjdGVkUmVzdWx0XS5jbGFzc0xpc3QuYWRkKCdhY3RpdmUnKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAvLyBBbnkgb3RoZXIga2V5cHJlc3NcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIHRoaXMuZ2V0R2VvY29kZURhdGEoKTtcbiAgICB9XG59O1xuXG5cbkJpbmdHZW9jb2RpZmllci5wcm90b3R5cGUudHJpZ2dlcktleVNlbGVjdCA9IGZ1bmN0aW9uKCkge1xuICAgIGlmICh0aGlzLnJlc3VsdHMgJiYgdGhpcy5yZXN1bHRzLmxlbmd0aCA+IC0xKSB7XG4gICAgICAgIHZhciBpbmRleCA9IHRoaXMuc2VsZWN0ZWRSZXN1bHQsXG4gICAgICAgICAgICBpdGVtID0gdGhpcy5yZXN1bHRzW2luZGV4XTtcblxuICAgICAgICB0aGlzLmZpbGxUZXh0SW5wdXQoaXRlbSk7XG4gICAgfVxuXG59O1xuXG5cbkJpbmdHZW9jb2RpZmllci5wcm90b3R5cGUuZmlsdGVyUmVzdWx0cyA9IGZ1bmN0aW9uKGJpbmdkYXRhKSB7XG4gICAgdmFyIHJlc3VsdHMgPSBiaW5nZGF0YS5yZXNvdXJjZVNldHNbMF0ucmVzb3VyY2VzLFxuICAgICAgICBzZWxmID0gdGhpcztcblxuICAgIGZ1bmN0aW9uIGZpbHRlclJlc3VsdHMgKHJlc3VsdCkge1xuICAgICAgICAvLyBjaGVjayBpZiBmaWx0ZXIgaXMgc2luZ2xlIHN0cmluZyBvciBhcnJheSBvZiBzdHJpbmdzXG4gICAgICAgIGlmKE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCggc2VsZi5maWx0ZXJzW2ZpbHRlcl0gKSA9PT0gJ1tvYmplY3QgQXJyYXldJyl7XG4gICAgICAgICAgICBmb3IodmFyIGkgPSAwOyBpIDwgc2VsZi5maWx0ZXJzW2ZpbHRlcl0ubGVuZ3RoOyBpKyspe1xuICAgICAgICAgICAgICAgIGlmIChyZXN1bHQuYWRkcmVzc1tmaWx0ZXJdID09PSBzZWxmLmZpbHRlcnNbZmlsdGVyXVtpXSl7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBmYWxzZVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdC5hZGRyZXNzW2ZpbHRlcl0gPT09IHNlbGYuZmlsdGVyc1tmaWx0ZXJdO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZm9yICh2YXIgZmlsdGVyIGluIHRoaXMuZmlsdGVycykge1xuICAgICAgICByZXN1bHRzID0gcmVzdWx0cy5maWx0ZXIoZmlsdGVyUmVzdWx0cyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHJlc3VsdHM7XG59O1xuXG5cbkJpbmdHZW9jb2RpZmllci5wcm90b3R5cGUuYnVpbGRBdXRvZmlsbExpc3QgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgcmVzdWx0cyA9IHRoaXMucmVzdWx0cztcblxuICAgIGlmIChyZXN1bHRzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgdGhpcy5zZWxlY3RlZFJlc3VsdCA9IDA7XG4gICAgICAgIHRoaXMuZHJvcGRvd24uaW5uZXJIVE1MID0gXCJcIjtcbiAgICAgICAgdmFyIHNlYXJjaERyb3Bkb3duTGlzdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJ1bFwiKTtcblxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHJlc3VsdHMubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgICAgICAgIHZhciBsaXN0SXRlbSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJsaVwiKTtcbiAgICAgICAgICAgIGxpc3RJdGVtLnRleHRDb250ZW50ID0gcmVzdWx0c1tpXS5uYW1lO1xuXG4gICAgICAgICAgICBpZiAoaSA9PT0gMCkge1xuICAgICAgICAgICAgICAgIGxpc3RJdGVtLmNsYXNzTGlzdC5hZGQoXCJhY3RpdmVcIik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHNlYXJjaERyb3Bkb3duTGlzdC5hcHBlbmRDaGlsZChsaXN0SXRlbSk7XG5cbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuZHJvcGRvd24uYXBwZW5kQ2hpbGQoc2VhcmNoRHJvcGRvd25MaXN0KTtcbiAgICAgICAgdGhpcy5kcm9wZG93bi5jbGFzc0xpc3QucmVtb3ZlKFwibm8tcmVzdWx0c1wiKTtcbiAgICAgICAgdGhpcy5kcm9wZG93bi5jbGFzc0xpc3QucmVtb3ZlKFwiaGlkZGVuXCIpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIGFkZCBhIG1lc3NhZ2UgaWYgdGhlcmUgYXJlIG5vIHJlc3VsdHNcbiAgICAgICAgdGhpcy5kcm9wZG93bi5pbm5lckhUTUwgPSBcIlwiO1xuICAgICAgICB2YXIgc2VhcmNoRHJvcGRvd25MaXN0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInVsXCIpO1xuICAgICAgICB2YXIgbGlzdEl0ZW0gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwibGlcIik7XG4gICAgICAgIGxpc3RJdGVtLmlkID0gXCJuby1yZXN1bHQtbWVzc2FnZVwiO1xuICAgICAgICBsaXN0SXRlbS50ZXh0Q29udGVudCA9IFwiTm8gcmVzdWx0c1wiO1xuXG4gICAgICAgIHNlYXJjaERyb3Bkb3duTGlzdC5hcHBlbmRDaGlsZChsaXN0SXRlbSk7XG4gICAgICAgIHRoaXMuZHJvcGRvd24uYXBwZW5kQ2hpbGQoc2VhcmNoRHJvcGRvd25MaXN0KTtcbiAgICAgICAgdGhpcy5kcm9wZG93bi5jbGFzc0xpc3QuYWRkKFwibm8tcmVzdWx0c1wiKTtcbiAgICAgICAgdGhpcy5kcm9wZG93bi5jbGFzc0xpc3QucmVtb3ZlKFwiaGlkZGVuXCIpO1xuXG4gICAgfVxufTtcblxuXG5CaW5nR2VvY29kaWZpZXIucHJvdG90eXBlLmdldEdlb2NvZGVEYXRhID0gZnVuY3Rpb24oZSkge1xuICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgIGlmICh0aGlzLnRleHRJbnB1dC52YWx1ZS50cmltKCkgIT09ICcnKSB7XG4gICAgICAgIHZhciB0b0dlb2NvZGUgPSB0aGlzLnRleHRJbnB1dC52YWx1ZSxcbiAgICAgICAgICAgIHVybCA9IHRoaXMuYmluZ0FwaVVybCArIFwiP3E9XCIgKyBlbmNvZGVVUklDb21wb25lbnQodG9HZW9jb2RlKSArICcma2V5PScgKyB0aGlzLmJpbmdBcGlLZXkgKyBcIiZtYXhSZXN1bHRzPTEwJmpzb25wPUpTT05QQ2FsbGJhY2tcIjtcblxuICAgICAgICBqc29ucC5mZXRjaCh1cmwsIGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICAgIHNlbGYucmVzdWx0cyA9IHNlbGYuZmlsdGVyUmVzdWx0cyhkYXRhKTtcbiAgICAgICAgICAgIHNlbGYuYnVpbGRBdXRvZmlsbExpc3QoKTtcbiAgICAgICAgfSk7XG4gICAgfVxufTtcblxuXG5CaW5nR2VvY29kaWZpZXIucHJvdG90eXBlLmhpZGVTZWFyY2hEcm9wRG93biA9IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuZHJvcGRvd24uaW5uZXJIVE1MID0gXCJcIjtcbiAgICB0aGlzLmRyb3Bkb3duLmNsYXNzTGlzdC5hZGQoXCJoaWRkZW5cIik7XG4gICAgdGhpcy50ZXh0SW5wdXQudmFsdWUgPSAnJztcbn07XG5cbndpbmRvdy5CaW5nR2VvY29kaWZpZXIgPSBCaW5nR2VvY29kaWZpZXI7XG4iXX0=
