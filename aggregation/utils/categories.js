// How to detect categories from brut event

// https://gitlab.adullact.net/adntourisme/datatourisme/ontology/-/blob/master/thesaurus/thesaurus.ttl

/**
 * @type {Record<string, Array<string>>}
 */
const categoriesKeywords = {
    "party": ["party", "fête"],
    "arts": [" art[s ]", "artist", "artsandcraft", "visualart"],
    "theater": ["th[ée][âa]te?r", "com[ée]dien"],
    "music": ["musique", "music", "concert"],
    //"online": ["en ligne","online"],
    "children": ["enfants", "tout public", "en famille", "children", "in family", "all age", "accessible à tous"],
    "exhibition": ["exposition", "expo"],
    "shopping": ["shopping"],
    "cinema": ["cin[ée]ma", "film"],
    "food": ["nourriture", "alimentair", "food", "restaura", "gastronom(ie|y)", "cuisine", "food", "eat", "manger", "d[é|e]gust"],
    "wellbeing": ["bien[- ]?[êe]tre", "well[- ]?being", "relaxation", "yoga", "m[ée]ditation"],
    "show": ["show", "spectacle", "sc[èe]ne"],
    "sport": ["sport", "athl[ée]ti", "(basket|base|foot|volley|hand)ball", "soccer", "rugby", "tennis", "golf", "gym", "hockey", "judo", "karate", "karaté", "natation", "swim", "ski", "vtt", "roller", "kayak"],
    "literature": ["litt[ée]rature", "litt[ée]raire", " livre", " book", "lecture", " read", "[ée]crire", "[ée]crivain", " bd "],
    "drink": ["boire", "boisson", "drink", "alcool", "alcohol", "bière", "beer", " vin ", " vins ", "wine", "cocktail", "aperitif", "apéritif", "buvette", "café"],
    "gardening": ["jardin[eoa]", "gardenning", "plant", "flower", "fleur"],
    "cause": ["cause", "b[ée]n[ée]vol", "volontai?r", "volunteer", "charit[éey]", "(^| )dons?( |$)", "donation", "solidarit[éy]", " ngo ", "non-profit"],
    "craft": ["craft", "artisan", "hand[- ]?made", "manufactur"],
    "dance": [" dan[cs]e", "dancing", "danceevent"],
    "festival": ["festival"],
    "garden": ["jardin ", "jardins ", "par[ck]s? ", "garden"],
    "holiday": ["holiday", "vacance", "vacation"],
    "market": ["market", "marché", "marchand"],
    "museum": ["museum", "mus[ée]e", "patrimoine"],
    "outdoor": ["outdoor", "ext[ée]rieur", "dehors"],
    "parade": ["parade", "d[ée]fil[ée]"],
    "religion": ["religious", "religieu", "religion", "spiritual", "catholi(que|c)", "musulman", "muslim", "juif", "jewish", "chr[ée]tien", "christian", "[ée]glise", "church", "mosqu[ée]e?", "synagogue", "temple"],
    "science": ["science", "scientifique", "scientist", "physi(que|c)", " math", "informati(que|c)", "computer", "technolog(ie|y)", " astronom(ie|y)", "biolog(ie|y)", "chimie", "chemistry", "[ée]conom(ie|y)", "géolog(ie|y)", "m[ée]decine", "psycholog(ie|y)", "santé", "health", "sociolog(ie|y)", "zoolog(ie|y)"],
    "seminar": ["seminar", "s[ée]minaire", " conf[ée]rence"],
    "tour": ["tour", "visite"],
    "workshop": ["workshop", "atelier"],
    "free": ["free entrance", "gratuit", "entr[ée] libre"],
    "fashion": ["fashion", "la mode", "v[êèe]tement"],
    "fair": ["fair", "foire"],
    "videogame": ["gaming", "jeux? vid", "video game", "playstation", "xbox", "nintendo"],
    "boardgame": ["boardgame", "jeux? de (soci[ée]t[ée]|plateau|cartes|r[ôo]le)", "tarot", "belote"],
};

/**
 * Find corresponding categories id based on texts
 * @param {...string|undefined?} texts
 * @returns {Array<string>}
 */
export function findCategories(...texts) {
    const filteredTexts = texts
        .filter(t => t != null)
        .map(t => t.toLowerCase());
    return Object.entries(categoriesKeywords)
        .filter(([_category, keywords]) =>
            keywords.some(keyword =>
                filteredTexts.some(text => text.match(new RegExp(keyword)))
            )
        ).map(([category]) => category);
}
