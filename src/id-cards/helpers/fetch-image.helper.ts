import https from 'https';
import http from 'http';

const PLACEHOLDER_BASE64 =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mO88P/BfwAJ5QPwHjZcygAAAABJRU5ErkJggg==';

export const fetchImageAsBase64 = (url: string | null): Promise<string> => {
  if (!url) return Promise.resolve(PLACEHOLDER_BASE64);

  const client = url.startsWith('https') ? https : http;

  return new Promise<string>((resolve) => {
    client
      .get(url, (res) => {
        const chunks: Buffer[] = [];
        res.on('data', (chunk: Buffer) => chunks.push(chunk));
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
