(function(){

// Initialize Model
var placeData = [
	{
		name: 'Pikes Peak Mountain',
		lat: 38.840532, 
		lng: -105.044205,
		imgSrc: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/be/Pikespeak.JPG/2560px-Pikespeak.JPG',
		imgAttribute: 'Wikipedia',
		description: 'Pikes Peak is one of Colorados 53 fourteeners (mountains that rise more than 14,000 feet) above sea level. The mountain rises 8,000 ft above downtown Colorado Springs. Pikes peak is one of the highest summits along the front range.  Pikes is also one of the few 14ers where you are able to drive to the top, and therefore a huge tourist attraction (similar to Mt. Evans).'
	},
	{
		name: 'Red Rocks Amphitheatre',
		lat: 39.665278,
		lng: -105.205833,
		imgSrc: 'https://upload.wikimedia.org/wikipedia/commons/3/33/RedRocksAMP.png',
		imgAttribute: 'Wikipedia',
		description: 'Red Rocks Amphitheater is a rock structure located 10 miles west of Denver, where concerts are given in the open and outdoor environment. There are large rock formations surrounding the arena which notoriously gives this venue astounding views, and acoustics.  The arena holds seating for up to 9,525 people - plan to buy your tickets several months in advance, or pay the price!'
	},
	{
		name: 'Vail, CO',
		lat: 39.641107,
		lng: -106.375712,
		imgSrc: 'http://www.planetware.com/photos-large/USCO/colorado-vail-lake.jpg',
		imgAttribute: 'Planetware',
		description: 'Without a doubt, Vail can be a top destination for pristine snow in the Rocky Mountains.  Try to avoid the "tourist" weekends by going during weekdays, or else face the consequences of a $200 lift ticket and 20-minute lift lines.'
	},
	{
		name: 'Coors Field ballpark',
		lat: 39.761073,
		lng: -104.993328,
		imgSrc: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e2/Coors_Field_July_2015.jpg/1920px-Coors_Field_July_2015.jpg',
		imgAttribute: 'Wikipedia',
		description: 'Coors Field is a baseball park located in downtown Denver.  It is currently the home field of the Colorado Rockies.  The stadium can hold ~50,000 people and tickets are relatively inexpensive.  With amazing views of the Rocky Mountains and a great downtown location - a must see ball park!'
	},
	{
		name: 'Pearl Street Mall',
		lat: 40.017863,
		lng: -105.279952,
		imgSrc: 'http://www.boulderdowntown.com/_img/dbi-pano1-warm-tone-1421x500-jessie.jpg',
		imgAttribute: 'Boulder Downtown',
		description: 'Pearl Street Mall is an outdoor pedestrian mall located in Boulder, CO.  The mall stretched 4 city blocks and can be a great place to shop, or grab a meal / drinks to enjoy the outdoor weather.  This mall is not an outlets haven, so be sure to bring your wallet.'
	},
	{
		name: 'Snooze AM Eatery (Brunch)',
		lat: 39.7556307,
		lng: -105.0240295,
		imgSrc: 'http://ollie.neglerio.com/wp-content/uploads/2011/10/snooze-denver-1.jpg',
		imgAttribute: 'Ollie Neglerio',
		description: 'Denver is known for Brunch.  Snooze is a (small) chain of restaurants focused on awesome brunch meals.  This is a perfect way to start a beautiful morning.  Make sure you get here early to avoid the wait on weekends!'
	},
	{
		name: 'Garden of the Gods',
		lat: 38.867769, 
		lng: -104.891088,
		imgSrc: 'https://upload.wikimedia.org/wikipedia/commons/7/73/Garden_of_the_Gods.JPG',
		imgAttribute: 'Wikipedia - Corby Robert',
		description: 'The Garden of the Gods Park is popular for hiking, rock climbing, horseback riding, road and mountain biking.  It attracts > 2 million visitors a year.  There are more than 15 miles of trails with trails that run through the heart of the park which is paved and wheelchair accessible - not mention, it is free!'
	}
];

// Constructor for Place
var Place = function(data) {
	this.name = data.name;
	this.lat = data.lat;
	this.lng = data.lng;
	this.imgSrc = data.imgSrc;
	this.imgAttribute = data.imgAttribute;
	this.description = data.description;
};

// Initialize ViewModel
var ViewModel = function() {
	var self = this;
	// Set location list observable array from PlaceData
	this.placeList = ko.observableArray([]);
	// Get value from search field
	this.search = ko.observable('');
	// Make place object from each item in location list then push to observable array.
	placeData.forEach(function(item){
		this.placeList.push(new Place(item));
	}, this);
	// Initial current location to be the first one
	this.currentPlace = ko.observable(this.placeList()[0]);
	// Functions invoked when user clicked an item in the list
	this.setPlace = function(clickedPlace) {
		// Set current location user clicked
		self.currentPlace(clickedPlace);
		// Find index of the clicked location and store for use in activation of marker.
		var index = self.filteredItems().indexOf(clickedPlace);
		// Prepare content for Google Maps infowindow
		self.updateContent(clickedPlace);
		// NEW*** Invoke function for instagram API call
		self.instagramImg(clickedPlace.lat, clickedPlace.lng);
    
	};

    // Filter location name with value from search field entry
	this.filteredItems = ko.computed(function() {
	    var searchTerm = self.search().toLowerCase();
	    if (!searchTerm) {
	        return self.placeList();
	    } else {
	        return ko.utils.arrayFilter(self.placeList(), function(item) {
	        	// return true if found the typed keyword, false otherwise
            	return item.name.toLowerCase().indexOf(searchTerm) !== -1;
	        });
	    }
	});
	// Initialize Google Maps
  	this.map = new google.maps.Map(document.getElementById('map'), {
        	center: {lat: 39.34, lng: -105.09},
            zoom: 8,
			mapTypeControl: false,
			streetViewControl: false
        });

  	// Initialize markers
	this.markers = [];
	// Initialize infowindow
	this.infowindow = new google.maps.InfoWindow({
		maxWidth: 320
	});
	// Render all markers with data from the data model.
	this.renderMarkers(self.placeList());
	// Subscribe to changed in search field. If have change, render again with the filered locations.
  	this.filteredItems.subscribe(function(){
		self.renderMarkers(self.filteredItems());
  	});
  	// Add event listener for map click event (when user click on other areas of the map beside of markers)
	google.maps.event.addListener(self.map, 'click', function(event) {

		// Every click change all markers icon back to defaults.
		self.deactivateAllMarkers();

		// Every click close all indowindows.
	    self.infowindow.close();
	});
};

// Method for clear all markers.
ViewModel.prototype.clearMarkers = function() {
	for (var i = 0; i < this.markers.length; i++) {
		this.markers[i].setMap(null); //ADDED null
	}
		this.markers = [];
};

// Method for render all markers.
ViewModel.prototype.renderMarkers = function(arrayInput) {

	// Clear prev markers before a render
	this.clearMarkers();
	var infowindow = this.infowindow;
	var context = this;
	var placeToShow = arrayInput;

	// Create new marker for each place in array and push to markers array
  	for (var i = 0, len = placeToShow.length; i < len; i ++) {
		var location = {lat: placeToShow[i].lat, lng: placeToShow[i].lng};
		var marker = new google.maps.Marker({
				map: this.map,
				animation: google.maps.Animation.DROP, //new line
				position: location
			});

		this.markers.push(marker);

		//render in the map
		this.markers[i].setMap(this.map);

		// add event listener for click event to the newly created marker
		marker.addListener('click', this.activateMarker(marker, context, infowindow, i));
  	} 
};

// Set all marker icons back to default icons.
ViewModel.prototype.deactivateAllMarkers = function() {
	var markers = this.markers;
	for (var i = 0; i < markers.length; i ++) {
		markers[i].setIcon();
	}
};

// Set the target marker and open infowindow
// Call from user click on the menu list or click on the marker
ViewModel.prototype.activateMarker = function(marker, context, infowindow, index) {
	return function() {

		// check if have an index. If have an index mean request come from click on the marker event
		if (!isNaN(index)) {
			var place = context.filteredItems()[index];
			context.updateContent(place);
			context.instagramImg(place.lat, place.lng); //New
		}

		// make marker bounce when clicked on
		if (marker.getAnimation() !== null) {
                    marker.setAnimation(null);
                } else {
                    marker.setAnimation(google.maps.Animation.BOUNCE);
                }
                setTimeout(function() {
                    marker.setAnimation(null);
                }, 1400);

		// closed opened infowindow
		infowindow.close();

		// deactivate all current markers
		context.deactivateAllMarkers();

		// Open targeted infowindow above marker location on map
		infowindow.open(context.map, marker);
		marker.setIcon();

	};
};

// Change the content of infowindow
ViewModel.prototype.updateContent = function(place){
	var html = '<div class="info-content">' +
		'<h3>' + place.name + '</h3>' +
		'<img src="' + place.imgSrc + '">' +
		'<em>' + place.imgAttribute + '</em>' +
		'<p>' + place.description + '</p>' + '</div>';

	this.infowindow.setContent(html);
};

// Method for instagram API call
ViewModel.prototype.instagramImg = function(lat, lng) {

	// Prepare variable
	var igLat = lat,
		igLng = lng,
		locationURLList = [],
		imageObjList = [],
		imageList = [],
		infoBox = $('#ig-info'),
		imgDiv = $('.ig-div');

	// Remove old image and tell the user we're loading images.
	imgDiv.remove();
 	infoBox.show().removeClass('bg-danger').addClass('bg-info').text("Loading..");

 	// Make AJAX call
 	// The first call will get an array of location ID. We have to use those ID to make url for call again to get real image objects
	$.ajax({
	    type: 'GET',
	    dataType: 'jsonp',
	    cache: true,
	    url: 'https://api.instagram.com/v1/locations/search?lat=' + igLat.toString() + '&lng=' + igLng.toString() + '&distance=100&access_token=3284410013.1677ed0.835d955a8fcf4c79bfbfbfb05c18a0ef'
	}).done(function(data){

		// If request done, continue the next process
		// loop through data from instagram and make URL for second call.
	    for (var i = 0; i < data.data.length; i++) {
	    	// Create target URL from location ID and push to the URL list array
	        var targetURL = 'https://api.instagram.com/v1/locations/' + data.data[i].id + '/media/recent?access_token=3284410013.1677ed0.835d955a8fcf4c79bfbfbfb05c18a0ef';
	        locationURLList.push(targetURL);
	    }

	    // Just 10 location URL is enough. When make a request to each URL, will get a lot of images.
	    locationURLList = locationURLList.slice(0, 10);

		// Make an AJAX call with each URL in array.
		$.when.apply($, locationURLList.map(function(url) {
		    return $.ajax({
	            type: "GET",
	            dataType: "jsonp",
	            cache: true,
	            url: url
	        });
		})).done(function() {

			// If got all data from each URL then hide the info box.
			infoBox.hide();

			// Loop through returned data and make an array of image objects.
		    for (var i = 0; i < arguments.length; i ++) {
		        imageObjList.push.apply(imageObjList, arguments[i][0].data);
		    }

		    // We want only first 10 images to display.
		    imageObjList = imageObjList.slice(0, 10);

		    var imageContainer = $('<div>');

		    // Append images to the page
		    for (var j = 0; j < imageObjList.length; j ++) {
		    	imageContainer.append('<div class="ig-div"><a href="' + imageObjList[j].link + '"><img src="' + imageObjList[j].images.low_resolution.url + '" /></a></div>');
		    }

		    $('#image-area').html(imageContainer);
		});

		// Do not display error message
		clearTimeout(instagramRequestTimeout);
	});

	// But if there're any problem in the AJAX call process, tell the user.
	var instagramRequestTimeout = setTimeout(function(){
	    infoBox.removeClass('bg-info').addClass('bg-danger').text("Fail to get instagram resources");
	}, 8000);
};

// Initialize Knockout View Model
ko.applyBindings(new ViewModel());

})();
