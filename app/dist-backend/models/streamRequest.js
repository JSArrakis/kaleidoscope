"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdhocStreamRequest = exports.ContStreamRequest = void 0;
const utilities_1 = require("../utils/utilities");
class ContStreamRequest {
    constructor(password, title = 'Default', env = 'default', movies = [], tags = [], multiTags = [], blocks = [], startTime = 0) {
        this.Title = title;
        this.Env = (0, utilities_1.keyNormalizer)(env);
        this.Movies = movies;
        this.Tags = tags;
        this.MultiTags = multiTags;
        this.Blocks = blocks;
        this.StartTime = startTime;
        this.Password = password;
    }
    static fromRequestObject(requestObject) {
        return new ContStreamRequest(requestObject.password, requestObject.title || 'Default', requestObject.env || 'default', requestObject.movies || [], requestObject.tags || [], requestObject.multiTags || [], requestObject.blocks || [], requestObject.startTime || 0);
    }
}
exports.ContStreamRequest = ContStreamRequest;
class AdhocStreamRequest {
    constructor(password, title = 'Default', env = 'default', movies = [], tags = [], multiTags = [], collections = [], startTime = 0, endtime = 0) {
        this.Title = title;
        this.Env = (0, utilities_1.keyNormalizer)(env);
        this.Movies = movies;
        this.Tags = tags;
        this.MultiTags = multiTags;
        this.Blocks = collections;
        this.StartTime = startTime;
        this.EndTime = endtime;
        this.Password = password;
    }
    static fromRequestObject(requestObject) {
        return new AdhocStreamRequest(requestObject.password, requestObject.title || 'Default', requestObject.env || 'default', requestObject.movies || [], requestObject.tags || [], requestObject.multiTags || [], requestObject.collections || [], requestObject.startTime || 0, requestObject.endtime || 0);
    }
}
exports.AdhocStreamRequest = AdhocStreamRequest;
