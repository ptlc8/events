<template>
    <div id="map-container"></div>
</template>

<script>
import { watch } from 'vue';
import { mapboxAccessToken } from '@/config';

import mapboxgl from 'mapbox-gl/dist/mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import StylesControl from '@mapbox-controls/styles';
import '@mapbox-controls/styles/src/index.css';

import markerIcon from '@/assets/icons/marker.png';
mapboxgl.accessToken = mapboxAccessToken;

export default {
    name: 'EventsMap',
    setup: () => ({
        StylesControl
    }),
    props: {
        search: Object
    },
    data: () => ({
        map: null,
        events: []
    }),
    mounted() {
        var language = this.$texts.getLang() == 'zh' ? 'zh-Hans' : this.$texts.getLang();
        var dark = window.matchMedia('(prefers-color-scheme: dark)').matches;

        this.map = new mapboxgl.Map({
            container: 'map-container',
            style: dark ? 'mapbox://styles/mapbox/dark-v11' : 'mapbox://styles/mapbox/streets-v12',
            center: [2.35, 48.86],
            zoom: 5,
            language
        });

        var eventId = this.$route.query.show || this.$route.query.e;
        if (eventId !== undefined) {
            this.$api.getEvent(eventId).then(event => {
                if (!event) return;
                this.map.flyTo({
                    center: [event.lng, event.lat],
                    zoom: 15,
                    essential: true
                });
            });
        } else {
            this.$geolocation.get().then(loc =>
                this.map.flyTo({
                    center: loc,
                    zoom: loc.zoom
                })
            );
        }

        this.map.on('load', () => {
            this.map.loadImage(markerIcon, (error, image) => {
                if (error) throw error;
                this.map.addImage('event-marker', image);
                this.map.addSource('events', {
                    type: 'geojson',
                    data: this.getEventsAsGeoJson(),
                    cluster: true,
                    clusterMaxZoom: 14,
                    clusterRadius: 50
                });
                watch(() => this.events, () => {
                    this.map.getSource('events').setData(this.getEventsAsGeoJson());
                });
                this.updateEvents();
                this.map.addLayer({
                    id: 'events',
                    type: 'symbol',
                    source: 'events',
                    filter: ['!', ['has', 'point_count']],
                    layout: {
                        'icon-image': 'event-marker',
                        'icon-size': .5,
                        'text-field': ['get', 'eventTitle'],
                        'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
                        'text-offset': [0, 1.25],
                        'text-anchor': 'top'
                    },
                    paint: {
                        'text-color': dark ? '#fff' : '#000',
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

        this.map.addControl(new mapboxgl.NavigationControl(), "bottom-right");
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
            let eventId = e.features[0].properties.eventId;
            this.$router.replace({ ...this.$route, query: { ...this.$route.query, show: undefined, e: eventId } });
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
    watch: {
        search: {
            handler() {
                this.updateEvents();
            },
            deep: true
        }
    },
    methods: {
        getEventsAsGeoJson() {
            return {
                type: 'FeatureCollection',
                features: this.events.map(event => ({
                    type: 'Feature',
                    geometry: { type: 'Point', coordinates: [event[1], event[2]] },
                    properties: { eventTitle: event[3], eventId: event[0] }
                }))
            };
        },
        updateEvents() {
            this.$api.getEvents({
                min: true,
                minlat: this.map.getBounds().getSouth(),
                minlng: this.map.getBounds().getWest(),
                maxlat: this.map.getBounds().getNorth(),
                maxlng: this.map.getBounds().getEast(),
                text: this.search.text,
                datemin: this.search.date.min,
                datemax: this.search.date.max,
                timemin: this.search.time.min,
                timemax: this.search.time.max,
                cats: this.search.cats
            }).then(events => this.events = events);
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

.mapboxgl-ctrl-group {
    background-color: var(--color-background);
}

button[class*=mapboxgl-ctrl-] {
    box-shadow: none;
    margin: 0;
    border-radius: 0;
}

@media (prefers-color-scheme: dark) {
    .mapboxgl-ctrl-icon {
        filter: invert(1);
    }
}
</style>