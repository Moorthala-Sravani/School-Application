const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.connect((err) => {
  if (err) {
    console.log('DB Error:', err.message);
  } else {
    console.log('PostgreSQL Connected');
  }
});

// Expand bulk VALUES ? (array of arrays) into $1,$2,... placeholders
function expandBulkValues(sql, params) {
  const match = sql.match(/VALUES\s*\?/i);
  if (!match) return null;

  const bulkData = params[0];
  if (!Array.isArray(bulkData) || bulkData.length === 0) return null;

  let counter = 0;
  const placeholders = bulkData.map(row => {
    if (!Array.isArray(row)) row = [row];
    return '(' + row.map(() => `$${++counter}`).join(', ') + ')';
  }).join(', ');

  const flatParams = bulkData.flat();
  const newSql = sql.replace(/VALUES\s*\?/i, `VALUES ${placeholders}`);
  return { sql: newSql, params: flatParams };
}

// Expand ? placeholders, handling arrays (for IN (?)) inline
function expandParams(sql, params) {
  const newParams = [];
  let counter = 0;
  let paramIndex = 0;

  const newSql = sql.replace(/\?/g, () => {
    const val = params[paramIndex++];
    if (Array.isArray(val)) {
      if (val.length === 0) {
        // Empty IN clause — use impossible condition
        return 'NULL';
      }
      return val.map(v => {
        newParams.push(v);
        return `$${++counter}`;
      }).join(', ');
    } else {
      newParams.push(val);
      return `$${++counter}`;
    }
  });

  return { sql: newSql, params: newParams };
}

function transformSql(sql) {
  // Remove backticks
  sql = sql.replace(/`/g, '"');
  // MySQL MONTH(col)/YEAR(col) -> EXTRACT
  sql = sql.replace(/\bMONTH\((\w+)\)/gi, 'EXTRACT(MONTH FROM $1)');
  sql = sql.replace(/\bYEAR\((\w+)\)/gi, 'EXTRACT(YEAR FROM $1)');
  // MySQL double-quoted string literals -> single-quoted (only in WHERE/VALUES context)
  sql = sql.replace(/ = "([^"]+)"/g, " = '$1'");
  sql = sql.replace(/\bIN \("([^"]+)"\)/g, "IN ('$1')");
  sql = sql.replace(/, "([^"]+)"\)/g, ", '$1')");
  // Fix INSERT INTO ... VALUES (?, "literal", ?) style double-quoted literals
  return sql;
}

// mysql2-compatible query wrapper
const db = {
  query: (sql, params, callback) => {
    if (typeof params === 'function') {
      callback = params;
      params = [];
    }
    params = params || [];

    let processedSql = sql;
    let processedParams = params;

    // Try bulk VALUES ? expansion first
    const bulk = expandBulkValues(processedSql, processedParams);
    if (bulk) {
      processedSql = bulk.sql;
      processedParams = bulk.params;
    } else {
      // Regular ? -> $N expansion with IN (array) support
      const expanded = expandParams(processedSql, processedParams);
      processedSql = expanded.sql;
      processedParams = expanded.params;
    }

    // Apply SQL transformations
    processedSql = transformSql(processedSql);

    // Add RETURNING id to INSERT statements so insertId works
    const isInsert = /^\s*INSERT\s+INTO/i.test(processedSql);
    if (isInsert && !/RETURNING/i.test(processedSql)) {
      processedSql = processedSql.trim().replace(/;?\s*$/, '') + ' RETURNING id';
    }

    pool.query(processedSql, processedParams, (err, result) => {
      if (err) {
        console.error('Query error:', err.message);
        console.error('SQL:', processedSql);
        console.error('Params:', processedParams);
        if (callback) callback(err, null);
        return;
      }

      const rows = result.rows || [];
      const isSelect = result.command === 'SELECT';

      if (isSelect) {
        if (callback) callback(null, rows);
      } else {
        // For INSERT/UPDATE/DELETE return mysql2-like meta object
        const meta = {
          affectedRows: result.rowCount || 0,
          insertId: rows.length > 0 && rows[0].id ? rows[0].id : null,
        };
        if (callback) callback(null, meta);
      }
    });
  },
};

module.exports = db;
