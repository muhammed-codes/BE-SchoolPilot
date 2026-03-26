"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchImageAsBase64 = void 0;
const https_1 = __importDefault(require("https"));
const http_1 = __importDefault(require("http"));
const PLACEHOLDER_BASE64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mO88P/BfwAJ5QPwHjZcygAAAABJRU5ErkJggg==';
const fetchImageAsBase64 = (url) => {
    if (!url)
        return Promise.resolve(PLACEHOLDER_BASE64);
    const client = url.startsWith('https') ? https_1.default : http_1.default;
    return new Promise((resolve) => {
        client
            .get(url, (res) => {
            const chunks = [];
            res.on('data', (chunk) => chunks.push(chunk));
            res.on('end', () => {
                const buffer = Buffer.concat(chunks);
                const contentType = res.headers['content-type'] || 'image/jpeg';
                resolve(`data:${contentType};base64,${buffer.toString('base64')}`);
            });
            res.on('error', () => resolve(PLACEHOLDER_BASE64));
        })
            .on('error', () => resolve(PLACEHOLDER_BASE64));
    });
};
exports.fetchImageAsBase64 = fetchImageAsBase64;
//# sourceMappingURL=fetch-image.helper.js.map