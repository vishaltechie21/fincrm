/**
 * Safely generates custom string IDs of format XXX-00001
 * where XXX is the first 3 digits of the Unix epoch timestamp in seconds.
 * 
 * Uses a row lock (FOR UPDATE) inside a transaction connection to prevent concurrency duplicate issues.
 */
async function generateId(connection, tableName, idColumnName) {
  // Take the last 3 digits of the Unix timestamp (seconds) so the prefix changes every second
  const timestampPrefix = String(Math.floor(Date.now() / 1000)).slice(-3);

  // Fetch the maximum sequence suffix in the entire table
  const [rows] = await connection.query(
    `SELECT MAX(CAST(SUBSTRING_INDEX(${idColumnName}, '-', -1) AS UNSIGNED)) AS maxSeq FROM ${tableName} FOR UPDATE`
  );

  let nextSeq = 1;
  if (rows.length > 0 && rows[0].maxSeq !== null) {
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
