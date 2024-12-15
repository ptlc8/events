import { defineStore } from 'pinia';
import EventsApi from '@/api';
import { mapboxAccessToken } from '@/config';

async function getFromNavigator() {
    try {
        const pos = await getPosFromNavigator();
        const loc = await getFromPos(pos.coords.longitude, pos.coords.latitude, 15 - Math.log10(pos.coords.accuracy));
        console.log('[Geo] Got location from navigator');
        return loc;
    } catch (err) {
        console.error('[Geo] ' + err.message);
        throw err
    }
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

async function getFromAPI() {
    try {
        let loc = await EventsApi.getLocation();
        console.log('[Geo] Got location from API');
        return loc;
    } catch (err) {
        console.error('[Geo] ' + err);
        throw err;
    }
}

function getFromPos(lng, lat, zoom = 10) {
    return fetch(`https://api.mapbox.com/search/searchbox/v1/reverse?longitude=${lng}&latitude=${lat}&access_token=${mapboxAccessToken}`)
        .then(res => res.json())
        .then(data => data.features[0].properties.place_formatted)
        .catch(err => {
            console.error('[Geo] ' + err);
            return "Unknown location";
        })
        .then(name => ({ lat, lng, name, zoom }));
}

const defaultLocation = {
    lat: 48.86,
    lng: 2.35,
    name: 'Paris, France',
    zoom: 5
}

function getFromDefault() {
    console.log('[Geo] Got location from default');
    return defaultLocation;
}

export const useGeolocationStore = defineStore('geo', {
    state: () => ({
        location: null
    }),
    actions: {
        get() {
            if (this.location)
                return Promise.resolve(this.location);
            return this.refresh();
        },
        refresh() {
            return getFromNavigator()
                .catch(e => getFromAPI())
                .catch(e => getFromDefault())
                .then(l => this.location = l);
        },
        getFromPos
    }
});