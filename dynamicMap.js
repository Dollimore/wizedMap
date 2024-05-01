mapboxgl.accessToken = 'Mapbox API Key';

let coordinates = []; // Declare an array to hold latitude and longitude

const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/dollimore/clp93hln7000b01op91nnhxl8', // Enter your style URL here 
    zoom: 4.5, // Enter the zoom level here (higher value for closer view)
    center: [153.0260, -27.4705], // Enter your center coordinates here [longitude, latitude])
    preserveDrawingBuffer: true
});

const geocodeAddress = (address, callback) => {
    fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?country=${'AU'}&access_token=${mapboxgl.accessToken}`) // ?country=${'AU'} is optional, but recommended for accurate results
        .then(response => response.json())
        .then(data => {
            if (data.features && data.features.length > 0) {
                coordinates = data.features[0].center; // Assign both latitude and longitude to the coordinates array
                const [longitude, latitude] = coordinates;
                callback(latitude, longitude);
            } else {
                console.error('Geocoding failed. Address not found.');
            }
        })
        .catch(error => {
            console.error('Geocoding failed:', error);
        });
};

map.on('load', () => {
    console.log('Map Loaded');

    const addresses = []; // List of addresses

    const items = v.get_listings_map; // Get variables from wized

    items.forEach(item => {
        // Check if the item has the key 'full_address'
        if ('full_address' in item && 'id' in item) {
            // If 'full_address' and 'id' exist in the item, add them to the addresses array 
            // Replace 'full_address' and 'id' with your address and id column/field names 
            addresses.push({
                address: item.full_address,
                id: item.id
            });
        }
    });

    addresses.forEach(addressObj => {
        const { address, id } = addressObj;

        geocodeAddress(address, (latitude, longitude) => {
            map.loadImage('https://daks2k3a4ib2z.cloudfront.net/660a58a6b576d554dffa2146/661ba828c790aef163e5e1f1_harper.png', (error, customImage) => {
                if (error) throw error;

                const iconName = `custom-icon-${id}`; // Include UUID in the iconName

                // Remove existing image if it exists
                if (map.hasImage(iconName)) {
                    map.removeImage(iconName);
                }

                map.addImage(iconName, customImage);

                map.addSource(`address-${id}`, { // Include UUID in the source ID
                    type: 'geojson',
                    data: {
                        type: 'Feature',
                        geometry: {
                            type: 'Point',
                            coordinates: [longitude, latitude]
                        },
                        properties: {
                            id: id // Include UUID in the properties
                        }
                    }
                });

                map.addLayer({
                    id: `address-marker-layer-${id}`, // Include UUID in the layer ID
                    type: 'symbol',
                    source: `address-${id}`, // Include UUID in the source ID
                    layout: {
                        'icon-image': iconName,
                        'icon-allow-overlap': true,
                        'icon-size': 0.50
                    }
                });

                // Add click event listener to the custom image marker
                map.on('click', `address-marker-layer-${id}`, (e) => {
                    // Extract UUID from the clicked feature
                    const clickedId = e.features[0].properties.id;

                    // Find the corresponding property card using data-id attribute created in wized
                    const propertyCard = document.querySelector(`.mapcard[data-id="${clickedId}"]`); 

                    if (propertyCard) {
                        // Clone the original mapcard
                        const clonedCard = propertyCard.cloneNode(true);

                        // Create and show the popup with the cloned mapcard content
                        const popup = new mapboxgl.Popup({ maxWidth: '300px', offset: [0, -100] }) // Offset the popup to avoid popup opening out of view of map container
                            .setLngLat(e.lngLat)
                            .setDOMContent(clonedCard)
                            .addTo(map);

                        // Add click event listener to the popup content
                        const popupContent = popup._content;
                        popupContent.addEventListener('click', () => {
                            const mapCard = popupContent.querySelector('.mapcard');
                            if (mapCard) {
                                const dataId = mapCard.getAttribute('data-id');
                                c.listingID = dataId; // Check Cookie ID against dataId 
                            }
                        });

                        // Fly to the clicked location
                        map.flyTo({
                            center: e.lngLat, // Coordinates of the clicked location
                            essential: true, // Animation is considered essential with respect to prefers-reduced-motion
                            duration: 1000 // Duration of the animation in milliseconds (e.g., 1000ms = 1 second)
                        });
                    }
                });
            });
        });
    });

    // Add click event listener to the map to close the property card when clicked outside
    map.on('click', () => {
        const propertyCards = document.querySelectorAll('.mapcard.show');
        propertyCards.forEach(card => {
            card.classList.remove('show');
        });
    });
});
