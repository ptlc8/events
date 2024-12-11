import { defineStore } from 'pinia';
import EventsApi from '@/api';
import { mapboxAccessToken } from '@/config';

function getFromNavigator() {
    return getPosFromNavigator()
        .catch(err => console.error('[Geo] ' + err))
        .then(pos => getFromPos(pos.coords.longitude, pos.coords.latitude))
        .then(l => console.log('[Geo] Got location from navigator') || l);
}

function getPosFromNavigator() {
    return new Promise((resolve, reject) => {
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(resolve, reject);
        } else {
            reject('Geolocation not available');
        }
    });
}

function getFromAPI() {
    return EventsApi.getLocation()
        .catch(err => console.error('[Geo] ' + err))
        .then(l => console.log('[Geo] Got location from API') || l);
}

function getFromPos(lng, lat) {
    return fetch(`https://api.mapbox.com/search/searchbox/v1/reverse?longitude=${lng}&latitude=${lat}&access_token=${mapboxAccessToken}`)
        .then(res => res.json())
        .then(data => data.features[0].properties.place_formatted)
        .catch(err => {
            console.error('[SearchView] ' + err);
            return "Unknown location";
        })
        .then(name => ({ lat, lng, name }));
}

const defaultLocation = {
    lat: 48.86,
    lng: 2.35,
    name: 'Paris, France'
}

function getFromDefault() {
    console.log('[Geo] Got location from default');
    return defaultLocation;
}

export const useGeolocationStore = defineStore('geo', {
    actions: {
        get() {
            return getFromNavigator()
                .catch(e => getFromAPI())
                .catch(e => getFromDefault());
        },
        getFromPos
    }
});