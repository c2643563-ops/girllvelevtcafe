import { NextResponse } from 'next/server';
import QRCode from 'qrcode';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const hostHeader = request.headers.get('x-forwarded-host') || request.headers.get('host');
  const protoHeader = request.headers.get('x-forwarded-proto') || 'https';
  const inferredOrigin = hostHeader ? `${protoHeader}://${hostHeader}` : origin;

  const baseUrl = (
    searchParams.get('baseUrl') ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    inferredOrigin
  ).replace(/\/$/, '');

  const saveFiles = searchParams.get('save') === '1';
  const outDir = path.join(process.cwd(), 'public', 'qr-codes');
  if (saveFiles) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const tables = [];
  for (let tableNumber = 1; tableNumber <= 15; tableNumber++) {
    const url = `${baseUrl}/menu?table=${tableNumber}`;
    const dataUrl = await QRCode.toDataURL(url, {
      width: 400,
      margin: 2,
      color: {
        dark: '#4A0B1E',
        light: '#FFFDF9',
      },
      errorCorrectionLevel: 'H',
    });

    if (saveFiles) {
      await QRCode.toFile(path.join(outDir, `table-${tableNumber}.png`), url, {
        width: 512,
        margin: 2,
        color: {
          dark: '#4A0B1E',
          light: '#FFFDF9',
        },
        errorCorrectionLevel: 'H',
      });
    }

    tables.push({
      tableNumber,
      label: `Table ${tableNumber}`,
      url,
      dataUrl,
      pngPath: `/qr-codes/table-${tableNumber}.png`,
    });
  }

  return NextResponse.json({ baseUrl, tables });
}
