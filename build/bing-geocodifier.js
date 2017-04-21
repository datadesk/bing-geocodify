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
                console.log(result.address[filter], self.filters[filter][i])
                if (result.address[filter] === self.filters[filter][i]){
                    return true;
                }
            }
            return false
        } else {
            console.log(result.address[filter], self.filters[filter])
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
    this.textInput.value = '';
};

window.BingGeocodifier = BingGeocodifier;

},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvYmluZy1nZW9jb2RpZmllci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsInZhciBqc29ucCA9IHtcbiAgICBjYWxsYmFja0NvdW50ZXI6IDAsXG4gICAgaGVhZDogZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2hlYWQnKVswXSxcbiAgICBmZXRjaDogZnVuY3Rpb24odXJsLCBjYWxsYmFjaykge1xuICAgICAgICB2YXIgZm4gPSAnSlNPTlBDYWxsYmFja18nICsgdGhpcy5jYWxsYmFja0NvdW50ZXIrKztcbiAgICAgICAgd2luZG93W2ZuXSA9IHRoaXMuZXZhbEpTT05QKGNhbGxiYWNrKTtcbiAgICAgICAgdXJsID0gdXJsLnJlcGxhY2UoJz1KU09OUENhbGxiYWNrJywgJz0nICsgZm4pO1xuXG4gICAgICAgIHZhciBzY3JpcHRUYWcgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzY3JpcHQnKTtcbiAgICAgICAgc2NyaXB0VGFnLnNyYyA9IHVybDtcbiAgICAgICAgdGhpcy5oZWFkLmFwcGVuZENoaWxkKHNjcmlwdFRhZyk7XG5cbiAgICB9LFxuXG4gICAgZXZhbEpTT05QOiBmdW5jdGlvbihjYWxsYmFjaykge1xuICAgICAgICB0aGlzLmhlYWQucmVtb3ZlQ2hpbGQodGhpcy5oZWFkLmNoaWxkTm9kZXNbdGhpcy5oZWFkLmNoaWxkTm9kZXMubGVuZ3RoIC0gMV0pO1xuXG4gICAgICAgIHJldHVybiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICAgICBjYWxsYmFjayhkYXRhKTtcbiAgICAgICAgfTtcbiAgICB9XG59O1xuXG52YXIgQmluZ0dlb2NvZGlmaWVyID0gZnVuY3Rpb24oZWwsIHBhcmFtcykge1xuICAgIHRoaXMuZWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChlbCk7XG4gICAgdGhpcy5iaW5nQXBpVXJsID0gJ2h0dHBzOi8vZGV2LnZpcnR1YWxlYXJ0aC5uZXQvUkVTVC92MS9Mb2NhdGlvbnMvJztcbiAgICB0aGlzLmJpbmdBcGlLZXkgPSBwYXJhbXMua2V5IHx8IG51bGw7XG4gICAgLy8gdGhpcy5nZW9jb2RlciA9IG5ldyBCaW5nR2VvY29kZXIocGFyYW1zLmtleSk7XG4gICAgdGhpcy5yZXN1bHRzID0gbnVsbDtcbiAgICB0aGlzLmZpbHRlcnMgPSBwYXJhbXMuZmlsdGVycyB8fCBudWxsO1xuICAgIHRoaXMuc2VsZWN0ZWRSZXN1bHQgPSBudWxsO1xuXG5cbiAgICB0aGlzLmxvb2t1cEZvcm0gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZm9ybVwiKTtcbiAgICB0aGlzLmxvb2t1cEZvcm0uaWQgPSAnYmluZy1nZW9jb2RpZmllci1mb3JtJztcbiAgICB0aGlzLmxvb2t1cEZvcm0uY2xhc3NOYW1lID0gJ2dlb2NvZGlmaWVyLWZvcm0nO1xuICAgIHRoaXMudGV4dElucHV0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImlucHV0XCIpO1xuICAgIHRoaXMudGV4dElucHV0LnNldEF0dHJpYnV0ZShcInR5cGVcIiwgXCJ0ZXh0XCIpO1xuICAgIHRoaXMudGV4dElucHV0LnNldEF0dHJpYnV0ZShcImF1dG9jb21wbGV0ZVwiLCBcIm9mZlwiKTtcbiAgICB0aGlzLnRleHRJbnB1dC5jbGFzc05hbWUgPSBcImdlb2NvZGlmeS1pbnB1dFwiO1xuXG4gICAgaWYgKHBhcmFtcy5kZWZhdWx0VGV4dCkge1xuICAgICAgICB0aGlzLnRleHRJbnB1dC5zZXRBdHRyaWJ1dGUoXCJwbGFjZWhvbGRlclwiLCBwYXJhbXMuZGVmYXVsdFRleHQpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMudGV4dElucHV0LnNldEF0dHJpYnV0ZShcInBsYWNlaG9sZGVyXCIsIFwiU2VhcmNoIGFuIGFkZHJlc3NcIik7XG4gICAgfVxuXG4gICAgdGhpcy5kcm9wZG93biA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gICAgdGhpcy5kcm9wZG93bi5jbGFzc05hbWUgPSBcImdlb2NvZGlmeS1kcm9wZG93biBoaWRkZW5cIjtcbiAgICB0aGlzLmlkID0gXCJiaW5nLWdlb2NvZGlmaWVyLWRyb3Bkb3duXCI7XG5cbiAgICB0aGlzLnN0YXR1c01lc3NhZ2UgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICAgIHRoaXMuc3RhdHVzTWVzc2FnZS5jbGFzc05hbWUgPSBcImdlb2NvZGlmeS1zdGF0dXMgaGlkZGVuXCI7XG4gICAgdGhpcy5zdGF0dXNNZXNzYWdlLmlkID0gXCJiaW5nLWdlb2NvZGlmaWVyLXN0YXR1c1wiO1xuXG4gICAgdGhpcy5sb29rdXBGb3JtLmFwcGVuZENoaWxkKHRoaXMudGV4dElucHV0KTtcbiAgICB0aGlzLmxvb2t1cEZvcm0uYXBwZW5kQ2hpbGQodGhpcy5kcm9wZG93bik7XG4gICAgdGhpcy5sb29rdXBGb3JtLmFwcGVuZENoaWxkKHRoaXMuc3RhdHVzTWVzc2FnZSk7XG4gICAgdGhpcy5lbC5hcHBlbmRDaGlsZCh0aGlzLmxvb2t1cEZvcm0pO1xuXG4gICAgaWYgKHBhcmFtcy5vbkNsaWNrKSB7XG4gICAgICAgIHRoaXMub25JdGVtQ2xpY2sgPSBwYXJhbXMub25DbGljaztcbiAgICB9XG5cbiAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICB0aGlzLmxvb2t1cEZvcm0uYWRkRXZlbnRMaXN0ZW5lcigna2V5dXAnLCB0aGlzLm9uS2V5VXAuYmluZCh0aGlzKSk7XG4gICAgdGhpcy5sb29rdXBGb3JtLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgdGhpcy5vbkNsaWNrLmJpbmQodGhpcykpO1xuICAgIHRoaXMubG9va3VwRm9ybS5vbnN1Ym1pdCA9IGZ1bmN0aW9uKCl7IHJldHVybiBmYWxzZX07XG59O1xuXG5cbkJpbmdHZW9jb2RpZmllci5wcm90b3R5cGUub25JdGVtQ2xpY2sgPSBmdW5jdGlvbihpdGVtKSB7XG5cbn07XG5cblxuQmluZ0dlb2NvZGlmaWVyLnByb3RvdHlwZS5vbkNsaWNrID0gZnVuY3Rpb24oZSkge1xuICAgIC8vIG1ha2Ugc3VyZSB0aGVyZSBhcmUgcmVzdWx0cyBiZWZvcmUgYWxsb3dpbmcgdGhpcyBldmVudFxuICAgIGlmKHRoaXMuZHJvcGRvd24uY2xhc3NOYW1lLmluZGV4T2YoJ25vLXJlc3VsdHMnKSA9PSAtMSl7XG5cbiAgICAgICAgdmFyIHRhcmdldCA9IGUudGFyZ2V0O1xuXG4gICAgICAgIGlmICh0YXJnZXQudGFnTmFtZS50b0xvd2VyQ2FzZSgpID09PSAnbGknKSB7XG4gICAgICAgICAgICB2YXIgc2libGluZ3MgPSB0YXJnZXQucGFyZW50Tm9kZS5jaGlsZHJlbixcbiAgICAgICAgICAgICAgICBpdGVtLCBjb29yZHM7XG5cbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc2libGluZ3MubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgICAgICAgICAgICBpZiAodGFyZ2V0LnBhcmVudE5vZGUuY2hpbGRyZW5baV0gPT09IGUudGFyZ2V0KSB7XG4gICAgICAgICAgICAgICAgICAgIGl0ZW0gPSB0aGlzLnJlc3VsdHNbaV07XG4gICAgICAgICAgICAgICAgICAgIGNvb3JkcyA9IGl0ZW0uZ2VvY29kZVBvaW50c1swXS5jb29yZGluYXRlcztcblxuICAgICAgICAgICAgICAgICAgICB0aGlzLmZpbGxUZXh0SW5wdXQoaXRlbSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgIH1cbiAgICB9XG59O1xuXG5cbkJpbmdHZW9jb2RpZmllci5wcm90b3R5cGUuZmlsbFRleHRJbnB1dCA9IGZ1bmN0aW9uKGl0ZW0pIHtcbiAgICAvLyBEb24ndCBjYWxsIGlmIHRoaXMgaXMgYWxyZWFkeSB0aGUgdmFsdWUgaW4gdGhlIHRleHQgYm94XG4gICAgaWYgKHRoaXMudGV4dElucHV0LnZhbHVlICE9PSBpdGVtLm5hbWUpIHtcbiAgICAgICAgdGhpcy50ZXh0SW5wdXQudmFsdWUgPSBpdGVtLm5hbWU7XG4gICAgICAgIHRoaXMuZHJvcGRvd24uY2xhc3NMaXN0LmFkZChcImhpZGRlblwiKTtcbiAgICAgICAgdGhpcy5vbkl0ZW1DbGljayhpdGVtLCBpdGVtLmdlb2NvZGVQb2ludHNbMF0uY29vcmRpbmF0ZXMpO1xuICAgIH1cbn07XG5cblxuQmluZ0dlb2NvZGlmaWVyLnByb3RvdHlwZS5vbktleVVwID0gZnVuY3Rpb24oZSkge1xuICAgIHN3aXRjaChlLmtleUNvZGUpIHtcbiAgICAgICAgLy8gZXNjYXBlLCBleGl0IHNlYXJjaCBkcm9wIGRvd25cbiAgICAgICAgY2FzZSAyNzpcbiAgICAgICAgICAgIHRoaXMuaGlkZVNlYXJjaERyb3BEb3duKCk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgLy8gZW50ZXJcbiAgICAgICAgY2FzZSAxMzpcbiAgICAgICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICB0aGlzLnRyaWdnZXJLZXlTZWxlY3QoKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAvLyByaWdodCBhcnJvd1xuICAgICAgICAvLyBDaGVjayBpZiBjdXJzb3IgaXMgYXQgdGhlIGVuZCBvZiB0aGUgc2VsZWN0aW9uIHN0cmluZ1xuICAgICAgICAvLyBJZiBzbywgdGhlbiBhdXRvY29tcGxldGUgd2l0aCB0aGUgdG9wIHJldHVybmVkIHJlc3VsdFxuICAgICAgICAvLyAoSWYgdGhhdCBleGlzdHMpXG4gICAgICAgIGNhc2UgMzk6XG4gICAgICAgICAgICBpZiAodGhpcy50ZXh0SW5wdXQuc2VsZWN0aW9uU3RhcnQgPT09IHRoaXMudGV4dElucHV0LnZhbHVlLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgdGhpcy50cmlnZ2VyS2V5U2VsZWN0KCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgLy8gVXAgYXJyb3dcbiAgICAgICAgY2FzZSAzODpcbiAgICAgICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICAgICAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5hY3RpdmUnKS5jbGFzc0xpc3QucmVtb3ZlKCdhY3RpdmUnKTtcblxuICAgICAgICAgICAgaWYgKHRoaXMuc2VsZWN0ZWRSZXN1bHQgJiYgdGhpcy5zZWxlY3RlZFJlc3VsdCA+IDApIHtcbiAgICAgICAgICAgICAgICB0aGlzLnNlbGVjdGVkUmVzdWx0LS07XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMuc2VsZWN0ZWRSZXN1bHQgPSB0aGlzLnJlc3VsdHMubGVuZ3RoIC0gMTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLmdlb2NvZGlmeS1kcm9wZG93biBsaScpW3RoaXMuc2VsZWN0ZWRSZXN1bHRdLmNsYXNzTGlzdC5hZGQoJ2FjdGl2ZScpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIC8vIERvd24gYXJyb3dcbiAgICAgICAgY2FzZSA0MDpcbiAgICAgICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICAgICAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5hY3RpdmUnKS5jbGFzc0xpc3QucmVtb3ZlKCdhY3RpdmUnKTtcblxuICAgICAgICAgICAgaWYgKHRoaXMuc2VsZWN0ZWRSZXN1bHQgPCB0aGlzLnJlc3VsdHMubGVuZ3RoIC0gMSkge1xuICAgICAgICAgICAgICAgIHRoaXMuc2VsZWN0ZWRSZXN1bHQrKztcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5zZWxlY3RlZFJlc3VsdCA9IDA7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJy5nZW9jb2RpZnktZHJvcGRvd24gbGknKVt0aGlzLnNlbGVjdGVkUmVzdWx0XS5jbGFzc0xpc3QuYWRkKCdhY3RpdmUnKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAvLyBBbnkgb3RoZXIga2V5cHJlc3NcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIHRoaXMuZ2V0R2VvY29kZURhdGEoKTtcbiAgICB9XG59O1xuXG5cbkJpbmdHZW9jb2RpZmllci5wcm90b3R5cGUudHJpZ2dlcktleVNlbGVjdCA9IGZ1bmN0aW9uKCkge1xuICAgIGlmICh0aGlzLnJlc3VsdHMgJiYgdGhpcy5yZXN1bHRzLmxlbmd0aCA+IC0xKSB7XG4gICAgICAgIHZhciBpbmRleCA9IHRoaXMuc2VsZWN0ZWRSZXN1bHQsXG4gICAgICAgICAgICBpdGVtID0gdGhpcy5yZXN1bHRzW2luZGV4XTtcblxuICAgICAgICB0aGlzLmZpbGxUZXh0SW5wdXQoaXRlbSk7XG4gICAgfVxuXG59O1xuXG5cbkJpbmdHZW9jb2RpZmllci5wcm90b3R5cGUuZmlsdGVyUmVzdWx0cyA9IGZ1bmN0aW9uKGJpbmdkYXRhKSB7XG4gICAgdmFyIHJlc3VsdHMgPSBiaW5nZGF0YS5yZXNvdXJjZVNldHNbMF0ucmVzb3VyY2VzLFxuICAgICAgICBzZWxmID0gdGhpcztcblxuICAgIGZ1bmN0aW9uIGZpbHRlclJlc3VsdHMgKHJlc3VsdCkge1xuICAgICAgICAvLyBjaGVjayBpZiBmaWx0ZXIgaXMgc2luZ2xlIHN0cmluZyBvciBhcnJheSBvZiBzdHJpbmdzXG4gICAgICAgIGlmKE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCggc2VsZi5maWx0ZXJzW2ZpbHRlcl0gKSA9PT0gJ1tvYmplY3QgQXJyYXldJyl7XG4gICAgICAgICAgICBmb3IodmFyIGkgPSAwOyBpIDwgc2VsZi5maWx0ZXJzW2ZpbHRlcl0ubGVuZ3RoOyBpKyspe1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKHJlc3VsdC5hZGRyZXNzW2ZpbHRlcl0sIHNlbGYuZmlsdGVyc1tmaWx0ZXJdW2ldKVxuICAgICAgICAgICAgICAgIGlmIChyZXN1bHQuYWRkcmVzc1tmaWx0ZXJdID09PSBzZWxmLmZpbHRlcnNbZmlsdGVyXVtpXSl7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBmYWxzZVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29uc29sZS5sb2cocmVzdWx0LmFkZHJlc3NbZmlsdGVyXSwgc2VsZi5maWx0ZXJzW2ZpbHRlcl0pXG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0LmFkZHJlc3NbZmlsdGVyXSA9PT0gc2VsZi5maWx0ZXJzW2ZpbHRlcl07XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmb3IgKHZhciBmaWx0ZXIgaW4gdGhpcy5maWx0ZXJzKSB7XG4gICAgICAgIHJlc3VsdHMgPSByZXN1bHRzLmZpbHRlcihmaWx0ZXJSZXN1bHRzKTtcbiAgICB9XG5cbiAgICByZXR1cm4gcmVzdWx0cztcbn07XG5cblxuQmluZ0dlb2NvZGlmaWVyLnByb3RvdHlwZS5idWlsZEF1dG9maWxsTGlzdCA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciByZXN1bHRzID0gdGhpcy5yZXN1bHRzO1xuXG4gICAgaWYgKHJlc3VsdHMubGVuZ3RoID4gMCkge1xuICAgICAgICB0aGlzLnNlbGVjdGVkUmVzdWx0ID0gMDtcbiAgICAgICAgdGhpcy5kcm9wZG93bi5pbm5lckhUTUwgPSBcIlwiO1xuICAgICAgICB2YXIgc2VhcmNoRHJvcGRvd25MaXN0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInVsXCIpO1xuXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcmVzdWx0cy5sZW5ndGg7IGkgKz0gMSkge1xuICAgICAgICAgICAgdmFyIGxpc3RJdGVtID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImxpXCIpO1xuICAgICAgICAgICAgbGlzdEl0ZW0udGV4dENvbnRlbnQgPSByZXN1bHRzW2ldLm5hbWU7XG5cbiAgICAgICAgICAgIGlmIChpID09PSAwKSB7XG4gICAgICAgICAgICAgICAgbGlzdEl0ZW0uY2xhc3NMaXN0LmFkZChcImFjdGl2ZVwiKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgc2VhcmNoRHJvcGRvd25MaXN0LmFwcGVuZENoaWxkKGxpc3RJdGVtKTtcblxuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5kcm9wZG93bi5hcHBlbmRDaGlsZChzZWFyY2hEcm9wZG93bkxpc3QpO1xuICAgICAgICB0aGlzLmRyb3Bkb3duLmNsYXNzTGlzdC5yZW1vdmUoXCJuby1yZXN1bHRzXCIpO1xuICAgICAgICB0aGlzLmRyb3Bkb3duLmNsYXNzTGlzdC5yZW1vdmUoXCJoaWRkZW5cIik7XG5cbiAgICAgICAgdGhpcy5zdGF0dXNNZXNzYWdlLmNsYXNzTGlzdC5hZGQoXCJoaWRkZW5cIik7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgLy8gYWRkIGEgbWVzc2FnZSBpZiB0aGVyZSBhcmUgbm8gcmVzdWx0c1xuICAgICAgICB0aGlzLnN0YXR1c01lc3NhZ2UudGV4dENvbnRlbnQgPSBcIk5vIHJlc3VsdHNcIjtcbiAgICAgICAgdGhpcy5zdGF0dXNNZXNzYWdlLmNsYXNzTGlzdC5yZW1vdmUoXCJoaWRkZW5cIik7XG5cbiAgICAgICAgdGhpcy5kcm9wZG93bi5jbGFzc0xpc3QuYWRkKFwibm8tcmVzdWx0c1wiKTtcbiAgICAgICAgdGhpcy5kcm9wZG93bi5jbGFzc0xpc3QuYWRkKFwiaGlkZGVuXCIpO1xuXG4gICAgfVxufTtcblxuXG5CaW5nR2VvY29kaWZpZXIucHJvdG90eXBlLmdldEdlb2NvZGVEYXRhID0gZnVuY3Rpb24oZSkge1xuICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgIGlmICh0aGlzLnRleHRJbnB1dC52YWx1ZS50cmltKCkgIT09ICcnKSB7XG4gICAgICAgIHZhciB0b0dlb2NvZGUgPSB0aGlzLnRleHRJbnB1dC52YWx1ZSxcbiAgICAgICAgICAgIHVybCA9IHRoaXMuYmluZ0FwaVVybCArIFwiP3E9XCIgKyBlbmNvZGVVUklDb21wb25lbnQodG9HZW9jb2RlKSArICcma2V5PScgKyB0aGlzLmJpbmdBcGlLZXkgKyBcIiZtYXhSZXN1bHRzPTEwJmpzb25wPUpTT05QQ2FsbGJhY2tcIjtcblxuICAgICAgICB0aGlzLnN0YXR1c01lc3NhZ2UudGV4dENvbnRlbnQgPSBcIlNlYXJjaGluZyAuLi5cIjtcbiAgICAgICAgdGhpcy5zdGF0dXNNZXNzYWdlLmNsYXNzTGlzdC5yZW1vdmUoXCJoaWRkZW5cIik7XG4gICAgICAgIC8vIHRoaXMuZHJvcGRvd24uY2xhc3NMaXN0LmFkZChcImhpZGRlblwiKTtcbiAgICAgICAganNvbnAuZmV0Y2godXJsLCBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICAgICBzZWxmLnJlc3VsdHMgPSBzZWxmLmZpbHRlclJlc3VsdHMoZGF0YSk7XG4gICAgICAgICAgICBzZWxmLmJ1aWxkQXV0b2ZpbGxMaXN0KCk7XG4gICAgICAgIH0pO1xuICAgIH1cbn07XG5cblxuQmluZ0dlb2NvZGlmaWVyLnByb3RvdHlwZS5oaWRlU2VhcmNoRHJvcERvd24gPSBmdW5jdGlvbigpIHtcbiAgICB0aGlzLmRyb3Bkb3duLmlubmVySFRNTCA9IFwiXCI7XG4gICAgdGhpcy5kcm9wZG93bi5jbGFzc0xpc3QuYWRkKFwiaGlkZGVuXCIpO1xuICAgIHRoaXMudGV4dElucHV0LnZhbHVlID0gJyc7XG59O1xuXG53aW5kb3cuQmluZ0dlb2NvZGlmaWVyID0gQmluZ0dlb2NvZGlmaWVyO1xuIl19
