"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgeGroup = void 0;
class AgeGroup {
    constructor(tagId, name, sequence) {
        this.tagId = tagId;
        this.name = name;
        this.sequence = sequence;
    }
    static fromRequestObject(requestObject) {
        return new AgeGroup(requestObject.tagId, requestObject.name, requestObject.sequence);
    }
}
exports.AgeGroup = AgeGroup;
