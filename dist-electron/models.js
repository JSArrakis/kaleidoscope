/**
 * Runtime enum definitions for the Electron main process.
 * These mirror the ambient declarations in types.d.ts and must be imported
 * in any Electron file that references these enum values at runtime.
 */
export var MediaType;
(function (MediaType) {
    MediaType["Show"] = "Show";
    MediaType["Episode"] = "Episode";
    MediaType["Movie"] = "Movie";
    MediaType["Short"] = "Short";
    MediaType["Music"] = "Music";
    MediaType["Commercial"] = "Commercial";
    MediaType["Promo"] = "Promo";
    MediaType["Bumper"] = "Bumper";
})(MediaType || (MediaType = {}));
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
export var StreamType;
(function (StreamType) {
    StreamType["Cont"] = "Cont";
    StreamType["Adhoc"] = "Adhoc";
})(StreamType || (StreamType = {}));
