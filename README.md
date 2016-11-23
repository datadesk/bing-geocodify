# bing-geocodify
A geocodifier based on the Bing geolocation API. 


# Example usage
```
<script>
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
</script>
```

# Options
`key` - A Bing API key. 

`onClick` - Function to be executed when a returned point is selected.

`filters` - A dictionary of filters, based on what's returned in the address property in the [Bing Location Query API](https://msdn.microsoft.com/en-us/library/ff701711.aspx). 