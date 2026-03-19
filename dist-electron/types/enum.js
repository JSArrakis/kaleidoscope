/**
 * Media Type Enum - Represents different types of media content
 */
export var MediaType;
(function (MediaType) {
    MediaType["Show"] = "Show";
    MediaType["Movie"] = "Movie";
    MediaType["Short"] = "Short";
    MediaType["Music"] = "Music";
    MediaType["Promo"] = "Promo";
    MediaType["Commercial"] = "Commercial";
    MediaType["Block"] = "Block";
    MediaType["Episode"] = "Episode";
    MediaType["Bumper"] = "Bumper";
})(MediaType || (MediaType = {}));
/**
 * Tag Type Enum - Represents different categories of tags
 */
export var TagType;
(function (TagType) {
    TagType["Aesthetic"] = "Aesthetic";
    TagType["Era"] = "Era";
    TagType["Genre"] = "Genre";
    TagType["Specialty"] = "Specialty";
    TagType["Holiday"] = "Holiday";
    TagType["AgeGroup"] = "AgeGroup";
    TagType["MusicalGenre"] = "MusicalGenre";
})(TagType || (TagType = {}));
export const TAG_TYPES = Object.values(TagType);
export function isValidTagType(value) {
    return Object.values(TagType).includes(value);
}
/**
 * Stream Type Enum - Represents different types of streaming strategies
 */
export var StreamType;
(function (StreamType) {
    StreamType["Cont"] = "Cont";
    StreamType["Block"] = "Block";
    StreamType["Adhoc"] = "Adhoc";
})(StreamType || (StreamType = {}));
