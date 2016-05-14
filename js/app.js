(function(){

// Initialize Model
var placeData = [
	{
		name: 'Pikes Peak',
		lat: 38.5026,
		lng: -105.0239,
		imgSrc: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/be/Pikespeak.JPG/2560px-Pikespeak.JPG',
		imgAttribute: 'Wikipedia',
		description: 'long desripction..'
	},
	{
		name: 'Red Rocks Amphitheatre',
		lat: 39.665278,
		lng: -105.205833,
		imgSrc: 'https://upload.wikimedia.org/wikipedia/commons/3/33/RedRocksAMP.png',
		imgAttribute: 'Wikipedia',
		description: 'long desripction..'
	},
	{
		name: 'Vail',
		lat: 39.641107,
		lng: -106.375712,
		imgSrc: 'http://www.planetware.com/photos-large/USCO/colorado-vail-lake.jpg',
		imgAttribute: 'Planetware',
		description: 'Without a doubt, Vail can be a top destination ....'
	},
	{
		name: 'Coors Field',
		lat: 39.761073,
		lng: -104.993328,
		imgSrc: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e2/Coors_Field_July_2015.jpg/1920px-Coors_Field_July_2015.jpg',
		imgAttribute: 'Wikipedia',
		description: 'long desripction..'
	},
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
		// Activate the selected marker to change icon.
		// function(marker, context, infowindow, index)
		self.activateMarker(self.markers[index], self, self.infowindow)();
	};

    // Filter location name with value from search field.
	this.filteredItems = ko.computed(function() {
	    var searchTerm = self.search().toLowerCase();
	    if (!searchTerm) {
	        return self.placeList();
	    } else {
	        return ko.utils.arrayFilter(self.placeList(), function(item) {
	        	// return true if found the typed keyword, false if not found.
            	return item.name.toLowerCase().indexOf(searchTerm) !== -1;
	        });
	    }
	});
	// Initialize Google Maps
  	this.map = new google.maps.Map(document.getElementById('map'), {
        	center: {lat: 39.34, lng: -104.09},
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
		this.markers[i].setMap(null);
	}
		this.markers = [];
};

// Method for render all markers.
ViewModel.prototype.renderMarkers = function(arrayInput) {

	// Clear old markers before render
	this.clearMarkers();
	var infowindow = this.infowindow;
	var context = this;
	var placeToShow = arrayInput;

	// Create new marker for each place in array and push to markers array
  	for (var i = 0, len = placeToShow.length; i < len; i ++) {
		var location = {lat: placeToShow[i].lat, lng: placeToShow[i].lng};
		var marker = new google.maps.Marker({
				map: this.map,
				position: location,
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
		markers[i].setIcon('img/map-pin-01.png');
	}
};

// Set the target marker to change icon and open infowindow
// Call from user click on the menu list or click on the marker
ViewModel.prototype.activateMarker = function(marker, context, infowindow, index) {
	return function() {

		// check if have an index. If have an index mean request come from click on the marker event
		if (!isNaN(index)) {
			var place = context.filteredItems()[index];
			context.updateContent(place);
		}
		// closed opened infowindow
		infowindow.close();

		// deactivate all markers
		context.deactivateAllMarkers();

		// Open targeted infowindow and change its icon.
		infowindow.open(context.map, marker);
		//marker.setIcon('img/map-pin-02.png');
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

// Initialize Knockout View Model
ko.applyBindings(new ViewModel());

})();
