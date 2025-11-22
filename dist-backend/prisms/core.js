"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tagNamesFrom = tagNamesFrom;
exports.getTagName = getTagName;
exports.sumMediaDuration = sumMediaDuration;
// Helper function to convert string array to Tag array
function tagNamesFrom(tags) {
    if (tags.length === 0)
        return [];
    // Check if it's Tag[] by checking if first element has name property
    if ('name' in tags[0] && typeof tags[0].name === 'string') {
        return tags.map(t => t.name);
    }
    return tags
        .map(t => (typeof t === 'string' ? t : t === null || t === void 0 ? void 0 : t.name))
        .filter(Boolean);
}
function getTagName(tag) {
    if (tag === null || tag === undefined)
        return undefined;
    if (typeof tag === 'string')
        return tag;
    return tag.name;
}
function sumMediaDuration(media) {
    return media.reduce((acc, val) => acc + val.duration, 0);
}
