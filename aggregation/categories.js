// How to detect categories from brut event

// https://gitlab.adullact.net/adntourisme/datatourisme/ontology/-/blob/master/thesaurus/thesaurus.ttl

/**
 * @type {Map<string, Array<string>>}
 */
const categoriesKeywords = {
    "party": ["party", "fête"],
    "arts": [" arts", "artist", " art ", "artsandcraft", "visualart"],
    "theater": ["théâtr", "theater", "théatr", "comédien"],
    "music": ["musique", "music", "concert"],
    //"online": ["en ligne","online"],
    "children": ["enfants", "tout public", "en famille", "children", "in family", "all age", "accessible à tous"],
    "exhibition": ["exposition", "expo"],
    "shopping": ["shopping"],
    "cinema": ["cinéma", "cinema", "film"],
    "food": ["nourriture", "alimentair", "food", "restauration", "restaurant", "gastronomie", "gastronomy", "cuisine", "food", "eat", "manger", "déguster", "dégustation", "restaur"],
    "wellbeing": ["bien-être", "wellbeing", "well-being", "well being", "relaxation", "yoga", "méditation"],
    "show": ["show", "spectacle", "scène"],
    "sport": ["sport", "athléti", "athleti", "basketball", "baseball", "football", "soccer", "rugby", "tennis", "volleyball", "handball", "golf", "gym", "hockey", "judo", "karate", "karaté", "natation", "swim", "ski"],
    "literature": ["literature", "littérature", " livre", " book", "lecture", " read", "écrire", "écrivain", " bd "],
    "drink": ["boire", "boisson", "drink", "alcool", "alcohol", "bière", "beer", " vin ", " vins ", "wine", "cocktail", "aperitif", "apéritif", "buvette", "café"],
    "gardening": ["jardine", "jardino", "jardinage", "gardenning", "plant", "flower", "fleur"],
    "cause": ["cause", "bénévolat", "bénévole", "volontariat", "volontaire", "volunteer", "charité", "charity", " don", "donation", "solidarité", "solidarity", "ngo", "non-profit"],
    "craft": ["craft", "artisan", "handmade", "hand-made", "hand made", "manufacturé"],
    "dance": [" dance", "danse", "dancing", "danceevent"],
    "festival": ["festival"],
    "garden": ["jardin ", "jardins ", "parc ", "parcs ", "parks ", "garden", "park "],
    "holiday": ["holiday", "vacance", "vacation"],
    "market": ["market", "marché", "marchand"],
    "museum": ["museum", "musée"],
    "outdoor": ["outdoor", "extérieur", "exterieur", "dehors"],
    "parade": ["parade", "défilé", "defile"],
    "religion": ["religious", "religieu", "religion", "spiritual", "catholique", "catholic", "musulman", "muslim", "juif", "jewish", "chrétien", "christian", "église", "church", "mosquée", "mosque", "synagogue", "temple"],
    "science": ["science", "scientifique", "scientist", "physique", "physic", "math", "informatique", "computer", "technologie", "technology", "astronomie", "astronomy", "biologie", "biology", "chimie", "chemistry", "économie", "economy", "géologie", "geology", "médecine", "medicine", "psychologie", "psychology", "santé", "health", "sociologie", "sociology", "zoologie", "zoology"],
    "seminar": ["seminar", "séminaire", " conférence", "conference"],
    "tour": ["tour", "visite", "visite"],
    "workshop": ["workshop", "atelier", "atelier"],
    "free": ["free entrance", "gratuit"],
    "fashion": ["fashion", "la mode", "vêtement"],
    "fair": ["fair", "foire"],
    "videogame": ["gaming", "jeu vid", "jeux vid", "game", "games", "video game", "playstation", "xbox", "nintendo"],
    "boardgame": ["boardgame", "jeu de société", "jeux de société", "jeu de plateau", "jeux de plateau", "jeu de cartes", "jeux de cartes", "jeu de rôle", "tarot", "belote"],
};

/**
 * Find corresponding categories id based on texts
 * @param  {...string} texts
 * @returns {Array<string>}
 */
export function findCategories(...texts) {
    texts = texts
        .filter(t => t != null)
        .map(t => t.toLowerCase());
    return Object.entries(categoriesKeywords)
        .filter(([category, keywords]) =>
            keywords.some(keyword =>
                texts.some(text => text.includes(keyword))
            )
        ).map(([category]) => category);
}
