const bannedWords = [
    "retour affectif",
    "lorem ipsum dolor sit amet"
];

/**
 * Check if the given texts are safe (do not contain banned words)
 * @param  {...string|undefined?} texts 
 * @returns {boolean}
 */
export function isSafe(...texts) {
    const filteredTexts = texts
        .filter(t => t != null)
        .map(t => t.toLowerCase());
    return filteredTexts.every(text =>
        bannedWords.every(banned => !text.includes(banned))
    );
}