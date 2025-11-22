"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TAG_TYPES = exports.TagType = void 0;
exports.isValidTagType = isValidTagType;
// Enum for better readability and type safety
var TagType;
(function (TagType) {
    TagType["Aesthetic"] = "Aesthetic";
    TagType["Era"] = "Era";
    TagType["Genre"] = "Genre";
    TagType["Specialty"] = "Specialty";
    TagType["Holiday"] = "Holiday";
    TagType["AgeGroup"] = "AgeGroup";
    TagType["MusicalGenre"] = "MusicalGenre";
})(TagType || (exports.TagType = TagType = {}));
// Array of all tag types (for iteration, validation, etc.)
exports.TAG_TYPES = Object.values(TagType);
// Type guard function that validates against the enum
function isValidTagType(value) {
    return Object.values(TagType).includes(value);
}
