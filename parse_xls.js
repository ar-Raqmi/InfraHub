import xlsx from 'xlsx';
import fs from 'fs';

const filePath = './references/electrical/BQ PANEL 2026 [ E ].xls';
const workbook = xlsx.readFile(filePath);

// Get the first sheet
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];

// Convert to JSON
const data = xlsx.utils.sheet_to_json(worksheet, { header: 1 });

fs.writeFileSync('bq_electrical_raw.json', JSON.stringify(data, null, 2));
console.log('Saved to bq_electrical_raw.json');
