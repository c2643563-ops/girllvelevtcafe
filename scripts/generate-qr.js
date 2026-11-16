const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');

const BASE_URL = process.argv[2] || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
const OUT_DIR = path.join(process.cwd(), 'public', 'qr-codes');

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  console.log(`Generating 15 Table QR codes for base URL: ${BASE_URL}`);

  for (let table = 1; table <= 15; table++) {
    const targetUrl = `${BASE_URL.replace(/\/$/, '')}/menu?table=${table}`;
    const filePath = path.join(OUT_DIR, `table-${table}.png`);
    await QRCode.toFile(filePath, targetUrl, {
      width: 512,
      margin: 2,
      color: {
        dark: '#4A0B1E',
        light: '#FFFDF9',
      },
      errorCorrectionLevel: 'H',
    });
    console.log(`  ✓ Table ${table} -> ${filePath} (${targetUrl})`);
  }
  console.log('\nAll 15 QR codes generated successfully!');
}

main().catch((err) => {
  console.error('QR generation failed:', err);
  process.exit(1);
});
