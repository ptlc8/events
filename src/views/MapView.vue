<template>
    <div id="map-container"></div>
</template>

<script>
import EventsApi from '@/api';
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
    mounted() {
        this.map = new mapboxgl.Map({
            container: 'map-container',
            style: 'mapbox://styles/mapbox/streets-v11',
            center: [2.35, 48.86],
            zoom: 5
        });

        var eventId = this.$route.query.show || this.$route.query.e;
        if (eventId !== undefined) {
            this.$store.event = null;
            EventsApi.getEvent(eventId).then(event => {
                if (!event) return;
                this.map.flyTo({
                    center: [event.lng, event.lat],
                    zoom: 15,
                    essential: true
                });
            });
        } else {
            EventsApi.getLocation().then(loc => this.map.setCenter(loc));
        }

        this.map.on('load', () => {

            var mapLang = ['ar', 'en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'vi'].includes(this.$text.getLang()) ? 'name_' + this.$text.getLang() : this.$text.getLang() == 'zh' ? 'name_zh-Hans' : 'name';
            this.map.setLayoutProperty('country-label', 'text-field', ['get', mapLang]);

            this.map.loadImage(this.markerIcon, (error, image) => {
                if (error) throw error;
                this.map.addImage('marker', image);
                this.map.addSource('events', {
                    type: 'geojson',
                    data: this.getEventsAsGeoJson(),
                    cluster: true,
                    clusterMaxZoom: 14,
                    clusterRadius: 50
                });
                watch(() => this.$store.events, () => {
                    this.map.getSource('events').setData(this.getEventsAsGeoJson());
                });
                this.updateEvents();
                this.map.addLayer({
                    id: 'events',
                    type: 'symbol',
                    source: 'events',
                    filter: ['!', ['has', 'point_count']],
                    layout: {
                        'icon-image': 'marker',
                        'icon-size': .5,
                        'text-field': ['get', 'eventTitle'],
                        'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
                        'text-offset': [0, 1.25],
                        'text-anchor': 'top'
                    }
                });
                this.map.addLayer({
                    id: 'events-clusters',
                    type: 'circle',
                    source: 'events',
                    filter: ['has', 'point_count'],
                    paint: {
                        'circle-color': '#f00',
                        'circle-radius': ['+', 15, ['*', 5, ['log10', ['get', 'point_count']]]]
                    }
                });
                this.map.addLayer({
                    id: 'events-clusters-counts',
                    type: 'symbol',
                    source: 'events',
                    filter: ['has', 'point_count'],
                    layout: {
                        'text-field': ['case', ['<', ['get', 'point_count'], 1000], ['get', 'point_count'], "999+"]
                    },
                    paint: {
                        'text-color': '#fff',
                        'text-halo-color': '#fff',
                        'text-halo-width': .5
                    }
                });
            });
        });

        this.map.addControl(
            new MapboxGeocoder({
                accessToken: mapboxgl.accessToken,
                localGeocoder: this.forwardGeocoder,
                zoom: 14,
                placeholder: 'Enter search' + (this.$store.events.length ? ' e.g. ' + this.$store.events[parseInt(Math.random() * this.$store.events.length)][0] : ''),
                mapboxgl: mapboxgl
            })
        );
        this.map.addControl(new mapboxgl.NavigationControl());
        /*this.map.addControl(new StylesControl({
            onChange: () => {}
        }), "bottom-left");*/

        this.map.on('mouseenter', 'events', e => {
            this.map.getCanvas().style.cursor = 'pointer';
        });

        this.map.on('mouseleave', 'events', () => {
            this.map.getCanvas().style.cursor = '';
        });

        this.map.on('click', 'events', e => {
            var coordinates = e.features[0].geometry.coordinates.slice();
            // if multiple features
            while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
                coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
            }
            EventsApi.getEvent(e.features[0].properties.eventId).then(event => {
                this.$store.event = event;
            });
        });

        this.map.on('click', 'events-clusters', e => {
            var features = this.map.queryRenderedFeatures(e.point, {
                layers: ['events-clusters']
            });
            var clusterId = features[0].properties.cluster_id;
            this.map.getSource('events').getClusterExpansionZoom(
                clusterId,
                (err, zoom) => {
                    if (err) return;
                    this.map.easeTo({
                        center: features[0].geometry.coordinates,
                        zoom: zoom
                    });
                }
            );
        });

        this.map.on('moveend', this.updateEvents);
    },
    methods: {
        getEventsAsGeoJson() {
            return {
                type: 'FeatureCollection',
                features: this.$store.events.map(event => ({
                    type: 'Feature',
                    geometry: { type: 'Point', coordinates: [event[1], event[2]] },
                    properties: { eventTitle: event[3], eventId: event[0] }
                }))
            };
        },
        updateEvents() {
            EventsApi.getEvents({
                minlat: this.map.getBounds().getSouth(),
                minlng: this.map.getBounds().getWest(),
                maxlat: this.map.getBounds().getNorth(),
                maxlng: this.map.getBounds().getEast(),
                min: true
            })
                .then(events => this.$store.events = events);
        },
        forwardGeocoder(query) {
            var matchingFeatures = [];
            for (let event of this.$store.events) {
                if (event[3].toLowerCase().search(query.toLowerCase()) !== -1) {
                    // add a festive emoji as a prefix for custom data results
                    var feature = {};
                    feature.place_name = '✨ ' + event[3];
                    feature.center = [event[1], event[2]];
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