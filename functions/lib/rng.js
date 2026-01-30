"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.randomSeedString = randomSeedString;
exports.hashToSeed = hashToSeed;
exports.rngFromSeed = rngFromSeed;
exports.pickOne = pickOne;
exports.pickUnique = pickUnique;
exports.chance = chance;
const seedrandom_1 = __importDefault(require("seedrandom"));
const crypto_1 = __importDefault(require("crypto"));
function randomSeedString(bytes = 16) {
    return crypto_1.default.randomBytes(bytes).toString("hex");
}
function hashToSeed(input) {
    return crypto_1.default.createHash("sha256").update(input).digest("hex");
}
function rngFromSeed(seed) {
    const rng = (0, seedrandom_1.default)(seed);
    return () => rng();
}
function pickOne(rng, items) {
    if (items.length === 0)
        throw new Error("pickOne: empty array");
    const idx = Math.floor(rng() * items.length);
    return items[Math.min(idx, items.length - 1)];
}
function pickUnique(rng, items, count) {
    if (count <= 0)
        return [];
    if (count >= items.length)
        return [...items];
    const copy = [...items];
    const out = [];
    for (let i = 0; i < count; i++) {
        const idx = Math.floor(rng() * copy.length);
        out.push(copy.splice(idx, 1)[0]);
    }
    return out;
}
function chance(rng, p) {
    return rng() < p;
}
