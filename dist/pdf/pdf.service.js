"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PdfService = void 0;
const common_1 = require("@nestjs/common");
const puppeteer_1 = __importDefault(require("puppeteer"));
let PdfService = class PdfService {
    generatePdfFromHtml = (html) => {
        let browserInstance;
        return puppeteer_1.default
            .launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
        })
            .then((browser) => {
            browserInstance = browser;
            return browser.newPage();
        })
            .then((page) => {
            return page.setContent(html, { waitUntil: 'networkidle0' }).then(() => page.pdf({
                format: 'A4',
                printBackground: true,
                margin: {
                    top: '20mm',
                    bottom: '20mm',
                    left: '15mm',
                    right: '15mm',
                },
            }));
        })
            .then((pdfBuffer) => {
            return browserInstance.close().then(() => Buffer.from(pdfBuffer));
        });
    };
};
exports.PdfService = PdfService;
exports.PdfService = PdfService = __decorate([
    (0, common_1.Injectable)()
], PdfService);
//# sourceMappingURL=pdf.service.js.map