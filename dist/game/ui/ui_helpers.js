"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createListItem = exports.formatChange = exports.formatCurrency = void 0;
const formatCurrency = (value) => `$${value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
exports.formatCurrency = formatCurrency;
const formatChange = (value) => {
    const prefix = value >= 0 ? "+" : "";
    return `${prefix}${value.toFixed(2)}`;
};
exports.formatChange = formatChange;
const createListItem = (content) => {
    const item = document.createElement("li");
    item.textContent = content;
    return item;
};
exports.createListItem = createListItem;
