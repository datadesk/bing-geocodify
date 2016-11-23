var BingGeocoder = require('tribune-bing-geocoder').BingGeocoder;
var debounce = require('debounce');



var BingGeocodifier = function(el, params) {
    this.el = document.getElementById(el);
    this.geocoder = new BingGeocoder(params.key);
    this.results = null;
    this.filters = params.filters || null;

    if (params.onClick) {
        this.onItemClick = params.onClick;
    }

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

    var self = this;

    this.lookupForm.addEventListener('keydown', function(e) {
            if (e.keyCode === 27) {
                self.hideSearchDropDown();
            } else if (e.keyCode === 13) {
                e.stopPropagation();
                e.preventDefault();
                return false;
            }
        });

    this.lookupForm.addEventListener('keydown', debounce( this.getGeocodeData.bind(this), 250) );
    this.lookupForm.addEventListener('click', function(e) {
        var target = e.target;

        if (target.tagName.toLowerCase() === 'li') {
            var siblings = target.parentNode.children,
                item, coords;

            for (var i = 0; i < siblings.length; i += 1) {
                if (target.parentNode.children[i] === e.target) {
                    item = self.results[i];
                    coords = item.geocodePoints[0].coordinates;

                    self.onItemClick(item, coords);
                }
            }

        }
    });
};

BingGeocodifier.prototype.onItemClick = function(item) {

};


BingGeocodifier.prototype.filterResults = function(results) {
    var results = results.resourceSets[0].resources,
        self = this;

    for (var filter in this.filters) {
        results = results.filter(function(result) {
            return result.address[filter] === self.filters[filter];
        });
    }

    return results;
};


BingGeocodifier.prototype.buildAutofillList = function() {
    var results = this.results;

    if (results.length > 0) {
        this.dropdown.innerHTML = "";
        var searchDropdownList = document.createElement("ul");

        for (var i = 0; i < results.length; i += 1) {
            var listItem = document.createElement("li");
            listItem.textContent = results[i].name;
            searchDropdownList.appendChild(listItem);
        }

        this.dropdown.appendChild(searchDropdownList);
        this.dropdown.classList.remove("hidden");
    }
};

BingGeocodifier.prototype.getGeocodeData = function(e) {
    var self = this;


    if (this.textInput.value.trim() !== '') {
        var toGeocode = this.textInput.value;

        var additionalParams = {
            maxResults: 10
        };

        this.geocoder.geocode(toGeocode, function(err, geodata) {
            self.results = self.filterResults(geodata);
            self.buildAutofillList();
        }, additionalParams);
    }
};


BingGeocodifier.prototype.hideSearchDropDown = function() {
    this.dropdown.innerHTML = "";
    this.dropdown.classList.add("hidden");
    this.textInput.value = '';
};

window.BingGeocodifier = BingGeocodifier;
