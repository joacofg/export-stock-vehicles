// helpers/google.ts
import fs from 'node:fs';
import { google } from 'googleapis';
import * as XLSX from 'xlsx';

// En CI, escribimos el JSON del SA a /tmp/sa.json
if (process.env.GOOGLE_CREDENTIALS_JSON && !process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  const credsPath = '/tmp/sa.json';
  fs.writeFileSync(credsPath, process.env.GOOGLE_CREDENTIALS_JSON);
  process.env.GOOGLE_APPLICATION_CREDENTIALS = credsPath;
}

export async function uploadXlsxToSheet(xlsxPath: string, sheetName = 'Hoja1') {
  const spreadsheetId = process.env.GOOGLE_SHEETS_ID;
  if (!spreadsheetId) throw new Error('Falta GOOGLE_SHEETS_ID');

  const auth = new google.auth.GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  const sheets = google.sheets({ version: 'v4', auth });

  const buf = fs.readFileSync(xlsxPath);
  const wb = XLSX.read(buf, { type: 'buffer' });
  const first = wb.SheetNames[0] || sheetName;
  const ws = wb.Sheets[first];
  const data: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true });

  // Limpiar y escribir
  await sheets.spreadsheets.values.clear({
    spreadsheetId,
    range: `${sheetName}!A:ZZ`,
  });
  if (data.length && data[0].length) {
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${sheetName}!A1`,
      valueInputOption: 'RAW',
      requestBody: { values: data },
    });
  }
}
