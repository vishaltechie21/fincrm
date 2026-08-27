/**
 * Helper component to highlight search matching substrings inside table cells.
 */
const HighlightText = ({ text = '', highlight = '' }) => {
  const strText = text === null || text === undefined ? '' : String(text);
  
  if (!highlight || !highlight.trim()) {
    return <span>{strText}</span>;
  }

  // Escape special regex characters in the query to prevent crashing
  const escapedQuery = highlight.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
  const regex = new RegExp(`(${escapedQuery})`, 'gi');
  const parts = strText.split(regex);

  return (
    <span>
      {parts.map((part, i) =>
        part.toLowerCase() === highlight.toLowerCase() ? (
          <mark key={i} className="highlight-search">{part}</mark>
        ) : (
          part
        )
      )}
    </span>
  );
};

export default HighlightText;
