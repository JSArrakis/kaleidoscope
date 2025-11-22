"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Tag = void 0;
const tagTypes_1 = require("./const/tagTypes.cjs");
class Tag {
    constructor(tagId, name, type, holidayDates, exclusionTags, seasonStartDate, seasonEndDate, explicitlyHoliday, sequence) {
        this.tagId = tagId;
        this.name = name;
        this.type = type;
        this.holidayDates = holidayDates;
        this.exclusionTags = exclusionTags;
        this.seasonStartDate = seasonStartDate;
        this.seasonEndDate = seasonEndDate;
        this.explicitlyHoliday = explicitlyHoliday;
        this.sequence = sequence;
    }
    static fromRequestObject(requestObject) {
        return new Tag(requestObject.tagId, requestObject.name, requestObject.type, requestObject.holidayDates, requestObject.exclusionTags, requestObject.seasonStartDate, requestObject.seasonEndDate, requestObject.explicitlyHoliday, requestObject.sequence);
    }
    // Helper methods to check tag type
    isHoliday() {
        return this.type === tagTypes_1.TagType.Holiday;
    }
    isAgeGroup() {
        return this.type === tagTypes_1.TagType.AgeGroup;
    }
    isRegularTag() {
        return [
            tagTypes_1.TagType.Aesthetic,
            tagTypes_1.TagType.Era,
            tagTypes_1.TagType.Genre,
            tagTypes_1.TagType.Specialty,
        ].includes(this.type);
    }
    // Helper method for holiday content restrictions
    isExplicitlyHoliday() {
        return this.explicitlyHoliday === true;
    }
    // Helper method to check if content can play outside holiday periods
    canPlayAnytime() {
        return !this.isExplicitlyHoliday();
    }
}
exports.Tag = Tag;
