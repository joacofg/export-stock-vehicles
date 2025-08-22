import 'dotenv/config';
import { google } from 'googleapis';

async function main() {
  const spreadsheetId = process.env.GOOGLE_SHEETS_ID!;
  const auth = new google.auth.GoogleAuth({ scopes: ['https://www.googleapis.com/auth/spreadsheets'] });
  const sheets = google.sheets({ version: 'v4', auth });

  // Listar pestañas
  const meta = await sheets.spreadsheets.get({ spreadsheetId });
  const title = meta.data.sheets?.[0]?.properties?.title || 'Hoja 1';
  console.log('Primer sheet:', title);

  // Si tiene espacios, siempre citar con comillas simples
  const range = `'${title}'!A1`;

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range,
    valueInputOption: 'RAW',
    requestBody: { values: [['OK from Service Account']] },
  });

  console.log('Write OK');
}

main().catch(e => { console.error(e.response?.data || e); process.exit(1); });
