# bing-geocodify
A geocodifier based on the Bing geolocation API. Autosuggests and returns results. [Check out a demo](https://datadesk.github.io/bing-geocodify/). 

- You can use the forward arrow to autocomplete for the first suggested result
- You can use the up and down arrow keys to select a result. 


# Example usage
First include `bing-geocodifier.js` and `bing-geocodifier.css` in your page. 

```
// Initialize on a div element with an ID of "geocodifier"
var geocoder = new BingGeocodifier('geocodifier', {
    key: "YOUR_API_KEY",
    onClick: function(item, coords) {
        console.log(item, coords);
    },
    filters: {
        countryRegion: "United States",
        adminDistrict: "CA"
    }
});
```

# Options
`defaultText` - Search prompt text you want the widget to show. Default is "Search an address".

`filters` - A dictionary of filters, based on what's returned in the address property in the [Bing Location Query API](https://msdn.microsoft.com/en-us/library/ff701711.aspx).

`key` - A Bing API key. 

`onClick` - Function to be executed when a returned point is selected.
