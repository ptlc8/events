const bannedWords = [
    "retour affectif",
    "lorem ipsum dolor sit amet"
];

export function isSafe(...texts) {
    texts = texts
        .filter(t => t != null)
        .map(t => t.toLowerCase());
    return texts.every(text =>
        bannedWords.every(banned => !text.includes(banned))
    );
}