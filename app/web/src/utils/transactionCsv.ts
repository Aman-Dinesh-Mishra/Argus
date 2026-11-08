import type { TransactionInput } from "../types/api";

const FEATURES = [
  "Time",
  "Amount",
  ...Array.from({ length: 28 }, (_, index) => `V${index + 1}`),
];

function parseCSV(content: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let insideQuotes = false;

  for (let i = 0; i < content.length; i++) {
    const char = content[i];

    if (insideQuotes) {
      if (char === '"' && content[i + 1] === '"') {
        field += '"';
        i++;
      } else if (char === '"') {
        insideQuotes = false;
      } else {
        field += char;
      }
    } else if (char === '"') {
      insideQuotes = true;
    } else if (char === ",") {
      row.push(field.trim());
      field = "";
    } else if (char === "\n") {
      row.push(field.trim());

      if (row.some((value) => value !== "")) {
        rows.push(row);
      }

      row = [];
      field = "";
    } else if (char !== "\r") {
      field += char;
    }
  }

  row.push(field.trim());

  if (row.some((value) => value !== "")) {
    rows.push(row);
  }

  return rows;
}

export function parseTransactionCSV(content: string): TransactionInput[] {
  const rows = parseCSV(content.replace(/^\uFEFF/, ""));

  if (rows.length < 2) {
    throw new Error("CSV must contain a header and at least one transaction.");
  }

  const headers = rows[0].map((header) => header.trim());

  if (new Set(headers).size !== headers.length) {
    throw new Error("CSV contains duplicate column names.");
  }

  const allowedHeaders = new Set([...FEATURES, "Class"]);

  const missing = FEATURES.filter((feature) => !headers.includes(feature));
  const unexpected = headers.filter((header) => !allowedHeaders.has(header));

  if (missing.length > 0) {
    throw new Error(`Missing required columns: ${missing.join(", ")}`);
  }

  if (unexpected.length > 0) {
    throw new Error(`Unexpected columns: ${unexpected.join(", ")}`);
  }

  return rows.slice(1).map((row, index) => {
    if (row.length !== headers.length) {
      throw new Error(`Invalid column count in CSV row ${index + 2}.`);
    }

    const values: Record<string, number> = {};

    for (const feature of FEATURES) {
      const columnIndex = headers.indexOf(feature);
      const value = Number(row[columnIndex]);

      if (row[columnIndex] === "" || !Number.isFinite(value)) {
        throw new Error(
          `Invalid numeric value for ${feature} in CSV row ${index + 2}.`,
        );
      }

      values[feature] = value;
    }

    if (values.Time < 0 || values.Amount < 0) {
      throw new Error(
        `Time and Amount cannot be negative in CSV row ${index + 2}.`,
      );
    }

    const transaction = {
      Time: values.Time,
      Amount: values.Amount,
    } as TransactionInput;

    for (let i = 1; i <= 28; i++) {
      const feature = `V${i}` as `V${number}`;
      transaction[feature] = values[feature];
    }

    return transaction;
  });
}
