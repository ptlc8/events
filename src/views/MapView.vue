<template>
    <div id="map-container"></div>
</template>

<script>
import EventsApi from '@/api';
import Texts from '@/texts';
import { watch } from 'vue';

import mapboxgl from 'mapbox-gl/dist/mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css';
import { StylesControl } from 'mapbox-gl-controls';
import 'mapbox-gl-controls/lib/controls.css';

import markerIcon from '@/assets/icons/marker.png';
mapboxgl.accessToken = 'pk.eyJ1IjoicHRsYyIsImEiOiJja2Qxb2tmN2Uwc2s1MndxbXk2dmdjMGNrIn0.bame3uGYhs6O4cIFUGAkhA';

export default {
    name: 'MapView',
    setup() {
        return { mapboxgl, markerIcon, MapboxGeocoder, StylesControl };
    },
    data() {
        return {
            map: null
        };
    },
    async mounted() {
        this.map = new mapboxgl.Map({
            container: 'map-container',
            style: 'mapbox://styles/mapbox/streets-v11',
            center: await EventsApi.getLocation(),
            zoom: 5
        });

        this.map.on('load', () => {

            var mapLang = ['ar', 'en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'vi'].includes(Texts.getLang()) ? 'name_' + Texts.getLang() : Texts.getLang() == 'zh' ? 'name_zh-Hans' : 'name';
            this.map.setLayoutProperty('country-label', 'text-field', ['get', mapLang]);

            this.map.loadImage(this.markerIcon, (error, image) => {
                if (error) throw error;
                this.map.addImage('marker', image);
                this.map.addSource('events', {
                    type: 'geojson',
                    data: this.getEventsAsGeoJson()
                });
                watch(() => this.$store.events, () => {
                    console.log("updating events on map");
                    this.map.getSource('events').setData(this.getEventsAsGeoJson());
                });
                this.updateEvents();
                this.map.addLayer({
                    'id': 'events',
                    'type': 'symbol',
                    'source': 'events',
                    'layout': {
                        'icon-image': 'marker', 'icon-size': .5, 'icon-allow-overlap': true,
                        /*'text-field': ['get', 'eventTitle'],
                        'text-variable-anchor': ['top', 'bottom', 'left', 'right'],
                        'text-radial-offset': 0.5,
                        'text-justify': 'auto'*/
                    },
                });
            });
        });

        this.map.addControl(
            new MapboxGeocoder({
                accessToken: mapboxgl.accessToken,
                localGeocoder: this.forwardGeocoder,
                zoom: 14,
                placeholder: 'Enter search' + (this.$store.events.length ? ' e.g. ' + this.$store.events[parseInt(Math.random() * this.$store.events.length)].title : ''),
                mapboxgl: mapboxgl
            })
        );
        this.map.addControl(new mapboxgl.NavigationControl());
        this.map.addControl(new StylesControl(), "bottom-left");

        var popup = new mapboxgl.Popup({
            closeButton: false,
            closeOnClick: false
        });

        this.map.on('mouseenter', 'events', e => {
            this.map.getCanvas().style.cursor = 'pointer';
            var coordinates = e.features[0].geometry.coordinates.slice();
            // if multiple features
            while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
                coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
            }
            var [title, description] = [e.features[0].properties.eventTitle, e.features[0].properties.eventDescription];
            var html = `<b>${title}</b><p>${description}</p>`;
            popup.setLngLat(coordinates)
                .setHTML(html)
                .addTo(this.map);
        });

        this.map.on('mouseleave', 'events', () => {
            this.map.getCanvas().style.cursor = '';
            popup.remove();
        });

        this.map.on('click', 'events', e => {
            var coordinates = e.features[0].geometry.coordinates.slice();
            // if multiple features
            while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
                coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
            }
            this.$store.event = this.$store.events.find(evt => evt.id == e.features[0].properties.eventId);
            this.map.flyTo({
                center: e.features[0].geometry.coordinates
            });
        });

        this.map.on('moveend', this.updateEvents);
    },
    methods: {
        getEventsAsGeoJson() {
            console.log("converting events to geojson")
            window.store = this.$store
            window.map = this.map;
            return {
                type: 'FeatureCollection',
                features: this.$store.events.map(event => ({
                    type: 'Feature',
                    geometry: { type: 'Point', coordinates: [event.lng, event.lat] },
                    properties: { eventTitle: event.title, eventId: event.id, eventDescription: event.description }
                }))
            };
        },
        updateEvents() {
            EventsApi.getEvents({
                minlat: this.map.getBounds().getSouth(),
                minlng: this.map.getBounds().getWest(),
                maxlat: this.map.getBounds().getNorth(),
                maxlng: this.map.getBounds().getEast(),
                limit: 100
            })
                .then(events => this.$store.events = events);
        },
        forwardGeocoder(query) {
            var matchingFeatures = [];
            console.log("local search");
            for (let event of this.$store.events) {
                if (event.title.toLowerCase().search(query.toLowerCase()) !== -1) {
                    // add a festive emoji as a prefix for custom data results
                    var feature = {};
                    feature.place_name = '✨ ' + event.title;
                    feature.center = [event.lng, event.lat];
                    feature.place_type = ['park'];
                    matchingFeatures.push(feature);
                }
            }
            return matchingFeatures;
        }
    }
};
</script>

<style lang="scss">
#map-container {
    width: 100%;
    height: 100%;
}

.mapboxgl-control-container {
    position: static
}

[class*=mapboxgl-ctrl-] {
    margin: initial;

    button {
        color: #000;
        margin: 0;
        box-shadow: none;
    }
}
</style>