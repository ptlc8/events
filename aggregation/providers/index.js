export default [
    new (await import("./datatourisme.js")).default(),
    new (await import("./montreal.js")).default(),
    new (await import("./openagenda.js")).default(),
];