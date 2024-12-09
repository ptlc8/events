import { register } from 'register-service-worker'
import { ref } from 'vue';

var deferredPrompt = null;
export const canInstallWebApp = ref(false);

if (import.meta.env.PROD) {
    register(`${import.meta.env.VITE_BASE_URL}/sw.js`, {
        ready() {
            console.info('[SW] App is being served from cache by a service worker.')
        },
        registered() {
            console.info('[SW] Service worker has been registered.')
        },
        cached() {
            console.info('[SW] Content has been cached for offline use.')
        },
        updatefound() {
            console.info('[SW] New content is downloading.')
        },
        updated() {
            console.info('[SW] New content is available; please refresh.')
        },
        offline() {
            console.log('[SW] No internet connection found. App is running in offline mode.')
        },
        error(error) {
            console.error('[SW] Error during service worker registration:', error)
        }
    });

    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        canInstallWebApp.value = true;
    });
}

export function promptInstallWebApp() {
    return new Promise(function (resolve, reject) {
        if (!deferredPrompt)
            reject(new Error("No deferredPrompt"));
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
                console.log("[SW] User accepted the A2HS prompt");
                resolve(true);
            } else {
                console.log("[SW] User dismissed the A2HS prompt");
                resolve(false);
            }
            //deferredPrompt = null;
        });
    });
}