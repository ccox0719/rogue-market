"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.advanceDay = exports.createInitialTime = void 0;
const createInitialTime = () => ({ day: 1 });
exports.createInitialTime = createInitialTime;
const advanceDay = (time, step = 1) => ({
    day: time.day + step,
});
exports.advanceDay = advanceDay;
