import { Injectable } from '@nestjs/common';
import puppeteer from 'puppeteer';

@Injectable()
export class PdfService {
  generatePdfFromHtml = (html: string): Promise<Buffer> => {
    let browserInstance: Awaited<ReturnType<typeof puppeteer.launch>>;

    return puppeteer
      .launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      })
      .then((browser) => {
        browserInstance = browser;
        return browser.newPage();
      })
      .then((page) => {
        return page.setContent(html, { waitUntil: 'networkidle0' }).then(() =>
          page.pdf({
            format: 'A4',
            printBackground: true,
            margin: {
              top: '20mm',
              bottom: '20mm',
              left: '15mm',
              right: '15mm',
            },
          }),
        );
      })
      .then((pdfBuffer) => {
        return browserInstance.close().then(() => Buffer.from(pdfBuffer));
      });
  };
}
