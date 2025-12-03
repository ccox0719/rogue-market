"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetMeta = exports.loadMeta = exports.saveMeta = void 0;
const metaState_js_1 = require("../core/metaState.js");
const META_SAVE_KEY = "rogue-market-meta";
const saveMeta = (meta) => {
    localStorage.setItem(META_SAVE_KEY, JSON.stringify(meta));
};
exports.saveMeta = saveMeta;
const loadMeta = () => {
    const raw = localStorage.getItem(META_SAVE_KEY);
    if (!raw) {
        (0, exports.saveMeta)(metaState_js_1.defaultMetaState);
        return metaState_js_1.defaultMetaState;
    }
    try {
        return JSON.parse(raw);
    }
    catch {
        (0, exports.saveMeta)(metaState_js_1.defaultMetaState);
        return metaState_js_1.defaultMetaState;
    }
};
exports.loadMeta = loadMeta;
const resetMeta = () => {
    (0, exports.saveMeta)(metaState_js_1.defaultMetaState);
};
exports.resetMeta = resetMeta;
