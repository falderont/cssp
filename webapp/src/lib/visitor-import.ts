import ExcelJS from "exceljs";
import Papa from "papaparse";

export type VisitorImportRow = {
  fullName: string;
  idType: string;
  idNumber: string;
  company: string;
  email: string;
  phone: string;
};

function normalizeHeader(h: string): string {
  return h.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
}

const HEADER_MAP: Record<string, keyof VisitorImportRow> = {
  fullname: "fullName",
  name: "fullName",
  visitorname: "fullName",
  idtype: "idType",
  idnumber: "idNumber",
  id: "idNumber",
  company: "company",
  organization: "company",
  email: "email",
  phone: "phone",
  phonenumber: "phone",
  mobile: "phone",
};

const EMPTY_ROW: VisitorImportRow = { fullName: "", idType: "", idNumber: "", company: "", email: "", phone: "" };

export async function parseVisitorRowsFromXlsx(buffer: Buffer): Promise<VisitorImportRow[]> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as unknown as ExcelJS.Buffer);
  const sheet = workbook.worksheets[0];
  if (!sheet) return [];

  const rows: VisitorImportRow[] = [];
  const headerMap: Record<number, keyof VisitorImportRow> = {};

  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) {
      row.eachCell((cell, colNumber) => {
        const key = HEADER_MAP[normalizeHeader(String(cell.value ?? ""))];
        if (key) headerMap[colNumber] = key;
      });
      return;
    }
    const record: Partial<VisitorImportRow> = {};
    row.eachCell((cell, colNumber) => {
      const key = headerMap[colNumber];
      if (key) record[key] = String(cell.value ?? "").trim();
    });
    if (record.fullName) {
      rows.push({ ...EMPTY_ROW, ...record });
    }
  });

  return rows;
}

export function parseVisitorRowsFromCsv(text: string): VisitorImportRow[] {
  const parsed = Papa.parse<Record<string, string>>(text, { header: true, skipEmptyLines: true });
  return parsed.data
    .map((r) => {
      const normalized: Partial<VisitorImportRow> = {};
      for (const [k, v] of Object.entries(r)) {
        const mapped = HEADER_MAP[normalizeHeader(k)];
        if (mapped) normalized[mapped] = (v ?? "").trim();
      }
      return { ...EMPTY_ROW, ...normalized };
    })
    .filter((r) => r.fullName.length > 0);
}

export async function parseVisitorRowsFromFile(file: File): Promise<VisitorImportRow[]> {
  const name = file.name.toLowerCase();
  if (name.endsWith(".xlsx") || name.endsWith(".xlsm")) {
    const buffer = Buffer.from(await file.arrayBuffer());
    return parseVisitorRowsFromXlsx(buffer);
  }
  const text = await file.text();
  return parseVisitorRowsFromCsv(text);
}

export async function generateVisitorTemplateXlsx(): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Visitors");
  sheet.columns = [
    { header: "fullName", key: "fullName", width: 24 },
    { header: "company", key: "company", width: 26 },
    { header: "idType", key: "idType", width: 12 },
    { header: "idNumber", key: "idNumber", width: 20 },
    { header: "email", key: "email", width: 28 },
    { header: "phone", key: "phone", width: 18 },
  ];
  sheet.getRow(1).font = { bold: true };
  sheet.addRow({
    fullName: "Andi Prasetyo",
    company: "PT Kabel Nusantara",
    idType: "KTP",
    idNumber: "3201xxxxxxxxxx01",
    email: "andi@kabelnusantara.co.id",
    phone: "+62 812-0000-0001",
  });
  sheet.addRow({
    fullName: "Lina Wijaya",
    company: "Server Upgrade Vendor",
    idType: "Passport",
    idNumber: "A1234567",
    email: "lina@vendor.com",
    phone: "+62 812-0000-0002",
  });
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
