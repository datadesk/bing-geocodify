var BingGeocoder = require('tribune-bing-geocoder').BingGeocoder;
var debounce = require('debounce');



var BingGeocodifier = function(el, params) {
    this.el = document.getElementById(el);
    this.geocoder = new BingGeocoder(params.key);
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

    this.lookupForm.addEventListener('keydown', function(e) {
        // escape, exit search drop down
        if (e.keyCode === 27) {
            self.hideSearchDropDown();
        // enter
        } else if (e.keyCode === 13) {
            e.stopPropagation();
            e.preventDefault();
            self.triggerKeySelect();
        // right arrow
        } else if (e.keyCode === 39) {
            // Check if cursor is at the end of the selection string
            // If so, then autocomplete with the top returned result
            // (If that exists)
            if (self.textInput.selectionStart === self.textInput.value.length) {
               self.triggerKeySelect();
            }
        // up arrow
        } else if (e.keyCode === 38) {
            e.stopPropagation();
            e.preventDefault();

            document.querySelector('.active').classList.remove('active');

            if (self.selectedResult && self.selectedResult > 0) {
                self.selectedResult--;
            } else {
                self.selectedResult = self.results.length - 1;
            }

            document.querySelectorAll('.geocodify-dropdown li')[self.selectedResult].classList.add('active');

        // down arrow
        } else if (e.keyCode === 40) {
            e.stopPropagation();
            e.preventDefault();

            document.querySelector('.active').classList.remove('active');

            if (self.selectedResult < self.results.length - 1) {
                self.selectedResult++;
            } else {
                self.selectedResult = 0;
            }

            document.querySelectorAll('.geocodify-dropdown li')[self.selectedResult].classList.add('active');
        } else {
            self.getGeocodeData();
        }
    });


    // this.lookupForm.addEventListener('keydown', debounce( this.getGeocodeData.bind(this), 250) );
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
                    this.dropdown.classList.add("hidden");
                }
            }

        }
    });
};

BingGeocodifier.prototype.onItemClick = function(item) {

};


BingGeocodifier.prototype.triggerKeySelect = function() {
    if (this.results && this.results.length > -1) {
        var index = this.selectedResult;
        // Don't call if this is already the value in the text box
        if (this.textInput.value !== this.results[index].name) {
            this.textInput.value = this.results[index].name;
            this.onItemClick(this.results[index], this.results[index].geocodePoints[0].coordinates);
            this.dropdown.classList.add("hidden");
        }
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
