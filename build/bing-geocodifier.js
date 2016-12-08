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

},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvYmluZy1nZW9jb2RpZmllci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJ2YXIganNvbnAgPSB7XG4gICAgY2FsbGJhY2tDb3VudGVyOiAwLFxuICAgIGhlYWQ6IGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdoZWFkJylbMF0sXG4gICAgZmV0Y2g6IGZ1bmN0aW9uKHVybCwgY2FsbGJhY2spIHtcbiAgICAgICAgdmFyIGZuID0gJ0pTT05QQ2FsbGJhY2tfJyArIHRoaXMuY2FsbGJhY2tDb3VudGVyKys7XG4gICAgICAgIHdpbmRvd1tmbl0gPSB0aGlzLmV2YWxKU09OUChjYWxsYmFjayk7XG4gICAgICAgIHVybCA9IHVybC5yZXBsYWNlKCc9SlNPTlBDYWxsYmFjaycsICc9JyArIGZuKTtcblxuICAgICAgICB2YXIgc2NyaXB0VGFnID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc2NyaXB0Jyk7XG4gICAgICAgIHNjcmlwdFRhZy5zcmMgPSB1cmw7XG4gICAgICAgIHRoaXMuaGVhZC5hcHBlbmRDaGlsZChzY3JpcHRUYWcpO1xuXG4gICAgfSxcblxuICAgIGV2YWxKU09OUDogZnVuY3Rpb24oY2FsbGJhY2spIHtcbiAgICAgICAgdGhpcy5oZWFkLnJlbW92ZUNoaWxkKHRoaXMuaGVhZC5jaGlsZE5vZGVzW3RoaXMuaGVhZC5jaGlsZE5vZGVzLmxlbmd0aCAtIDFdKTtcblxuICAgICAgICByZXR1cm4gZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgICAgY2FsbGJhY2soZGF0YSk7XG4gICAgICAgIH07XG4gICAgfVxufTtcblxudmFyIEJpbmdHZW9jb2RpZmllciA9IGZ1bmN0aW9uKGVsLCBwYXJhbXMpIHtcbiAgICB0aGlzLmVsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoZWwpO1xuICAgIHRoaXMuYmluZ0FwaUtleSA9IHBhcmFtcy5rZXkgfHwgbnVsbDtcbiAgICAvLyB0aGlzLmdlb2NvZGVyID0gbmV3IEJpbmdHZW9jb2RlcihwYXJhbXMua2V5KTtcbiAgICB0aGlzLnJlc3VsdHMgPSBudWxsO1xuICAgIHRoaXMuZmlsdGVycyA9IHBhcmFtcy5maWx0ZXJzIHx8IG51bGw7XG4gICAgdGhpcy5zZWxlY3RlZFJlc3VsdCA9IG51bGw7XG5cblxuICAgIHRoaXMubG9va3VwRm9ybSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJmb3JtXCIpO1xuICAgIHRoaXMubG9va3VwRm9ybS5pZCA9ICdiaW5nLWdlb2NvZGlmaWVyLWZvcm0nO1xuICAgIHRoaXMubG9va3VwRm9ybS5jbGFzc05hbWUgPSAnZ2VvY29kaWZpZXItZm9ybSc7XG4gICAgdGhpcy50ZXh0SW5wdXQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiaW5wdXRcIik7XG4gICAgdGhpcy50ZXh0SW5wdXQuc2V0QXR0cmlidXRlKFwidHlwZVwiLCBcInRleHRcIik7XG4gICAgdGhpcy50ZXh0SW5wdXQuc2V0QXR0cmlidXRlKFwiYXV0b2NvbXBsZXRlXCIsIFwib2ZmXCIpO1xuICAgIHRoaXMudGV4dElucHV0LmNsYXNzTmFtZSA9IFwiZ2VvY29kaWZ5LWlucHV0XCI7XG5cbiAgICBpZiAocGFyYW1zLmRlZmF1bHRUZXh0KSB7XG4gICAgICAgIHRoaXMudGV4dElucHV0LnNldEF0dHJpYnV0ZShcInBsYWNlaG9sZGVyXCIsIHBhcmFtcy5kZWZhdWx0VGV4dCk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy50ZXh0SW5wdXQuc2V0QXR0cmlidXRlKFwicGxhY2Vob2xkZXJcIiwgXCJTZWFyY2ggYW4gYWRkcmVzc1wiKTtcbiAgICB9XG5cbiAgICB0aGlzLmRyb3Bkb3duID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgICB0aGlzLmRyb3Bkb3duLmNsYXNzTmFtZSA9IFwiZ2VvY29kaWZ5LWRyb3Bkb3duIGhpZGRlblwiO1xuICAgIHRoaXMuaWQgPSBcImJpbmctZ2VvY29kaWZpZXItZHJvcGRvd25cIjtcblxuICAgIHRoaXMubG9va3VwRm9ybS5hcHBlbmRDaGlsZCh0aGlzLnRleHRJbnB1dCk7XG4gICAgdGhpcy5sb29rdXBGb3JtLmFwcGVuZENoaWxkKHRoaXMuZHJvcGRvd24pO1xuICAgIHRoaXMuZWwuYXBwZW5kQ2hpbGQodGhpcy5sb29rdXBGb3JtKTtcblxuICAgIGlmIChwYXJhbXMub25DbGljaykge1xuICAgICAgICB0aGlzLm9uSXRlbUNsaWNrID0gcGFyYW1zLm9uQ2xpY2s7XG4gICAgfVxuXG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgdGhpcy5sb29rdXBGb3JtLmFkZEV2ZW50TGlzdGVuZXIoJ2tleXVwJywgdGhpcy5vbktleVVwLmJpbmQodGhpcykpO1xuICAgIHRoaXMubG9va3VwRm9ybS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIHRoaXMub25DbGljay5iaW5kKHRoaXMpKTtcbn07XG5cbkJpbmdHZW9jb2RpZmllci5wcm90b3R5cGUuYmluZ0FwaVVybCA9ICdodHRwczovL2Rldi52aXJ0dWFsZWFydGgubmV0L1JFU1QvdjEvTG9jYXRpb25zLyc7XG5cbkJpbmdHZW9jb2RpZmllci5wcm90b3R5cGUub25JdGVtQ2xpY2sgPSBmdW5jdGlvbihpdGVtKSB7XG5cbn07XG5cbkJpbmdHZW9jb2RpZmllci5wcm90b3R5cGUub25DbGljayA9IGZ1bmN0aW9uKGUpIHtcbiAgICB2YXIgdGFyZ2V0ID0gZS50YXJnZXQ7XG5cbiAgICBpZiAodGFyZ2V0LnRhZ05hbWUudG9Mb3dlckNhc2UoKSA9PT0gJ2xpJykge1xuICAgICAgICB2YXIgc2libGluZ3MgPSB0YXJnZXQucGFyZW50Tm9kZS5jaGlsZHJlbixcbiAgICAgICAgICAgIGl0ZW0sIGNvb3JkcztcblxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHNpYmxpbmdzLmxlbmd0aDsgaSArPSAxKSB7XG4gICAgICAgICAgICBpZiAodGFyZ2V0LnBhcmVudE5vZGUuY2hpbGRyZW5baV0gPT09IGUudGFyZ2V0KSB7XG4gICAgICAgICAgICAgICAgaXRlbSA9IHRoaXMucmVzdWx0c1tpXTtcbiAgICAgICAgICAgICAgICBjb29yZHMgPSBpdGVtLmdlb2NvZGVQb2ludHNbMF0uY29vcmRpbmF0ZXM7XG5cbiAgICAgICAgICAgICAgICB0aGlzLmZpbGxUZXh0SW5wdXQoaXRlbSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgIH1cbn07XG5cblxuQmluZ0dlb2NvZGlmaWVyLnByb3RvdHlwZS5maWxsVGV4dElucHV0ID0gZnVuY3Rpb24oaXRlbSkge1xuICAgIC8vIERvbid0IGNhbGwgaWYgdGhpcyBpcyBhbHJlYWR5IHRoZSB2YWx1ZSBpbiB0aGUgdGV4dCBib3hcbiAgICBpZiAodGhpcy50ZXh0SW5wdXQudmFsdWUgIT09IGl0ZW0ubmFtZSkge1xuICAgICAgICB0aGlzLnRleHRJbnB1dC52YWx1ZSA9IGl0ZW0ubmFtZTtcbiAgICAgICAgdGhpcy5kcm9wZG93bi5jbGFzc0xpc3QuYWRkKFwiaGlkZGVuXCIpO1xuICAgICAgICB0aGlzLm9uSXRlbUNsaWNrKGl0ZW0sIGl0ZW0uZ2VvY29kZVBvaW50c1swXS5jb29yZGluYXRlcyk7XG4gICAgfVxufTtcblxuQmluZ0dlb2NvZGlmaWVyLnByb3RvdHlwZS5vbktleVVwID0gZnVuY3Rpb24oZSkge1xuICAgIHN3aXRjaChlLmtleUNvZGUpIHtcbiAgICAgICAgLy8gZXNjYXBlLCBleGl0IHNlYXJjaCBkcm9wIGRvd25cbiAgICAgICAgY2FzZSAyNzpcbiAgICAgICAgICAgIHRoaXMuaGlkZVNlYXJjaERyb3BEb3duKCk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgLy8gZW50ZXJcbiAgICAgICAgY2FzZSAxMzpcbiAgICAgICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICB0aGlzLnRyaWdnZXJLZXlTZWxlY3QoKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAvLyByaWdodCBhcnJvd1xuICAgICAgICAvLyBDaGVjayBpZiBjdXJzb3IgaXMgYXQgdGhlIGVuZCBvZiB0aGUgc2VsZWN0aW9uIHN0cmluZ1xuICAgICAgICAvLyBJZiBzbywgdGhlbiBhdXRvY29tcGxldGUgd2l0aCB0aGUgdG9wIHJldHVybmVkIHJlc3VsdFxuICAgICAgICAvLyAoSWYgdGhhdCBleGlzdHMpXG4gICAgICAgIGNhc2UgMzk6XG4gICAgICAgICAgICBpZiAodGhpcy50ZXh0SW5wdXQuc2VsZWN0aW9uU3RhcnQgPT09IHRoaXMudGV4dElucHV0LnZhbHVlLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgdGhpcy50cmlnZ2VyS2V5U2VsZWN0KCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgLy8gVXAgYXJyb3dcbiAgICAgICAgY2FzZSAzODpcbiAgICAgICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICAgICAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5hY3RpdmUnKS5jbGFzc0xpc3QucmVtb3ZlKCdhY3RpdmUnKTtcblxuICAgICAgICAgICAgaWYgKHRoaXMuc2VsZWN0ZWRSZXN1bHQgJiYgdGhpcy5zZWxlY3RlZFJlc3VsdCA+IDApIHtcbiAgICAgICAgICAgICAgICB0aGlzLnNlbGVjdGVkUmVzdWx0LS07XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMuc2VsZWN0ZWRSZXN1bHQgPSB0aGlzLnJlc3VsdHMubGVuZ3RoIC0gMTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLmdlb2NvZGlmeS1kcm9wZG93biBsaScpW3RoaXMuc2VsZWN0ZWRSZXN1bHRdLmNsYXNzTGlzdC5hZGQoJ2FjdGl2ZScpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIC8vIERvd24gYXJyb3dcbiAgICAgICAgY2FzZSA0MDpcbiAgICAgICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICAgICAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5hY3RpdmUnKS5jbGFzc0xpc3QucmVtb3ZlKCdhY3RpdmUnKTtcblxuICAgICAgICAgICAgaWYgKHRoaXMuc2VsZWN0ZWRSZXN1bHQgPCB0aGlzLnJlc3VsdHMubGVuZ3RoIC0gMSkge1xuICAgICAgICAgICAgICAgIHRoaXMuc2VsZWN0ZWRSZXN1bHQrKztcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5zZWxlY3RlZFJlc3VsdCA9IDA7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJy5nZW9jb2RpZnktZHJvcGRvd24gbGknKVt0aGlzLnNlbGVjdGVkUmVzdWx0XS5jbGFzc0xpc3QuYWRkKCdhY3RpdmUnKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAvLyBBbnkgb3RoZXIga2V5cHJlc3NcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIHRoaXMuZ2V0R2VvY29kZURhdGEoKTtcbiAgICB9XG59O1xuXG5CaW5nR2VvY29kaWZpZXIucHJvdG90eXBlLnRyaWdnZXJLZXlTZWxlY3QgPSBmdW5jdGlvbigpIHtcbiAgICBpZiAodGhpcy5yZXN1bHRzICYmIHRoaXMucmVzdWx0cy5sZW5ndGggPiAtMSkge1xuICAgICAgICB2YXIgaW5kZXggPSB0aGlzLnNlbGVjdGVkUmVzdWx0LFxuICAgICAgICAgICAgaXRlbSA9IHRoaXMucmVzdWx0c1tpbmRleF07XG5cbiAgICAgICAgdGhpcy5maWxsVGV4dElucHV0KGl0ZW0pO1xuICAgIH1cblxufTtcblxuXG5cbkJpbmdHZW9jb2RpZmllci5wcm90b3R5cGUuZmlsdGVyUmVzdWx0cyA9IGZ1bmN0aW9uKGJpbmdkYXRhKSB7XG4gICAgdmFyIHJlc3VsdHMgPSBiaW5nZGF0YS5yZXNvdXJjZVNldHNbMF0ucmVzb3VyY2VzLFxuICAgICAgICBzZWxmID0gdGhpcztcblxuICAgIGZ1bmN0aW9uIGZpbHRlclJlc3VsdHMgKHJlc3VsdCkge1xuICAgICAgICByZXR1cm4gcmVzdWx0LmFkZHJlc3NbZmlsdGVyXSA9PT0gc2VsZi5maWx0ZXJzW2ZpbHRlcl07XG4gICAgfVxuXG4gICAgZm9yICh2YXIgZmlsdGVyIGluIHRoaXMuZmlsdGVycykge1xuICAgICAgICByZXN1bHRzID0gcmVzdWx0cy5maWx0ZXIoZmlsdGVyUmVzdWx0cyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHJlc3VsdHM7XG59O1xuXG5cbkJpbmdHZW9jb2RpZmllci5wcm90b3R5cGUuYnVpbGRBdXRvZmlsbExpc3QgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgcmVzdWx0cyA9IHRoaXMucmVzdWx0cztcblxuICAgIGlmIChyZXN1bHRzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgdGhpcy5zZWxlY3RlZFJlc3VsdCA9IDA7XG4gICAgICAgIHRoaXMuZHJvcGRvd24uaW5uZXJIVE1MID0gXCJcIjtcbiAgICAgICAgdmFyIHNlYXJjaERyb3Bkb3duTGlzdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJ1bFwiKTtcblxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHJlc3VsdHMubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgICAgICAgIHZhciBsaXN0SXRlbSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJsaVwiKTtcbiAgICAgICAgICAgIGxpc3RJdGVtLnRleHRDb250ZW50ID0gcmVzdWx0c1tpXS5uYW1lO1xuXG4gICAgICAgICAgICBpZiAoaSA9PT0gMCkge1xuICAgICAgICAgICAgICAgIGxpc3RJdGVtLmNsYXNzTGlzdC5hZGQoXCJhY3RpdmVcIik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHNlYXJjaERyb3Bkb3duTGlzdC5hcHBlbmRDaGlsZChsaXN0SXRlbSk7XG5cbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuZHJvcGRvd24uYXBwZW5kQ2hpbGQoc2VhcmNoRHJvcGRvd25MaXN0KTtcbiAgICAgICAgdGhpcy5kcm9wZG93bi5jbGFzc0xpc3QucmVtb3ZlKFwiaGlkZGVuXCIpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIGhpZGUgaWYgbm90aGluZyBpcyBzZWxlY3RlZFxuICAgICAgICB0aGlzLmRyb3Bkb3duLmNsYXNzTGlzdC5hZGQoXCJoaWRkZW5cIik7XG4gICAgfVxufTtcblxuXG5CaW5nR2VvY29kaWZpZXIucHJvdG90eXBlLmdldEdlb2NvZGVEYXRhID0gZnVuY3Rpb24oZSkge1xuICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgIGlmICh0aGlzLnRleHRJbnB1dC52YWx1ZS50cmltKCkgIT09ICcnKSB7XG4gICAgICAgIHZhciB0b0dlb2NvZGUgPSB0aGlzLnRleHRJbnB1dC52YWx1ZSxcbiAgICAgICAgICAgIHVybCA9IHRoaXMuYmluZ0FwaVVybCArIFwiP3E9XCIgKyBlbmNvZGVVUklDb21wb25lbnQodG9HZW9jb2RlKSArICcma2V5PScgKyB0aGlzLmJpbmdBcGlLZXkgKyBcIiZtYXhSZXN1bHRzPTEwJmpzb25wPUpTT05QQ2FsbGJhY2tcIjtcblxuXG4gICAgICAgIGpzb25wLmZldGNoKHVybCwgZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgICAgc2VsZi5yZXN1bHRzID0gc2VsZi5maWx0ZXJSZXN1bHRzKGRhdGEpO1xuICAgICAgICAgICAgc2VsZi5idWlsZEF1dG9maWxsTGlzdCgpO1xuICAgICAgICB9KTtcbiAgICB9XG59O1xuXG5cbkJpbmdHZW9jb2RpZmllci5wcm90b3R5cGUuaGlkZVNlYXJjaERyb3BEb3duID0gZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5kcm9wZG93bi5pbm5lckhUTUwgPSBcIlwiO1xuICAgIHRoaXMuZHJvcGRvd24uY2xhc3NMaXN0LmFkZChcImhpZGRlblwiKTtcbiAgICB0aGlzLnRleHRJbnB1dC52YWx1ZSA9ICcnO1xufTtcblxud2luZG93LkJpbmdHZW9jb2RpZmllciA9IEJpbmdHZW9jb2RpZmllcjtcbiJdfQ==
