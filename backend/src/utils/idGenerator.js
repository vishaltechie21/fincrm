/**
 * Safely generates custom string IDs of format XXX-00001
 * where XXX is the first 3 digits of the Unix epoch timestamp in seconds.
 * 
 * Uses a row lock (FOR UPDATE) inside a transaction connection to prevent concurrency duplicate issues.
 */
async function generateId(connection, tableName, idColumnName) {
  // Take the last 3 digits of the Unix timestamp (seconds) so the prefix changes every second
  const timestampPrefix = String(Math.floor(Date.now() / 1000)).slice(-3);
  const prefixPattern = `${timestampPrefix}-%`;

  // Fetch the latest generated ID with this prefix, locking the selected row for write operations
  const [rows] = await connection.query(
    `SELECT ${idColumnName} FROM ${tableName} WHERE ${idColumnName} LIKE ? ORDER BY ${idColumnName} DESC LIMIT 1 FOR UPDATE`,
    [prefixPattern]
  );

  let nextSeq = 1;
  if (rows.length > 0) {
    const lastId = rows[0][idColumnName];
    const parts = lastId.split('-');
    if (parts.length === 2) {
      const lastSeq = parseInt(parts[1], 10);
      if (!isNaN(lastSeq)) {
        nextSeq = lastSeq + 1;
      }
    }
  }

  const paddedSeq = String(nextSeq).padStart(5, '0');
  return `${timestampPrefix}-${paddedSeq}`;
}

module.exports = {
  generateId
};
