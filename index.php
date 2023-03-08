<!DOCTYPE html>
<?php
$ip = $_SERVER['REMOTE_ADDR'];
$ipInfo = json_decode(file_get_contents("http://ipinfo.io/{$ip}/json"));
?>
<html>
    <head>
        <meta charset="UTF-8" />
        <meta property="og:url" content="https://<?php echo $_SERVER['HTTP_HOST'].$_SERVER['REQUEST_URI']; ?>" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Title" /> <!--TODO-->
        <meta property="og:description" content="Description" />
        <meta property="og:image" content="https://<?php echo $_SERVER['HTTP_HOST']; ?>/events/map.svg" />
        <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no" />
        <link rel="stylesheet" href="style.css?<?php echo time(); ?>" />
        <!-- Mapbox -->
        <script src='https://api.mapbox.com/mapbox-gl-js/v1.11.1/mapbox-gl.js'></script>
        <link href='https://api.mapbox.com/mapbox-gl-js/v1.11.1/mapbox-gl.css' rel='stylesheet' />
        <script src="https://api.mapbox.com/mapbox-gl-js/plugins/mapbox-gl-geocoder/v4.5.1/mapbox-gl-geocoder.min.js"></script>
        <link rel="stylesheet" href="https://api.mapbox.com/mapbox-gl-js/plugins/mapbox-gl-geocoder/v4.5.1/mapbox-gl-geocoder.css" type="text/css" />
        <!-- Promise polyfill script required to use Mapbox GL Geocoder in IE 11 -->
        <script src="https://cdn.jsdelivr.net/npm/es6-promise@4/dist/es6-promise.min.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/es6-promise@4/dist/es6-promise.auto.min.js"></script>
        <!-- Styles extension Mapbox -->
        <script src="mapbox-styles-control.js"></script>
        <link rel="stylesheet" href="mapbox-styles-control.css" />
        <!-- Tiny textarea -->
        <script src="https://cdn.tiny.cloud/1/7hkow4ra868f55cpirrqdbqdwpublcqk7mx9b1s9z84eua44/tinymce/5/tinymce.min.js" referrerpolicy="origin"></script>
        <script>
            function sendRequest(method, url, body=undefined, contentType="application/x-www-form-urlencoded") {
                var promise = new (Promise||ES6Promise)(function(resolve, reject) {
                    var xhr = new XMLHttpRequest();
                    xhr.open(method, url);
                    xhr.setRequestHeader("Content-Type", contentType);
                    xhr.onreadystatechange = function() {
                        if (this.readyState == XMLHttpRequest.DONE && this.status == 200) {
                            resolve(this.response);
                        }
                    }
                    xhr.send(body);
                });
                return promise;
            }
            function createElement(tag, properties={}, inner=[], eventListeners={}) {
                let el = document.createElement(tag);
                for (let p of Object.keys(properties)) if (p != "style") el[p] = properties[p];
                if (properties.style) for (let p of Object.keys(properties.style)) el.style[p] = properties.style[p];
                if (typeof inner == "object") for (let i of inner) el.appendChild(typeof i == "string" ? document.createTextNode(i) : i);
                else el.innerText = inner;
                for (let l of Object.keys(eventListeners)) el.addEventListener(l, eventListeners[l]);
                return el
            }
            var texts = [];
            function text(id) {
                if (!texts[lang]) {
                    sendRequest("GET", "lang-"+"fr"+".json").then(function(response) { // TODO other lang
                        texts[lang] = JSON.parse(response);
                    });
                    return ""; // TODO : promise ?
                } else {
                    return texts[lang][id];
                }
            }
            function getDisplayDate(datetime) {
                var datetime = new Date(datetime);
                var date = new Date(datetime);
                date.setHours(0,0,0,0);
                var now = new Date();
                var today = new Date();
                today.setHours(0,0,0,0);
                
                if (date.getTime() == today.getTime()-86400000) return text("yesterday");
                if (date.getTime() < today.getTime()) return text("past");
                if (date.getTime() == today.getTime()) return text("today");
                if (date.getTime() == today.getTime()+86400000) return text("tomorrow");
                if (date.getTime() < today.getTime()+6*86400000) return text("weekdays")[date.getDay()]+text("next");
                return text("thedate") + date.getDate() + " " + text("months")[date.getMonth()] + (date.getYear()==today.getYear()?"":" "+date.getYear())
                if (date.getTime() )
                return "TODO";
            }
            var allcategories = JSON.parse('{"party":{"emote":"🎉"},"arts":{"emote":"🎨"},"theater":{"emote":"🎭"},"music":{"emote":"🎶"},"online":{"emote":"💻"},"children":{"emote":"👧‍👦"},"shopping":{"emote":"🛍"},"cinema":{"emote":"🎬"},"food":{"emote":"🍽"},"wellbeing":{"emote":"😌"},"show":{"emote":"🎟"},"sport":{"emote":"🎾"},"literature":{"emote":"📚"},"drink":{"emote":"🍹"},"gardening":{"emote":"🌱"},"cause":{"emote":"🎗"},"craft":{"emote":"📐"}}');
            function getDisplayCategories(categories) {
                return categories.map(c=>allcategories[c].emote +" "+ text(c));
            }
            function popup(content=[]) {
                var promise = new (Promise||ES6Promise)(function(resolve, reject) {
                    var popupC = document.createElement("div");
                    popupC.className = "popup-container";
                    popupC.addEventListener("click", ()=>{popupC.parentElement.removeChild(popupC); resolve();});
                    document.body.appendChild(popupC)
                    var popup = document.createElement("div");
                    popup.className = "popup";
                    popup.addEventListener("click", (e)=>{e.stopPropagation();})
                    popupC.appendChild(popup);
                    var close = document.createElement("img");
                    close.className = "close";
                    close.src = "cross.svg";
                    close.addEventListener("click", ()=>{popupC.parentElement.removeChild(popupC); resolve();});
                    popup.appendChild(close);
                    for (let el of content) popup.appendChild(el);
                });
                return promise;
            }
            function popupEvent(event) {
                setPoster(event.id);
                let banner = createElement("div", {className: "banner"});
                banner.style.backgroundImage = "url('https://les-seminaires.eu/wp-content/uploads/2019/04/organisation-evenement-entreprise-735x400.png')";
                let share = navigator.share
                    ? createElement("button", {className:"large-share-button"}, "Partager", {click:function(){
                            navigator.share({title:event.title, text:'Regarde cet évent, il a l\'air intéressant !', url:document.URL})
                        }})
                    : createElement("div", {className:"share-buttons"});
                if (!navigator.share) share.innerHTML = '<div style="text-align:center;">Partagez cet évent !</div>'
                    + `<a class="tb-share-button" target="_blank" href="https://www.tumblr.com/share/link?url=${encodeURIComponent(document.URL)}&title=${encodeURIComponent(event.title)}"></a>`
                    + `<a class="em-share-button" target="_blank" href="mailto:?Subject=${encodeURIComponent(event.title)}&Body=${encodeURIComponent("Regarde cet évent, il a l'air intéréssant : "+document.URL)}"></a>`
                    + `<a class="fb-share-button" target="_blank" href="https://www.facebook.com/sharer.php?u=${encodeURIComponent(document.URL)}"></a>`
                    + `<a class="tw-share-button" target="_blank" href="https://twitter.com/share?url=${encodeURIComponent(document.URL)}&text=${encodeURIComponent(event.title)}&hashtags=events"></a>`
                    + `<a class="wa-share-button" target="_blank" href="https://api.whatsapp.com/send?text=${encodeURIComponent("Regarde cet évent, il a l'air intéréssant : "+document.URL)}"></a>`
                    + `<a class="mg-share-button" target="_blank" href="fb-messenger://share/?link=${encodeURIComponent(document.URL)}"></a>`
                    + `<a class="tg-share-button" target="_blank" href="https://t.me/share?url=${encodeURIComponent(document.URL)}&text=${encodeURIComponent("Regarde cet évent, il a l'air intéressant : "+event.title)}"></a>`
                    + `<button class="copy-button" onclick="var tmp = document.createElement('input'); document.body.appendChild(tmp); tmp.value=window.location.href; tmp.select(); document.execCommand('copy'); tmp.parentElement.removeChild(tmp); this.innerText=text('copied'); let a = this; setTimeout(function(){a.innerText=''}, 2000);"></button>`;
                let body = createElement("div", {className: "body"}, [
                    createElement("span", {className:"title"}, event.title),
                    createElement("div", {className:"categories"}, getDisplayCategories(event.categories).map(e=>createElement("span", {}, e))),
                    createElement("div", {className:"description"}, event.description),
                    createElement("div", {className:"sidebar"}, [
                        createDateElement(event.datetime),
                        createElement("button", {className:"add-fav"}, "⭐ Ajouter à mes favoris", {click:function() {
                            // TODO !
                        }}),
                        share
                    ]),
                    createElement("div", {className:"footer"}, "Ça a l'air chouette, non ?! 🦉")
                ]);
                return popup([banner, body]).then(unsetPoster);
            }
            function queryEvent(eventId) {
                var promise = new (Promise||ES6Promise)(function(resolve, reject) {
                    console.info("[event] Querying event "+eventId)
                    sendRequest("GET", "get?id="+eventId).then(function(response){
                        resolve(JSON.parse(response)[0]);
                    });
                });
                return promise;
            }
            function popupLogin() {
                let title = createElement("span", {className: "title"}, "Connexion");
                let usernameInput = createElement("input", {placeholder: "Nom d'utilisateur", autofocus: true});
                let passwordInput = createElement("input", {placeholder: "Mot de passe", type: "password"});
                var loginButton = createElement("button", {}, "Se connecter", {click: function() {
                    sendRequest("POST", "/login", "username="+encodeURIComponent(usernameInput.value)+"&password="+encodeURIComponent(passwordInput.value)).then(function(r) {
                        if (r=="invalid") {
                            info.innerText = "Nom d'utilisatuer ou mot de passe invalide :/";
                            forgotten.style.display = "";
                        } else if (r=="logged in") {
                            loginButton.parentElement.parentElement.parentElement.click();
                        }
                    });
                }});
                var info = createElement("span");
                var forgotten = createElement("a", {href: "/forgotten-password", target: "_blank", innerText: "J'ai oublié mon mot de passe"});
                var form = createElement("form", {className: "login-form"}, [title, usernameInput, passwordInput, loginButton, info, forgotten], {submit: function(e) {e.preventDefault()}});
                return popup([form]);
            }
            function createDateElement(datetime) {
                let date = new Date(datetime);
                let m = new Intl.DateTimeFormat('fr-FR', {month:'long'}).format(date);
                return createElement("div", {className:"agenda-page"}, [
                    createElement("span", {className:"month"}, m),
                    createElement("span", {className:"day"}, date.getDate())
                ]);
            }
        </script>
    </head>
    <body>
        <div id="map">
            <!--<div id="map-container"></div>-->
            <!--<div class="map-overlay">
                <button class="add-button">
                    <span></span>
                </div>
            </div>-->
            <script>
            var events = [];
            var langCode = (navigator.language || navigator.userLanguage);
            var lang = langCode.match("[^\-]*")[0];
            text("");
            var mapLang = "name";
            
            mapboxgl.accessToken = 'pk.eyJ1IjoicHRsYyIsImEiOiJja2Qxb2tmN2Uwc2s1MndxbXk2dmdjMGNrIn0.bame3uGYhs6O4cIFUGAkhA';
            var map = new mapboxgl.Map({
                container: 'map',
                style: 'mapbox://styles/mapbox/outdoors-v11',
                center: [<?php echo explode(",", $ipInfo->loc)[1] ?>, <?php echo explode(",", $ipInfo->loc)[0] ?>],
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
                
                sendRequest("GET", "get").then(function(response) {
                    events = JSON.parse(response);
                    map.addSource("events", {type:"geojson", data:{type:'FeatureCollection',features:events.map(e=>{return {type:"Feature", "geometry":{type:"Point", coordinates: e.coords}, properties:{eventId:e.id}}})}});
                    map.addLayer({
                        'id': 'events',
                        'type': 'symbol',
                        'source': 'events',
                        'layout': {'icon-image': 'dot', 'icon-size': 1, 'icon-allow-overlap': true}
                    });
                });
                console.info("[events] Querying events");
                
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
                
                mapLang = ["ar", "en", "es", "fr", "de", "it", "pt", "ru", "ja", "ko", "vi"].includes(lang) ? "name_"+lang : lang=="zh" ? "name_zh-Hans" : "name";
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
            </script>
        </div>
        
        <div id="fav">
            <span class="title">Vos événements intéressants</span>
            <div id="agenda">
                <div class="agenda-event">
                    <div class="agenda-page">
                        <span class="month">Août</span>
                        <span class="day">30</span>
                    </div>
                    <div class="infos">
                        <span class="title">Marché</span>
                        <span class="desc">Description pillum papapum deralum doulum radus secatum los plantas.</span>
                    </div>
                </div>
            </div>
            <script>
            function setFavorites(favorites) {
                var favoritesHTML = "";
                if (favorites.length == 0) {
                    favoritesHTML = '<div class="nothing-now">Aucun évent favori ? Ajoute-en !<button onclick="setPanel(`search`)">Rechercher</button>';
                }
                for (let fav of favorites) {
                    let date = new Date(fav.datetime);
                    let m = new Intl.DateTimeFormat('fr-FR', {month:'long'}).format(date);
                    favoritesHTML += '<div class="agenda-event"><div class="agenda-page"><span class="month">'+m+'</span><span class="day">'+date.getDate()+'</span></div>'
                     + '<div class="infos"><span class="title">'+fav.title+'</span><span class="desc">'+fav.description+'</span></div></div>'
                }
                document.getElementById("agenda").innerHTML = favoritesHTML;
            }
            function refreshFavorites() {
                sendRequest("GET", "get?favorites").then(function(response) {
                    if (response == "not logged") {
                        document.getElementById("agenda").innerHTML = '<div class="not-logged">Connecte-toi pour enregistrer des évents !<button onclick="popupLogin().then(refreshFavorites)">Se connecter</button>';
                    } else {
                        setFavorites(JSON.parse(response));
                    }
                });
                console.info("[events] Querying favs");
            }
            refreshFavorites();
            </script>
        </div>
        
        <div id="orga">
            <div id="my-events"></div>
            <script>
                window.addEventListener("load", function() {
                    refreshOrga();
                });
                function refreshOrga() {
                    sendRequest("GET", "get?mine").then(function(r) {
                        var myEventsDiv = document.getElementById("my-events");
                        if (r == "not logged") {
                            myEventsDiv.innerHTML = "";
                            myEventsDiv.appendChild(createElement("div", {className:"not-logged"}, ["Connecte-toi pour créer des évents !", createElement("button", {}, "Se connecter", {click:function(){popupLogin().then(refreshOrga)}})]));
                        } else {
                            myEventsDiv.innerHTML = "";
                            var results = JSON.parse(r);
                            for (let result of results) {
                                myEventsDiv.appendChild(createElement("div", {}, [
                                    createElement("div", {className: "preview"}),
                                    createElement("div", {className: "infos"}, [
                                        createElement("span", {className:"title"}, result.title),
                                        createElement("span", {className:"description"}, result.description),
                                        createElement("span", {className:"categories"}, getDisplayCategories(result.categories).join(", ")),
                                        createElement("span", {className:"whenwhere"}, '<b>'+getDisplayDate(result.datetime)+'</b> à <b>'+result.coords+'</b>'),
                                        createElement("button", {className:"infos-button"}, "Plus d'infos", {click:function(){popupEvent(result)}})
                                    ])
                                ]));
                            }
                            if (results.length == 0) {
                                myEventsDiv.appendChild(createElement("div", {className:"no-results"}, [
                                    "Aucun évent créé ?",
                                    createElement("button", {}, text("organizeit"), {click:function(){popupCreateEvent()}})
                                ]));
                            }
                        }
                    });
                }
                function popupCreateEvent() {
                    let banner = createElement("div", {className: "banner"});
                    banner.style.backgroundImage = "url('https://les-seminaires.eu/wp-content/uploads/2019/04/organisation-evenement-entreprise-735x400.png')";
                    var t = Date.now();
                    let body = createElement("div", {className: "body"}, [
                        createElement("span", {className:"title", id:"edit-title"+t}, "Nom de l'évent (clique pour éditer)"),
                        createElement("div", {className:"categories"}, /*getDisplayCategories(event.categories).map(e=>createElement("span", {}, e))*/[createElement("span", {}, "🛠 Création")]),
                        createElement("div", {className:"description", id:"edit-description"+t}, "😊 Décris ici ton évent\n✋ Pour qui ?\n👔 Quel costume porter ?\n🛍 Que ramener ?"),
                        createElement("div", {className:"sidebar"}, [
                            createDateElement(new Date().toGMTString()),
                            createElement("button", {className:"add-fav"}, "⭐ Ajouter à mes favoris"),
                            createElement("button", {className:"large-share-button"}, "Partager")
                        ]),
                        createElement("div", {className:"footer"}, "Ça sera chouette, non ?! 🦉")
                    ]);
                    var promise = popup([banner, body]);
                    tinymce.init({
                        selector:"#edit-title"+t, menubar: false, inline: true, toolbar: false,
                        plugins: [ 'quickbars' ], quickbars_insert_toolbar: 'undo redo', quickbars_selection_toolbar: ''
                    });
                    tinymce.init({
                        selector:"#edit-description"+t, menubar: false, inline: true, toolbar: false,
                        plugins: [ 'quickbars', 'autolink', 'help', 'link', 'lists', 'emoticons' ], quickbars_insert_toolbar: 'numlist bullist | formatselect ',
                        quickbars_selection_toolbar: 'bold italic underline strikethrough | subscript superscript| blockquote quicklink',
                        contextmenu: 'undo redo | copy paste selectall | emoticons',
                    });
                    return promise;
                }
            </script>
        </div>
        
        <div id="search">
            <div style="height: 1px;"></div>            
            <div class="searchbar">
                <img src="search-icon.svg">
                <input type="text" id="searchtext" onkeypress="search()" onpaste="search()" oninput="search()">
            </div>
            <div>
                <select class="dateselect" id="searchdate" onchange="search()">
                    <option value="alldate">Toute période</option><option value="today">Aujourd'hui</option>
                    <option value="tomorrow">Demain</option>
                    <option value="week">Cette semaine</option>
                    <option value="nextweek">La semaine prochaine</option>
                    <option value="month">Ce mois-ci</option>
                </select>
                <select class="timeselect" id="searchtime" onchange="search()">
                    <option value="alltime">N'importe quand</option><option value="now">Maintenant</option>
                    <option value="morning">Le matin</option>
                    <option value="afternoon">L'après-midi</option>
                    <option value="evening">En soirée</option>
                    <option value="night">La nuit</option>
                </select>
                <div class="catselect" id="searchcat" onchange="search()">
                    <!--<option>Catégorie<span>❌</span></option>-->
                    <span class="add">➕ Catégories</span>
                    <div class="menu">
                        <hr />
                        <option value="party">🎉 Fête</option>
                        <option value="arts">🎨 Arts</option>
                        <option value="theater">🎭 Théâtre</option>
                        <option value="music">🎶 Musique</option>
                        <option value="online">💻 En ligne</option>
                        <option value="children">👧‍👦 Pour les enfants</option>
                        <option value="shopping">🛍 Shopping</option>
                        <option value="cinema">🎬 Cinéma</option>
                        <option value="food">🍽 Manger</option>
                        <option value="wellbeing">😌 Bien-être</option>
                        <option value="show">🎟 Spectacle</option>
                        <option value="sport">🎾 Sport</option>
                        <option value="literature">📚 Littérature</option>
                        <option value="drink">🍹 Boisson</option>
                        <option value="gardening">🌱 Jardinage</option>
                        <option value="cause">🎗 Cause</option>
                        <option value="craft">📐 Artisanat</option>
                    </div>
                </div>
            </div>
            <div id="results"></div>
            <script>
                window.addEventListener('load', function () {
                    search();
                    for (let catselect of document.getElementsByClassName("catselect")) {
                        catselect.value = [];
                        (catselect.getElementsByClassName("add")[0] || catselect).addEventListener('click', function () {
                            for (let menu of catselect.getElementsByClassName("menu")) menu.style.display = '';
                        });
                        for (let menu of catselect.getElementsByClassName("menu")) {
                            menu.style.display = 'none';
                            for (let option of menu.getElementsByTagName("option")) {
                                option.addEventListener('click', function () {
                                    catselect.value.push(option.value);
                                    option.style.display = 'none';
                                    let selectedOption = document.createElement('option');
                                    selectedOption.appendChild(document.createTextNode(option.innerText));
                                    //let deleteButton = document.createElement("span");
                                    //deleteButton.innerText = "❌";
                                    selectedOption.addEventListener('click', function () {
                                        catselect.value.splice(catselect.value.indexOf(selectedOption.value), 1);
                                        for (let o of menu.children)
                                            if (o.value == selectedOption.value) o.style.display = '';
                                        catselect.removeChild(selectedOption);
                                        if (catselect.dispatchEvent) catselect.dispatchEvent(new InputEvent("change", {inputType:"catselect",data:catselect.value}))
                                    });
                                    //selectedOption.appendChild(deleteButton);
                                    selectedOption.value = option.value;
                                    catselect.insertBefore(selectedOption, catselect.firstChild);
                                    menu.style.display = 'none';
                                    if (catselect.dispatchEvent) catselect.dispatchEvent(new InputEvent("change", {inputType:"catselect",data:catselect.value}))
                                });
                            }
                        }
                    }
                });
                window.addEventListener("click", (e)=>{
                    for (let catselect of document.getElementsByClassName("catselect"))
                        if (!e.path.includes(catselect))
                            for (let menu of catselect.getElementsByClassName("menu")) menu.style.display = "none";
                });
                var lastSearchTime = 0;
                function search() {
                    let t = ++lastSearchTime;
                    setTimeout(function() {
                        if (t != lastSearchTime) return;
                        let text = document.getElementById("searchtext").value;
                        let date = document.getElementById("searchdate").value;
                        let time = document.getElementById("searchtime").value;
                        let cats = document.getElementById("searchcat").value;
                        sendRequest("GET", `get?text=${text}&date=${date}&time=${time}&timezoneoffset=${new Date().getTimezoneOffset()}&`+cats.map((e,i)=>"cat"+i+"="+e).join("&")).then(function(r) {
                            events = JSON.parse(r);
                            displayResults(events);
                        });
                        console.info("[events] Searching events");
                    }, 500);
                }
                function displayResults(results) {
                    var resultsDiv = document.getElementById("results");
                    resultsDiv.innerHTML = "";
                    for (let result of results) {
                        let r = document.createElement("div");
                        resultsDiv.appendChild(r);
                        let p = document.createElement("div"), i = document.createElement("div");
                        r.appendChild(p);
                        r.appendChild(i);
                        p.className = "preview";
                        i.className = "infos";
                        i.innerHTML = '<span class="title">'+result.title+'</span>'
                            + '\n<span class="description">'+result.description+'</span>'
                            + '\n<span class="categories">'+getDisplayCategories(result.categories).join(", ")+'</span>'
                            + '\n<span class="whenwhere"><b>'+getDisplayDate(result.datetime)+'</b> à <b>'+result.coords+'</b></span>'
                            + '\n<button class="infos-button">Plus d\'infos</button>';
                        i.getElementsByClassName("infos-button")[0].addEventListener("click", (e) => popupEvent(result));
                        sendRequest("GET", `https://api.mapbox.com/geocoding/v5/mapbox.places/${result.coords[0]},${result.coords[1]}.json?access_token=${mapboxgl.accessToken}&language=${langCode}`, "").then(function(r) {
                            r = JSON.parse(r);
                            let ww = i.getElementsByClassName("whenwhere")[0];
                            ww.innerHTML = ww.innerHTML.replace(result.coords[0]+","+result.coords[1], r.features.length>3 ? r.features[r.features.length-3].place_name
                                : r.features.length>0 ? r.features[0].place_name
                                : Math.abs(parseInt(result.coords[1]))+"°"+parseInt(Math.abs(result.coords[1]%1)*60)+"'"+Math.abs(result.coords[1]%1*60%1*60).toFixed(2)+'"'+(result.coords[1]>=0?"N":"S")+" "
                                 +Math.abs(parseInt(result.coords[0]))+"°"+parseInt(Math.abs(result.coords[0]%1)*60)+"'"+Math.abs(result.coords[0]%1*60%1*60).toFixed(2)+'"'+(result.coords[0]>=0?"E":"O"));
                        });
                    }
                    if (results.length == 0) {
                        var noResultsDiv = document.createElement("div");
                        noResultsDiv.className = "no-results";
                        noResultsDiv.innerText = "Tu ne trouves pas l'évent de tes rêves ?";
                        var createButton = document.createElement("button");
                        createButton.innerText = text("organizeit");
                        createButton.addEventListener("click", function() {
                            setPanel("orga");
                        });
                        noResultsDiv.appendChild(createButton);
                        resultsDiv.appendChild(noResultsDiv);
                    }
                }
            </script>
        </div>
        
        
        <div id="agnd">
            <!-- TODO -->
        </div>
        
        
        <div id="menu">
            <button id="menu-orga" title="Vos évents"><span></span></button>
            <button id="menu-search" title="Rechercher"><span></span></button>
            <button id="menu-map" title="Carte des évents"><span></span></button>
            <button id="menu-fav" title="Évents favoris"><span></span></button>
            <button id="menu-agnd" title="Agenda"><span></span></button>
        </div>
        <script>
            window.addEventListener('load', function () {
                let panels = [
                    {id:"map", title:"🗺 Carte des évents"},
                    {id:"fav", title:"⭐ Évents favoris"},
                    {id:"orga", title:"🎆 Organiser un évent"},
                    {id:"search", title:"🔍 Recherche d'évent"},
                    {id:"agnd", title:"📔 Ton agenda d'évents"}
                ];
                onHashChange = function() {
                    let panelId = window.location.hash.replace("#", "").match(/[a-z0-9]*/i)[0];
                    if (!panels.map(p=>p.id).includes(panelId)) panelId = panels[0].id;
                    console.info("[panels] Switching to " + panelId);
                    for (let panel of panels) {
                        document.getElementById(panel.id).style.display = panel.id==panelId ? "" : "none";
                        if (panel.id==panelId) document.title = panel.title;
                    }
                };
                onHashChange();
                let posterId = window.location.hash.match(/@[a-z0-9]*/i) ? window.location.hash.match(/@[a-z0-9]*/i)[0].replace("@", "") : undefined;
                if (posterId) {
                    queryEvent(posterId).then(popupEvent);
                }
                setPanel = function(panelId) {
                    window.location.hash = panelId;
                };
                setPoster = function(posterId) {
                    if (window.location.hash.match(/@[a-z0-9]*/i)) {
                        window.location.hash = window.location.hash.replace(/@[a-z0-9]*/i, "@"+posterId);
                    } else {
                        window.location.hash += "@"+posterId;
                    }
                };
                unsetPoster = function() {
                    window.location.hash = window.location.hash.replaceAll(/@[a-z0-9]*/gi, "");
                }
                window.addEventListener("hashchange", onHashChange);
                document.getElementById("menu-map").addEventListener('click', function () {setPanel("");});
                document.getElementById("menu-fav").addEventListener('click', function () {setPanel("fav");});
                document.getElementById("menu-orga").addEventListener('click', function () {setPanel("orga");});
                document.getElementById("menu-search").addEventListener('click', function () {setPanel("search");});
                document.getElementById("menu-agnd").addEventListener('click', function () {setPanel("agnd");});
            });
        </script>
    </body>
</html>