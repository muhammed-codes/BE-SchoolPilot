export const bulkLayoutTemplate = (cardHtmls: string[]): string => {
  const cardsPerPage = 8;
  const pages: string[] = [];

  for (let i = 0; i < cardHtmls.length; i += cardsPerPage) {
    const pageCards = cardHtmls.slice(i, i + cardsPerPage);
    pages.push(`
      <div style="
        width: 210mm; height: 297mm; padding: 10mm;
        box-sizing: border-box; page-break-after: always;
        display: flex; flex-wrap: wrap; align-content: flex-start;
        gap: 5mm; justify-content: center;
      ">
        ${pageCards.join('\n')}
      </div>
    `);
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8" />
      <style>
        * { margin: 0; padding: 0; }
        @page { size: A4; margin: 0; }
        body { width: 210mm; }
      </style>
    </head>
    <body>
      ${pages.join('\n')}
    </body>
    </html>
  `;
};

export const singleCardLayout = (cardHtml: string): string => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8" />
      <style>
        * { margin: 0; padding: 0; }
        @page { size: A4; margin: 0; }
        body {
          width: 210mm; height: 297mm;
          display: flex; align-items: center; justify-content: center;
        }
      </style>
    </head>
    <body>
      ${cardHtml}
    </body>
    </html>
  `;
};
