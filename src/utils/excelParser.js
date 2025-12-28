// Excel Parser Utility
import * as XLSX from "xlsx";

class ExcelParser {
  // Parse Excel file and return structured data
  async parseFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, {
            type: "array",
            cellDates: true,
            cellNF: true,
            cellText: true,
          });

          const result = {
            fileName: file.name,
            sheets: [],
          };

          workbook.SheetNames.forEach((sheetName) => {
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, {
              header: 1,
              defval: null,
              blankrows: false,
              raw: false,
            });

            if (jsonData.length > 0) {
              // First row is headers
              const headers = jsonData[0].map((h, idx) => {
                if (h === null || h === undefined || h === "") {
                  return `Column_${idx + 1}`;
                }
                return String(h).trim();
              });

              // Rest is data
              const rows = jsonData.slice(1).map((row) => {
                const obj = {};
                headers.forEach((header, idx) => {
                  let value = row[idx];

                  // Clean up value
                  if (value === undefined || value === null) {
                    obj[header] = null;
                  } else if (value instanceof Date) {
                    obj[header] = value.toISOString().split("T")[0];
                  } else if (typeof value === "string") {
                    value = value.trim();
                    // Try to convert to number
                    const num = Number(value.replace(/,/g, ""));
                    if (!isNaN(num) && value !== "") {
                      obj[header] = num;
                    } else {
                      obj[header] = value;
                    }
                  } else {
                    obj[header] = value;
                  }
                });
                return obj;
              });

              // Filter out completely empty rows
              const filteredRows = rows.filter((row) =>
                Object.values(row).some((v) => v !== null && v !== "")
              );

              if (filteredRows.length > 0) {
                result.sheets.push({
                  name: sheetName,
                  headers,
                  data: filteredRows,
                  rowCount: filteredRows.length,
                  columnCount: headers.length,
                });
              }
            }
          });

          resolve(result);
        } catch (error) {
          reject(new Error(`Failed to parse ${file.name}: ${error.message}`));
        }
      };

      reader.onerror = () => reject(new Error(`Failed to read ${file.name}`));
      reader.readAsArrayBuffer(file);
    });
  }

  // Parse multiple files
  async parseFiles(files) {
    const results = [];
    const errors = [];

    for (const file of files) {
      try {
        const result = await this.parseFile(file);
        results.push(result);
      } catch (error) {
        errors.push({ file: file.name, error: error.message });
      }
    }

    return { results, errors };
  }

  // Get supported file extensions
  getSupportedExtensions() {
    return [".xlsx", ".xls", ".csv", ".xlsb", ".xlsm", ".ods"];
  }

  // Validate file type
  isValidFile(file) {
    const ext = "." + file.name.split(".").pop().toLowerCase();
    return this.getSupportedExtensions().includes(ext);
  }

  // Export data to Excel
  exportToExcel(data, columns, fileName = "export.xlsx") {
    const ws = XLSX.utils.json_to_sheet(
      data.map((row) => {
        const obj = {};
        columns.forEach((col, idx) => {
          obj[col] = row[idx];
        });
        return obj;
      })
    );

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data");
    XLSX.writeFile(wb, fileName);
  }

  // Export query results
  exportQueryResults(results, fileName = "query_results.xlsx") {
    if (!results || !results.columns || !results.values) return;

    const data = results.values.map((row) => {
      const obj = {};
      results.columns.forEach((col, idx) => {
        obj[col] = row[idx];
      });
      return obj;
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Query Results");
    XLSX.writeFile(wb, fileName);
  }
}

const excelParser = new ExcelParser();
export default excelParser;
