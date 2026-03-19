export class Tag {
    tagId;
    name;
    type;
    seasonStartDate;
    seasonEndDate;
    explicitlyHoliday;
    sequence;
    holidayDates;
    exclusionTagIds;
    constructor(tagId, name, type, seasonStartDate, seasonEndDate, explicitlyHoliday, sequence, holidayDates, exclusionTagIds) {
        this.tagId = tagId;
        this.name = name;
        this.type = type;
        this.seasonStartDate = seasonStartDate;
        this.seasonEndDate = seasonEndDate;
        this.explicitlyHoliday = explicitlyHoliday;
        this.sequence = sequence;
        this.holidayDates = holidayDates;
        this.exclusionTagIds = exclusionTagIds;
    }
    isHoliday() {
        return this.type === "Holiday";
    }
    isAgeGroup() {
        return this.type === "AgeGroup";
    }
    isRegularTag() {
        return ["Aesthetic", "Era", "Genre", "Specialty"].includes(this.type);
    }
    isExplicitlyHoliday() {
        return this.explicitlyHoliday === true;
    }
    canPlayAnytime() {
        return !this.isExplicitlyHoliday();
    }
}
