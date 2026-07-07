// Dark palette
const DARK = {
  key:  '#c9956a',   // warm brown — clear on dark bg
  str:  '#4ec5d4',   // light teal — string values on dark bg
  num:  '#b5cea8',   // soft green for numbers
  bool: '#569cd6',
  nil:  '#808080',
};

// Light palette — cool blue/teal family, matches screenshot aesthetic
const LIGHT = {
  key:  '#8b5e3c',   // warm brown — JSON keys on white
  str:  '#1a8499',   // teal-blue — string values on white
  num:  '#2d6e58',   // dark teal-green for numbers
  bool: '#5e4898',   // muted purple for booleans
  nil:  '#9ca3af',   // grey for null
};

function applyHighlight(escaped: string, C: typeof DARK): string {
  return escaped.replace(
    /("(?:\\.|[^"\\])*"\s*:?)|(\btrue\b|\bfalse\b|\bnull\b)|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/g,
    (m, strMatch: string | undefined, boolNull: string | undefined, num: string | undefined) => {
      if (strMatch) {
        if (strMatch.trimEnd().endsWith(':'))
          return `<span style="color:${C.key}">${strMatch.slice(0, -1)}</span>:`;
        return `<span style="color:${C.str}">${strMatch}</span>`;
      }
      if (boolNull) {
        const color = boolNull === 'null' ? C.nil : C.bool;
        return `<span style="color:${color};font-style:italic">${boolNull}</span>`;
      }
      if (num) return `<span style="color:${C.num}">${num}</span>`;
      return m;
    },
  );
}

function escape(raw: string): string {
  return raw.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** Dark palette — for output/read-only blocks (JsonViewer). */
export function highlightJson(raw: string): string {
  if (!raw) return '';
  return applyHighlight(escape(raw), DARK);
}

/** Light palette — for editable input editors (JsonEditor). */
export function highlightJsonLight(raw: string): string {
  if (!raw) return '';
  return applyHighlight(escape(raw), LIGHT);
}
