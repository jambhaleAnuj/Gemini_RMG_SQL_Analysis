// SQL.js Database Service - In-memory SQLite database

class DatabaseService {
  constructor() {
    this.db = null;
    this.isInitialized = false;
    this.tables = [];
    this.schema = {};
    this.SQL = null;
  }

  async initialize() {
    if (this.isInitialized) return;

    // Use global initSqlJs loaded from CDN
    if (typeof window.initSqlJs === "undefined") {
      throw new Error("SQL.js not loaded. Please refresh the page.");
    }

    this.SQL = await window.initSqlJs({
      locateFile: (file) =>
        `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.9.0/${file}`,
    });

    this.db = new this.SQL.Database();
    this.isInitialized = true;
    console.log("SQL.js database initialized");
  }

  // Sanitize table and column names for SQL
  sanitizeName(name) {
    if (!name) return "unnamed";
    // Replace special characters and spaces with underscores
    let sanitized = String(name)
      .replace(/[^a-zA-Z0-9_]/g, "_")
      .replace(/^(\d)/, "_$1") // Prefix with underscore if starts with number
      .replace(/_+/g, "_") // Replace multiple underscores with single
      .replace(/^_|_$/g, "") // Remove leading/trailing underscores
      .toLowerCase();

    return sanitized || "col";
  }

  // Infer SQL type from value
  inferType(value) {
    if (value === null || value === undefined || value === "") return "TEXT";
    if (typeof value === "number") {
      return Number.isInteger(value) ? "INTEGER" : "REAL";
    }
    if (typeof value === "boolean") return "INTEGER";
    if (value instanceof Date) return "TEXT";

    // Try to parse as number
    const num = Number(value);
    if (!isNaN(num) && value !== "") {
      return Number.isInteger(num) ? "INTEGER" : "REAL";
    }

    // Check for date patterns
    const datePatterns = [
      /^\d{4}-\d{2}-\d{2}$/,
      /^\d{2}\/\d{2}\/\d{4}$/,
      /^\d{2}-\d{2}-\d{4}$/,
    ];
    if (datePatterns.some((p) => p.test(String(value)))) return "TEXT";

    return "TEXT";
  }

  // Infer column types from data
  inferColumnTypes(data, columns) {
    const types = {};

    columns.forEach((col) => {
      const values = data
        .map((row) => row[col])
        .filter((v) => v !== null && v !== undefined && v !== "");

      if (values.length === 0) {
        types[col] = "TEXT";
        return;
      }

      // Check most common type
      const typeCounts = { INTEGER: 0, REAL: 0, TEXT: 0 };
      values.forEach((val) => {
        const type = this.inferType(val);
        typeCounts[type]++;
      });

      // Prefer most specific type that matches all values
      if (typeCounts.TEXT > 0 && typeCounts.TEXT > values.length * 0.1) {
        types[col] = "TEXT";
      } else if (typeCounts.REAL > 0) {
        types[col] = "REAL";
      } else if (typeCounts.INTEGER > 0) {
        types[col] = "INTEGER";
      } else {
        types[col] = "TEXT";
      }
    });

    return types;
  }

  // Create table from Excel data
  createTableFromData(tableName, data, originalColumns) {
    if (!this.db || data.length === 0) return null;

    // Sanitize table name
    const sanitizedTableName = this.sanitizeName(tableName);

    // Create column mapping (original -> sanitized)
    const columnMapping = {};
    const sanitizedColumns = [];
    const seenNames = new Set();

    originalColumns.forEach((col, idx) => {
      let sanitized = this.sanitizeName(col);
      if (!sanitized) sanitized = `col_${idx}`;

      // Handle duplicates
      let uniqueName = sanitized;
      let counter = 1;
      while (seenNames.has(uniqueName)) {
        uniqueName = `${sanitized}_${counter}`;
        counter++;
      }
      seenNames.add(uniqueName);

      columnMapping[col] = uniqueName;
      sanitizedColumns.push(uniqueName);
    });

    // Infer types
    const types = this.inferColumnTypes(data, originalColumns);

    // Drop table if exists
    try {
      this.db.run(`DROP TABLE IF EXISTS "${sanitizedTableName}"`);
    } catch (e) {
      console.warn("Error dropping table:", e);
    }

    // Create table
    const columnDefs = originalColumns
      .map((col, idx) => {
        const sanitizedCol = columnMapping[col];
        const type = types[col] || "TEXT";
        return `"${sanitizedCol}" ${type}`;
      })
      .join(", ");

    const createSQL = `CREATE TABLE "${sanitizedTableName}" (id INTEGER PRIMARY KEY AUTOINCREMENT, ${columnDefs})`;

    try {
      this.db.run(createSQL);
    } catch (e) {
      console.error("Error creating table:", e, createSQL);
      throw e;
    }

    // Insert data
    const placeholders = originalColumns.map(() => "?").join(", ");
    const insertSQL = `INSERT INTO "${sanitizedTableName}" (${sanitizedColumns
      .map((c) => `"${c}"`)
      .join(", ")}) VALUES (${placeholders})`;

    const stmt = this.db.prepare(insertSQL);

    data.forEach((row) => {
      const values = originalColumns.map((col) => {
        let val = row[col];
        if (val === undefined || val === null) return null;
        if (types[col] === "INTEGER" || types[col] === "REAL") {
          const num = Number(val);
          return isNaN(num) ? null : num;
        }
        return String(val);
      });

      try {
        stmt.run(values);
      } catch (e) {
        console.warn("Error inserting row:", e, values);
      }
    });

    stmt.free();

    // Store schema info
    const schemaInfo = {
      tableName: sanitizedTableName,
      originalTableName: tableName,
      columns: originalColumns.map((col, idx) => ({
        original: col,
        sanitized: columnMapping[col],
        type: types[col],
        index: idx,
      })),
      rowCount: data.length,
      columnMapping,
    };

    this.tables.push(sanitizedTableName);
    this.schema[sanitizedTableName] = schemaInfo;

    console.log(
      `Created table "${sanitizedTableName}" with ${data.length} rows and ${sanitizedColumns.length} columns`
    );

    return schemaInfo;
  }

  // Execute SQL query
  executeQuery(sql) {
    if (!this.db) throw new Error("Database not initialized");

    try {
      const results = this.db.exec(sql);

      if (results.length === 0) {
        return { columns: [], values: [], rowCount: 0 };
      }

      const result = results[0];
      return {
        columns: result.columns,
        values: result.values,
        rowCount: result.values.length,
      };
    } catch (e) {
      console.error("SQL Error:", e);
      throw new Error(`SQL Error: ${e.message}`);
    }
  }

  // Get all data from a table
  getTableData(tableName) {
    return this.executeQuery(`SELECT * FROM "${tableName}"`);
  }

  // Get table schema
  getTableSchema(tableName) {
    return this.schema[tableName] || null;
  }

  // Get all tables info
  getAllTablesInfo() {
    return this.tables.map((table) => ({
      name: table,
      ...this.schema[table],
    }));
  }

  // Generate schema description for LLM
  getSchemaDescription() {
    let description = "DATABASE SCHEMA:\n\n";

    this.tables.forEach((tableName) => {
      const schema = this.schema[tableName];
      description += `TABLE: "${tableName}"`;
      if (schema.originalTableName !== tableName) {
        description += ` (original name: "${schema.originalTableName}")`;
      }
      description += `\nRows: ${schema.rowCount}\n`;
      description += "Columns:\n";

      schema.columns.forEach((col) => {
        description += `  - "${col.sanitized}" (${col.type})`;
        if (col.original !== col.sanitized) {
          description += ` [original: "${col.original}"]`;
        }
        description += "\n";
      });
      description += "\n";
    });

    return description;
  }

  // Get sample data for context
  getSampleData(tableName, limit = 5) {
    try {
      const result = this.executeQuery(
        `SELECT * FROM "${tableName}" LIMIT ${limit}`
      );
      return result;
    } catch (e) {
      return null;
    }
  }

  // Get full context for LLM (schema + sample data)
  getFullContext() {
    let context = this.getSchemaDescription();

    context += "\nSAMPLE DATA FROM EACH TABLE:\n\n";

    this.tables.forEach((tableName) => {
      const sample = this.getSampleData(tableName, 3);
      if (sample && sample.values.length > 0) {
        context += `TABLE "${tableName}" (first 3 rows):\n`;
        context += `Columns: ${sample.columns.join(", ")}\n`;
        sample.values.forEach((row, idx) => {
          context += `Row ${idx + 1}: ${row
            .map((v) => (v === null ? "NULL" : v))
            .join(", ")}\n`;
        });
        context += "\n";
      }
    });

    return context;
  }

  // Clear all data
  clearAll() {
    if (!this.db) return;

    this.tables.forEach((table) => {
      try {
        this.db.run(`DROP TABLE IF EXISTS "${table}"`);
      } catch (e) {
        console.warn("Error dropping table:", e);
      }
    });

    this.tables = [];
    this.schema = {};
  }

  // Get column statistics
  getColumnStats(tableName, columnName) {
    const schema = this.schema[tableName];
    if (!schema) return null;

    const colInfo = schema.columns.find(
      (c) => c.sanitized === columnName || c.original === columnName
    );
    if (!colInfo) return null;

    const sanitizedCol = colInfo.sanitized;

    try {
      if (colInfo.type === "INTEGER" || colInfo.type === "REAL") {
        const stats = this.executeQuery(`
          SELECT 
            MIN("${sanitizedCol}") as min_val,
            MAX("${sanitizedCol}") as max_val,
            AVG("${sanitizedCol}") as avg_val,
            COUNT("${sanitizedCol}") as count_val,
            SUM("${sanitizedCol}") as sum_val
          FROM "${tableName}"
          WHERE "${sanitizedCol}" IS NOT NULL
        `);

        if (stats.values.length > 0) {
          const [min_val, max_val, avg_val, count_val, sum_val] =
            stats.values[0];
          return {
            type: "numeric",
            min: min_val,
            max: max_val,
            avg: avg_val,
            count: count_val,
            sum: sum_val,
          };
        }
      } else {
        const stats = this.executeQuery(`
          SELECT "${sanitizedCol}", COUNT(*) as cnt
          FROM "${tableName}"
          WHERE "${sanitizedCol}" IS NOT NULL
          GROUP BY "${sanitizedCol}"
          ORDER BY cnt DESC
          LIMIT 10
        `);

        return {
          type: "categorical",
          topValues: stats.values.map(([val, cnt]) => ({
            value: val,
            count: cnt,
          })),
          distinctCount: this.executeQuery(
            `SELECT COUNT(DISTINCT "${sanitizedCol}") FROM "${tableName}"`
          ).values[0][0],
        };
      }
    } catch (e) {
      console.error("Error getting stats:", e);
    }

    return null;
  }
}

// Singleton instance
const databaseService = new DatabaseService();
export default databaseService;
