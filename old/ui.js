// Objet pour retourner les textes en fonction de la langue
const Texts = function () {
    var availableLangs = ["fr", "en"];
    var texts = [];
    var lang;
    return {
        get(id) {
            return texts[lang][id] ?? "[" + id + "]";
        },
        getLang() {
            return lang;
        },
        async setLang(newLang) {
            if (!availableLangs.includes(newLang))
                throw newLang + " is not an available language";
            lang = newLang;
            if (!texts[lang]) {
                texts[lang] = {};
                return sendRequest("GET", "langs/" + lang + ".json").then(function (response) {
                    texts[lang] = JSON.parse(response);
                }).then(() => console.info("[Texts] Lang loaded: " + lang));
            }
        },
        getAvailableLangs() {
            return availableLangs;
        },
        update(root) {
            if (root.hasAttribute(":text") || root[":text"])
                root.innerText = this.get(root.getAttribute(":text") || root[":text"]);
            else
                for (let child of root.children)
                    this.update(child);
        }
    };
}();

// Utiliser la langue du navigateur si possible
Texts.setLang((navigator.language || navigator.userLanguage || "").match("[^\-]*")[0])
    .then(() => Texts.update(document.body));

// Fonction pour afficher une popup
function popup(content = []) {
    return new (Promise || ES6Promise)(function (resolve, reject) {
        let container;
        document.body.appendChild(container = createElement("div", { className: "popup-container" }, [
            createElement("div", { className: "popup" }, [
                createElement("img", { className: "close", src: "assets/cross.svg" }, [], {
                    click: () => { container.parentElement.removeChild(container); resolve(); }
                })
            ].concat(content), { click: e => e.stopPropagation() })
        ], {
            click: () => { container.parentElement.removeChild(container); resolve(); }
        }));
    });
}

// Afficher un événement
function popupEvent(event) {
    setPoster(event.id);
    let image = event.image ?? "https://les-seminaires.eu/wp-content/uploads/2019/04/organisation-evenement-entreprise-735x400.png";
    let banner = createElement("div", { className: "banner", style: { backgroundImage: "url('" + image + "')" } });
    let share = navigator.share
        ? createElement("button", { className: "large-share-button" }, "Partager", {
            click: function () {
                navigator.share({ title: event.title, text: 'Regarde cet évent, il a l\'air intéressant !', url: document.URL })
            }
        })
        : createElement("div", { className: "share-buttons" }, [
            createElement("a", { className: "tb-share-button", target: "_blank", href: `https://www.tumblr.com/share/link?url=${encodeURIComponent(document.URL)}&title=${encodeURIComponent(event.title)}` }),
            createElement("a", { className: "em-share-button", target: "_blank", href: `mailto:?Subject=${encodeURIComponent(event.title)}&Body=${encodeURIComponent("Regarde cet évent, il a l'air intéréssant : " + document.URL)}` }),
            createElement("a", { className: "fb-share-button", target: "_blank", href: `https://www.facebook.com/sharer.php?u=${encodeURIComponent(document.URL)}` }),
            createElement("a", { className: "tw-share-button", target: "_blank", href: `https://twitter.com/share?url=${encodeURIComponent(document.URL)}&text=${encodeURIComponent(event.title)}&hashtags=events` }),
            createElement("a", { className: "wa-share-button", target: "_blank", href: `https://api.whatsapp.com/send?text=${encodeURIComponent(event.title + " : " + document.URL)}` }),
            createElement("a", { className: "mg-share-button", target: "_blank", href: `fb-messenger://share/?link=${encodeURIComponent(document.URL)}` }),
            createElement("a", { className: "tg-share-button", target: "_blank", href: `https://t.me/share/url?url=${encodeURIComponent(document.URL)}&text=${encodeURIComponent(event.title)}` }),
            createElement("button", { className: "copy-button" }, [], {
                click: function () {
                    var tmp = createElement("input", { value: window.location.href });
                    document.body.appendChild(tmp);
                    tmp.select();
                    document.execCommand("copy");
                    tmp.parentElement.removeChild(tmp);
                    this.innerText = Texts.get('copied');
                    setTimeout(() => this.innerText = "", 2000);
                }
            })
        ]);
    let body = createElement("div", { className: "body" }, [
        createElement("span", { className: "title" }, event.title),
        createElement("div", { className: "categories" }, event.categories.map(c => createElement("span", {}, Texts.get(c)))),
        createElement("div", { className: "description" }, event.description),
        createElement("div", { className: "sidebar" }, [
            createDateElement(event.datetime),
            createElement("button", { className: "add-fav" }, "⭐ Ajouter à mes favoris", {
                click: function () {
                    // TODO !
                }
            }),
            share
        ]),
        createElement("div", { className: "footer" }, "Ça a l'air chouette, non ?! 🦉")
    ]);
    return popup([banner, body]).then(unsetPoster);
}

// Affiche un popup de connexion
function popupLogin() {
    let title = createElement("span", { className: "title" }, "Connexion");
    let usernameInput = createElement("input", { placeholder: "Nom d'utilisateur", autofocus: true });
    let passwordInput = createElement("input", { placeholder: "Mot de passe", type: "password" });
    var loginButton = createElement("button", {}, "Se connecter", {
        click: function () {
            sendRequest("POST", "/login", "username=" + encodeURIComponent(usernameInput.value) + "&password=" + encodeURIComponent(passwordInput.value)).then(function (r) {
                if (r == "invalid") {
                    info.innerText = "Nom d'utilisatuer ou mot de passe invalide :/";
                    forgotten.style.display = "";
                } else if (r == "logged in") {
                    loginButton.parentElement.parentElement.parentElement.click();
                }
            });
        }
    });
    var info = createElement("span");
    var forgotten = createElement("a", { href: "/forgotten-password", target: "_blank", innerText: "J'ai oublié mon mot de passe" });
    var form = createElement("form", { className: "login-form" }, [title, usernameInput, passwordInput, loginButton, info, forgotten], { submit: function (e) { e.preventDefault() } });
    return popup([form]);
}

// Crée un élément HTML représentant une date
function createDateElement(datetime) {
    let date = new Date(datetime);
    let m = new Intl.DateTimeFormat('fr-FR', { month: 'long' }).format(date);
    return createElement("div", { className: "agenda-page" }, [
        createElement("span", { className: "month" }, m),
        createElement("span", { className: "day" }, date.getDate())
    ]);
}

// Retourne la date sous forme de texte
function getDisplayDate(datetime) {
    var datetime = new Date(datetime);
    var date = new Date(datetime);
    date.setHours(0, 0, 0, 0);
    var today = new Date();
    today.setHours(0, 0, 0, 0);

    if (date.getTime() == today.getTime() - 86400000) return Texts.get("yesterday");
    if (date.getTime() < today.getTime()) return Texts.get("past");
    if (date.getTime() == today.getTime()) return Texts.get("today");
    if (date.getTime() == today.getTime() + 86400000) return Texts.get("tomorrow");
    if (date.getTime() < today.getTime() + 6 * 86400000) return Texts.get("weekdays")[date.getDay()] + Texts.get("next");
    return Texts.get("thedate") + date.getDate() + " " + Texts.get("months")[date.getMonth()] + (date.getYear() == today.getYear() ? "" : " " + date.getYear())
}

// Crée un joli selecteur multiple
function createCatSelect(catselect, options = {}) {
    catselect.classList.add("catselect");
    catselect.value = [];
    (catselect.getElementsByClassName("add")[0] || catselect).addEventListener('click', function () {
        for (let menu of catselect.getElementsByClassName("menu")) menu.style.display = '';
    });
    if (catselect.getElementsByClassName("menu").length == 0)
        catselect.appendChild(createElement("div", { className: "menu" }, [createElement("hr")]));
    for (let menu of catselect.getElementsByClassName("menu")) {
        for (let value in options)
            menu.appendChild(createElement("option", { value, ":text": options[value] }, value));
        menu.style.display = 'none';
        for (let option of menu.getElementsByTagName("option")) {
            option.addEventListener('click', function () {
                catselect.value.push(option.value);
                option.style.display = 'none';
                let selectedOption = createElement('option', {}, option.innerText);
                //let deleteButton = createElement("span", {}, "❌");
                selectedOption.addEventListener('click', function () {
                    catselect.value.splice(catselect.value.indexOf(selectedOption.value), 1);
                    for (let o of menu.children)
                        if (o.value == selectedOption.value) o.style.display = '';
                    catselect.removeChild(selectedOption);
                    if (catselect.dispatchEvent) catselect.dispatchEvent(new InputEvent("change", { inputType: "catselect", data: catselect.value }))
                });
                //selectedOption.appendChild(deleteButton);
                selectedOption.value = option.value;
                catselect.insertBefore(selectedOption, catselect.firstChild);
                menu.style.display = 'none';
                if (catselect.dispatchEvent) catselect.dispatchEvent(new InputEvent("change", { inputType: "catselect", data: catselect.value }))
            });
        }
    }
}
window.addEventListener("click", event => {
    var catselects = [...document.getElementsByClassName("catselect")];
    for (let target = event.target; target.parentElement; target = target.parentElement)
        if (catselects.includes(target)) catselects.splice(catselects.indexOf(target), 1);
    for (let catselect of catselects)
        for (let menu of catselect.getElementsByClassName("menu")) menu.style.display = "none";
});
