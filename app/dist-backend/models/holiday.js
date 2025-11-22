"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Holiday = void 0;
class Holiday {
    constructor(name, tagId, holidayDates, exclusionTags, seasonStartDate, seasonEndDate) {
        this.name = name;
        this.tagId = tagId;
        this.holidayDates = holidayDates;
        this.exclusionTags = exclusionTags;
        this.seasonStartDate = seasonStartDate;
        this.seasonEndDate = seasonEndDate;
    }
    static fromRequestObject(requestObject) {
        return new Holiday(requestObject.name, requestObject.tagId, requestObject.holidayDates, requestObject.exclusionTags || [], requestObject.seasonStartDate, requestObject.seasonEndDate);
    }
}
exports.Holiday = Holiday;
