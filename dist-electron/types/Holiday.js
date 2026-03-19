export class Holiday {
    name;
    tagId;
    holidayDates;
    exclusionTags;
    seasonStartDate;
    seasonEndDate;
    constructor(name, tagId, holidayDates, exclusionTags, seasonStartDate, seasonEndDate) {
        this.name = name;
        this.tagId = tagId;
        this.holidayDates = holidayDates;
        this.exclusionTags = exclusionTags;
        this.seasonStartDate = seasonStartDate;
        this.seasonEndDate = seasonEndDate;
    }
}
