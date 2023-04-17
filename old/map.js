function loadMap(mapContainerId, location=[2.3522, 48.8566]) {
    if (!window.mapboxgl) throw "[Map] Could not find mapboxgl";
    mapboxgl.accessToken = 'pk.eyJ1IjoicHRsYyIsImEiOiJja2Qxb2tmN2Uwc2s1MndxbXk2dmdjMGNrIn0.bame3uGYhs6O4cIFUGAkhA';
    var map = new mapboxgl.Map({
        container: mapContainerId,
        style: 'mapbox://styles/mapbox/outdoors-v11',
        center: location.reverse(),
        zoom: 4
    });
    map.on('load', function() {
        map.loadImage(
            'https://upload.wikimedia.org/wikipedia/commons/thumb/5/59/Location_dot_yellow.svg/16px-Location_dot_yellow.svg.png',
            function(error, image) {
                if (error) throw error;
                map.addImage('dot', image);
            }
        );
        
        var events = [];
        EventsApi.getEvents().then(eventsResult => {
            events = eventsResult;
            map.addSource("events", {type:"geojson", data:{type:'FeatureCollection',features:events.map(e=>{return {type:"Feature", "geometry":{type:"Point", coordinates: e.coords}, properties:{eventId:e.id}}})}});
            map.addLayer({
                'id': 'events',
                'type': 'symbol',
                'source': 'events',
                'layout': {'icon-image': 'dot', 'icon-size': 1, 'icon-allow-overlap': true}
            });
        });
        
        function forwardGeocoder(query) {
            var matchingFeatures = [];
            for (var i = 0; i < events.length; i++) {
                var event = events[i];
                if (event.title.toLowerCase().search(query.toLowerCase()) !== -1) {
                    // add a festive emoji as a prefix for custom data results
                    // not using carmen geojson format: https://github.com/mapbox/carmen/blob/master/carmen-geojson.md
                    var feature = {};
                    //feature.type = "Feature";
                    //feature.geometry = {type:"Point", coordinates:event.coordinates};
                    feature['place_name'] = '✨ ' + event.title;
                    feature['center'] = event.coords;
                    feature['place_type'] = ['park'];
                    matchingFeatures.push(feature);
                }
            }
            return matchingFeatures;
        }
        
        map.addControl(
            new MapboxGeocoder({
                accessToken: mapboxgl.accessToken,
                localGeocoder: forwardGeocoder,
                zoom: 14,
                placeholder: 'Enter search' + (events.length?' e.g. '+events[parseInt(Math.random()*events.length)].title:''),
                mapboxgl: mapboxgl
            })
        );
        map.addControl(new mapboxgl.NavigationControl());
        map.addControl(new StylesControl(), "bottom-left");
        
        mapLang = ["ar", "en", "es", "fr", "de", "it", "pt", "ru", "ja", "ko", "vi"].includes(Texts.getLang()) ? "name_"+Texts.getLang() : Texts.getLang()=="zh" ? "name_zh-Hans" : "name";
        map.setLayoutProperty('country-label', 'text-field', ['get', mapLang]);
        
        var popup = new mapboxgl.Popup({
            closeButton: false,
            closeOnClick: false
        });
            
        map.on('mouseenter', 'events', function(e) {
            // Change the cursor style as a UI indicator.
            map.getCanvas().style.cursor = 'pointer';
            
            var coordinates = e.features[0].geometry.coordinates.slice();
            let event = events.find(evt => evt.id==e.features[0].properties.eventId);
            var description = `<b>${event.title}</b><p>${event.description}</p>`;
            
            // Ensure that if the map is zoomed out such that multiple
            // copies of the feature are visible, the popup appears
            // over the copy being pointed to.
            while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
                coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
            }
                
            // Populate the popup and set its coordinates
            // based on the feature found.
            popup
                .setLngLat(coordinates)
                .setHTML(description)
                .addTo(map);
        });
            
        map.on('mouseleave', 'events', function() {
            map.getCanvas().style.cursor = '';
            popup.remove();
        });
        
        map.on('click', 'events', function(e) {
            
            var coordinates = e.features[0].geometry.coordinates.slice();
            let event = events.find(evt => evt.id==e.features[0].properties.eventId);
            
            // Ensure that if the map is zoomed out such that multiple
            // copies of the feature are visible, the popup appears
            // over the copy being pointed to.
            while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
                coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
            }
            
            console.info(e.features[0].properties)
            popupEvent(event);
            
            map.flyTo({
                center: e.features[0].geometry.coordinates
            });
        });
        
    });
}