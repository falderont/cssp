import { describe, expect, it } from "vitest";
import { parseVisitorRowsFromCsv, generateVisitorTemplateXlsx, parseVisitorRowsFromXlsx } from "./visitor-import";

describe("parseVisitorRowsFromCsv", () => {
  it("maps known header aliases to the canonical field names", () => {
    const csv = ["Name,Organization,ID Type,ID,Email,Mobile", "Andi Prasetyo,PT Kabel,KTP,32010001,andi@ex.co,0812"].join("\n");
    const rows = parseVisitorRowsFromCsv(csv);
    expect(rows).toEqual([
      {
        fullName: "Andi Prasetyo",
        company: "PT Kabel",
        idType: "KTP",
        idNumber: "32010001",
        email: "andi@ex.co",
        phone: "0812",
      },
    ]);
  });

  it("drops rows with no fullName", () => {
    const csv = ["fullName,company", "Lina,Vendor Co", ",No Name Co"].join("\n");
    const rows = parseVisitorRowsFromCsv(csv);
    expect(rows).toHaveLength(1);
    expect(rows[0].fullName).toBe("Lina");
  });

  it("fills missing optional columns with empty strings", () => {
    const csv = ["fullName", "Solo Visitor"].join("\n");
    const rows = parseVisitorRowsFromCsv(csv);
    expect(rows[0]).toEqual({
      fullName: "Solo Visitor",
      idType: "",
      idNumber: "",
      company: "",
      email: "",
      phone: "",
    });
  });

  it("trims whitespace from values", () => {
    const csv = ["fullName,company", "  Padded Name  ,  Padded Co  "].join("\n");
    const rows = parseVisitorRowsFromCsv(csv);
    expect(rows[0].fullName).toBe("Padded Name");
    expect(rows[0].company).toBe("Padded Co");
  });

  it("ignores unrecognized columns", () => {
    const csv = ["fullName,favoriteColor", "Someone,Blue"].join("\n");
    const rows = parseVisitorRowsFromCsv(csv);
    expect(rows[0]).not.toHaveProperty("favoriteColor");
  });

  it("returns an empty array for a header-only file", () => {
    const rows = parseVisitorRowsFromCsv("fullName,company\n");
    expect(rows).toEqual([]);
  });
});

describe("generateVisitorTemplateXlsx / parseVisitorRowsFromXlsx round-trip", () => {
  it("parses its own generated template back into two sample rows", async () => {
    const buffer = await generateVisitorTemplateXlsx();
    const rows = await parseVisitorRowsFromXlsx(buffer);
    expect(rows).toHaveLength(2);
    expect(rows[0].fullName).toBe("Andi Prasetyo");
    expect(rows[1].fullName).toBe("Lina Wijaya");
  });
});
