var BingGeocoder = require('tribune-bing-geocoder').BingGeocoder;
var debounce = require('debounce');



var BingGeocodifier = function(el, params) {
    this.el = document.getElementById(el);
    this.geocoder = new BingGeocoder(params.key);

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

};

// Need to allow for different queries/search strings
BingGeocodifier.prototype.prepSearchString = function(query) {
    var pattr = /\sca|\scalifornia/gi,
        match = query.match(pattr);

    if (!match) {
        return query + ' CA';
    } else {
        return query;
    }
};


BingGeocodifier.prototype.filterResults = function(results) {
    results.resourceSets[0].resources = results.resourceSets[0].resources.filter(function(result) {
        return result.address.countryRegion === "United States" && result.address.adminDistrict === "CA";
    });

    return results;
};


BingGeocodifier.prototype.buildAutofillList = function(geodata) {
    var results = geodata.resourceSets[0].resources;

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
        var toGeocode = this.prepSearchString(this.textInput.value);

        this.geocoder.geocode(toGeocode, function(err, geodata) {
            returnedResult = self.filterResults(geodata);
            self.buildAutofillList(returnedResult);
        }, {
            maxResults: 10
        });
    }
};


BingGeocodifier.prototype.hideSearchDropDown = function() {
    this.dropdown.innerHTML = "";
    this.dropdown.classList.add("hidden");
    this.textInput.value = '';
};

window.BingGeocodifier = BingGeocodifier;
