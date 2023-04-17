<!DOCTYPE html>
<?php
$ip = $_SERVER['REMOTE_ADDR'];
$ipInfo = json_decode(file_get_contents("http://ipinfo.io/{$ip}/json"));
$ipLoc = $ipInfo->bogon ? "48.8534100,2.3488000" : $ipInfo->loc;
?>
<html>
    <head>
        <meta charset="UTF-8" />
        <meta property="og:url" content="https://<?php echo $_SERVER['HTTP_HOST'].$_SERVER['REQUEST_URI']; ?>" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Title" /> <!--TODO-->
        <meta property="og:description" content="Description" />
        <meta property="og:image" content="https://<?php echo $_SERVER['HTTP_HOST']; ?>/events/assets/map.svg" />
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
        <!-- Local scripts -->
        <script src="utils.js"></script>
        <script src="api.js"></script>
        <script src="ui.js"></script>
        <script src="index.js"></script>
    </head>
    <body>
        <div id="map">
            <!--<div id="map-container"></div>-->
            <!--<div class="map-overlay">
                <button class="add-button">
                    <span></span>
                </div>
            </div>-->
            <script src="map.js"></script>
            <script>
                loadMap("map", [<?php echo $ipLoc ?>]);
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
                EventsApi.getEvents({favorite:true}).then(setFavorites)
                    .catch(e => {
                        setFavorites([]);
                        if (e == "not logged")
                            document.getElementById("agenda").innerHTML = '<div class="not-logged">Connecte-toi pour enregistrer des évents !<button onclick="popupLogin().then(refreshFavorites)">Se connecter</button>';
                    });
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
                    var myEventsDiv = document.getElementById("my-events");
                    EventsApi.getEvents({mine:true}).then(events => {
                        myEventsDiv.innerHTML = "";
                        for (let result of events) {
                            myEventsDiv.appendChild(createElement("div", {}, [
                                createElement("div", {className: "preview"}),
                                createElement("div", {className: "infos"}, [
                                    createElement("span", {className:"title"}, result.title),
                                    createElement("span", {className:"description"}, result.description),
                                    createElement("span", {className:"categories"}, result.categories.map(Texts.get).join(", ")),
                                    createElement("span", {className:"whenwhere"}, [
                                        createElement("b", {}, getDisplayDate(result.datetime)),
                                        " à ",
                                        createElement("b", {}, result.coords)
                                    ]),
                                    createElement("button", {className:"infos-button"}, "Plus d'infos", {click:function(){popupEvent(result)}})
                                ])
                            ]));
                        }
                        if (results.length == 0) {
                            myEventsDiv.appendChild(createElement("div", {className:"no-results"}, [
                                "Aucun évent créé ?",
                                createElement("button", {}, Texts.get("organizeit"), {click:function(){popupCreateEvent()}})
                            ]));
                        }
                    }).catch(e => {
                        myEventsDiv.innerHTML = "";
                        if (e == "not logged")
                            myEventsDiv.appendChild(createElement("div", {className:"not-logged"}, ["Connecte-toi pour créer des évents !", createElement("button", {}, "Se connecter", {click:function(){popupLogin().then(refreshOrga)}})]));
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
                <img src="assets/search-icon.svg">
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
                    <span class="add">➕ Catégories</span>
                    <script>createCatSelect(document.currentScript.parentElement, EventsApi.getCategories().reduce((acc,c) => (acc[c] = c) && acc, {}));</script>
                </div>
            </div>
            <div id="results"></div>
            <script>
                var lastSearchTime = 0;
                function search() {
                    let t = ++lastSearchTime;
                    setTimeout(function() {
                        if (t != lastSearchTime) return;
                        let text = document.getElementById("searchtext").value;
                        let date = document.getElementById("searchdate").value;
                        let time = document.getElementById("searchtime").value;
                        let cats = document.getElementById("searchcat").value;
                        EventsApi.getEvents({text, date, time, cats, timezoneoffset:new Date().getTimezoneOffset()})
                            .then(displayResults);
                    }, 500);
                }
                search();
                function displayResults(results) {
                    var resultsDiv = document.getElementById("results");
                    resultsDiv.innerHTML = "";
                    for (let result of results) {
                        let place;
                        resultsDiv.appendChild(createElement("div", {}, [
                            createElement("div", {className:"preview", style:{backgroundImage:`url('${result.image||result.images[0]}')`}}),
                            createElement("div", {className:"infos"}, [
                                createElement("span", {className:"title"}, result.title),
                                createElement("span", {className:"description"}, result.description),
                                createElement("span", {className:"categories"}, result.categories.map(Texts.get).join(", ")),
                                createElement("span", {className:"whenwhere"}, [
                                    createElement("b", {}, getDisplayDate(result.datetime)),
                                    " à ",
                                    createElement("b", {}, result.placename),
                                    " ",
                                    place = createElement("span", {}, result.coords.join(","))]),
                                createElement("button", {className:"infos-button"}, "Plus d'infos", {"click": e => popupEvent(result)})
                            ])
                        ]));
                        // TODO : put this in backend ?
                        if (window.mapboxgl) sendRequest("GET", `https://api.mapbox.com/geocoding/v5/mapbox.places/${result.coords[0]},${result.coords[1]}.json?access_token=${mapboxgl.accessToken}&language=${Texts.getLang()}`, "").then(function(r) {
                            r = JSON.parse(r);
                            place.innerText = r.features.length>3 ? r.features[r.features.length-3].place_name
                                : r.features.length>0 ? r.features[0].place_name
                                : Math.abs(parseInt(result.coords[1]))+"°"+parseInt(Math.abs(result.coords[1]%1)*60)+"'"+Math.abs(result.coords[1]%1*60%1*60).toFixed(2)+'"'+(result.coords[1]>=0?"N":"S")+" "
                                 +Math.abs(parseInt(result.coords[0]))+"°"+parseInt(Math.abs(result.coords[0]%1)*60)+"'"+Math.abs(result.coords[0]%1*60%1*60).toFixed(2)+'"'+(result.coords[0]>=0?"E":"O");
                        });
                    }
                    if (results.length == 0) {
                        resultsDiv.appendChild(createElement("div", {className:"no-results"}, [
                            Texts.get("noresults"),
                            createElement("button", {}, Texts.get("organizeit"), {click: () => setPanel("orga")})
                        ]));
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
                let posterId = window.location.hash.match(/@[a-z0-9\-]*/i) ? window.location.hash.match(/@[a-z0-9\-]*/i)[0].replace("@", "") : undefined;
                if (posterId) {
                    EventsApi.getEvent(posterId).then(popupEvent);
                }
                setPanel = function(panelId) {
                    window.location.hash = panelId;
                };
                setPoster = function(posterId) {
                    if (window.location.hash.match(/@[a-z0-9\-]*/i)) {
                        window.location.hash = window.location.hash.replace(/@[a-z0-9\-]*/i, "@"+posterId);
                    } else {
                        window.location.hash += "@"+posterId;
                    }
                };
                unsetPoster = function() {
                    window.location.hash = window.location.hash.replaceAll(/@[a-z0-9\-]*/gi, "");
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