let map;
let service;
let infoWindow;
let marker;
let directionsService;
let directionsRenderer;
const [puLat, puLng] = [-6.2849417, 107.1705597];

const geoLocationOptions = {
    enableHighAccuracy: true,
    timeout: 5000,
    maximumAge: 0,
}

const autocompleteOptions = {
    fields: ["formatted_address", "geometry", "name"],
    strictBounds: false,
    types: ["establishment"],
};
let isAddingPlace = false;
const editMarker = document.getElementById("editMarker");

if ( window.history.replaceState ) {
    window.history.replaceState( null, null, window.location.href );
}

document.addEventListener("mousemove", e => {
    if (!isAddingPlace)
    return;
    editMarker.style.left = e.pageX + 1.5 + "px";
    editMarker.style.top = e.pageY + 1.5 + "px";
})

function initMap() {
    const presidentUniversity = new google.maps.LatLng(puLat, puLng);
    
    infoWindow = new google.maps.InfoWindow();
    map = new google.maps.Map(document.getElementById("map"), {
        center: presidentUniversity,
        zoom: 15,
    });
    marker = new google.maps.Marker({
        map,
        position: presidentUniversity,
        visible: false
    });
    directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer();
    directionsRenderer.setMap(map);
    
    const card = document.createElement("div")
    card.classList.add("pac-card")
    card.innerHTML = `
    <span id="getPULocation">Get PU Location</span>
    <span onclick="addPlace(event)">Add new location</span>
    <span id="getMyLocation">Get my Location</span>
    `
    
    const inputCard = document.createElement("div")
    inputCard.classList.add("pac-card")
    inputCard.innerHTML = `
    <div class="d-flex justify-content-center align-items-center">
    <input class="form-control me-2 autocomplete-input" type="search" placeholder="Search" aria-label="Search">
    <image class="autocomplete-submit" width="25" height="25" style="margin-right: 10px; cursor: pointer;" src="https://img.uxwing.com/wp-content/themes/uxwing/download/user-interface/search-icon.png">
    </div>
    `
    
    map.controls[google.maps.ControlPosition.BOTTOM_CENTER].push(card);
    map.controls[google.maps.ControlPosition.TOP_CENTER].push(inputCard);
    
    const autocompleteInput = inputCard.querySelector('.autocomplete-input');
    const autocompleteSubmit = inputCard.querySelector('.autocomplete-submit');
    const getMyLocationButton = card.querySelector("#getMyLocation");
    const getPULocationButton = card.querySelector("#getPULocation");
    
    const autocomplete = new google.maps.places.Autocomplete(autocompleteInput, autocompleteOptions);
    autocomplete.bindTo("bounds", map);
    
    autocompleteSubmit.onclick = () => {
        const place = autocomplete.getPlace();
        if (!place.geometry || !place.geometry.location) {
            window.alert("No details available for input: '" + place.name + "'");
            return;
        }
        
        // If the place has a geometry, then present it on a map.
        if (place.geometry.viewport) {
            map.fitBounds(place.geometry.viewport);
        } else {
            map.setCenter(place.geometry.location);
            map.setZoom(17);
        }
        createMarker(place);
    }

    // Widgets
    getMyLocationButton.addEventListener("click", () => {
        // Try HTML5 geolocation.
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const pos = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                    };
                    google.maps.event.addListener(marker, "click", () => {
                        infoWindow.setPosition(pos);
                        infoWindow.setContent("Your current location.");
                        infoWindow.open(map);
                    })
                    map.setCenter(pos);
                    marker.setPosition(pos);
                    marker.setVisible(true);
                },
                () => {
                    handleLocationError(true, infoWindow, map.getCenter());
                },
                geoLocationOptions
            );
        } else {
            // Browser doesn't support Geolocation
            handleLocationError(false, infoWindow, map.getCenter());
        }
    })
    getPULocationButton.addEventListener("click", () => {
        // Try HTML5 geolocation.
        if (navigator.geolocation) {
            const pos = {
                lat: puLat,
                lng: puLng
            }
            google.maps.event.addListener(marker, "click", () => {
                infoWindow.setPosition(pos);
                infoWindow.setContent("Your current location.");
                infoWindow.open(map);
            })
            map.setCenter(pos);
            marker.setPosition(pos);
            marker.setVisible(true);
        } else {
            // Browser doesn't support Geolocation
            handleLocationError(false, infoWindow, map.getCenter());
        }
    })



    map.addListener("click", (mapsMouseEvent) => {
        if (!isAddingPlace)
            return;
        const pos = mapsMouseEvent.latLng.toJSON();
        console.log(pos);
        infoWindow.setPosition(pos);
        infoWindow.setContent(`
            <form action="" method="POST">
                <input type="hidden" name="lat" value="${pos.lat}">
                <input type="hidden" name="lng" value="${pos.lng}">

                <label for="title">Place name: </label>
                <input class="form-control me-2" type="text" name="name">
                <br>
                
                <label for="title">Ratings: </label>
                <span class="d-flex align-items-center"><input type="number" class="form-control me-2" name="ratings" min="0" max="5">/5</span>
                <br>
                <button class="btn btn-primary" name="addPlace" type="submit">Add</button>
            </form>
            `);
        infoWindow.open(map);
    });

    findNearbyFarmersMarket();
    if (places)
        places.forEach(place => {
            const obj = {
                geometry: {
                    location: new google.maps.LatLng(place.lat, place.lng)
                },
                name: place.name,
                rating: place.ratings
            }
            console.log(obj)
            createMarker(obj);
        });
}

function addPlace(e) {
    console.log("ADDING");
    if(isAddingPlace)
        return cancelPlace(e);
    e.target.innerHTML = "Cancel new location"
    isAddingPlace = true;
    editMarker.style.display = "block"
}

function cancelPlace(e) {
    
    e.target.innerHTML = "Add new location"
    isAddingPlace = false;
    editMarker.style.display = "none"
}

function createMarker(place) {
    if (!place.geometry || !place.geometry.location)
        return;
    
    const marker = new google.maps.Marker({
        map,
        position: place.geometry.location,
    });

    const rad = function (x) {
        return x * Math.PI / 180;
    };

    const getDistance = function (p1, p2) {
        var R = 6378137; // Earth’s mean radius in meter
        var dLat = rad(p2.lat() - p1.lat);
        var dLong = rad(p2.lng() - p1.lng);
        var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(rad(p1.lat)) * Math.cos(rad(p2.lat())) *
            Math.sin(dLong / 2) * Math.sin(dLong / 2);
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        var d = R * c;
        return d; // returns the distance in meter
    };
    const distance = getDistance({ lat: puLat, lng: puLng }, place.geometry.location);

    google.maps.event.addListener(marker, "click", () => {
        infoWindow.setPosition(place.geometry.location);
        infoWindow.setContent(`
        <span class="fw-bold">${place.name}</span> 
        <br>
        <span>Rating <span class="fw-bold">${place.rating || 0}/5</span> (${place.user_ratings_total || 0})</span>
        <br>
        <span><span class="fw-bold">${Math.floor(distance)}</span> meters away from you.</span>
        <br>
        <button class="btn btn-primary d-flex align-items-center justify-content-center" style="height: 25px;" onclick="getDirection({ lat: ${puLat}, lng: ${puLng} }, { lat: ${place.geometry.location.lat()}, lng: ${place.geometry.location.lng()} })">Get Directions</button>
        `);
        infoWindow.open(map);
    })
}

function findNearbyFarmersMarket() {
    const pos = {
        lat: -6.2849417,
        lng: 107.1705597,
    };
    var request = {
        location: pos,
        radius: '3000',
        type: ['cafe']
    };

    service = new google.maps.places.PlacesService(map);
    service.nearbySearch(request, nearbySearchCallback);

}
function getDirection(p1, p2) {
    directionsService
        .route({
            origin: {
                query: `${p1.lat},${p1.lng}`
            },
            destination: {
                query: `${p2.lat},${p2.lng}`
            },
            travelMode: google.maps.TravelMode.DRIVING,
        })
        .then((response) => {
            directionsRenderer.setDirections(response);
        })
        .catch((e) => window.alert("Directions request failed due to " + e));
}

function nearbySearchCallback(results, status) {
    if (status == google.maps.places.PlacesServiceStatus.OK) {
        for (var i = 0; i < results.length; i++) {
            createMarker(results[i]);
        }
    }
}
function handleLocationError(browserHasGeolocation, infoWindow, pos) {
    infoWindow.setPosition(pos);
    infoWindow.setContent(
        browserHasGeolocation
            ? "Error: The Geolocation service failed."
            : "Error: Your browser doesn't support geolocation."
    );
    infoWindow.open(map);
}


window.initMap = initMap;