/**
 * Safely generates custom string IDs of format XXX-00001
 * where XXX is the last 3 digits of the Unix epoch timestamp in seconds.
 * 
 * Uses MSSQL row/table locking hints (WITH (UPDLOCK, HOLDLOCK)) inside a transaction to prevent concurrency duplicate issues.
 */
async function generateId(connection, tableName, idColumnName) {
  // Take the last 3 digits of the Unix timestamp (seconds) so the prefix changes every second
  const timestampPrefix = String(Math.floor(Date.now() / 1000)).slice(-3);

  // Fetch the maximum sequence suffix in the entire table using MSSQL functions and locking hints
  const [rows] = await connection.query(
    `SELECT MAX(CAST(RIGHT(${idColumnName}, CHARINDEX('-', REVERSE(${idColumnName})) - 1) AS INT)) AS maxSeq FROM ${tableName} WITH (UPDLOCK, HOLDLOCK)`
  );

  let nextSeq = 1;
  if (rows.length > 0 && rows[0].maxSeq !== null && rows[0].maxSeq !== undefined) {
    const lastSeq = parseInt(rows[0].maxSeq, 10);
    if (!isNaN(lastSeq)) {
      nextSeq = lastSeq + 1;
    }
  }

  const paddedSeq = String(nextSeq).padStart(5, '0');
  return `${timestampPrefix}-${paddedSeq}`;
}

module.exports = {
  generateId
};
