import React from 'react';

export type CodeLanguage = 'json' | 'bash' | 'javascript' | 'python' | 'go' | 'plain';

type TokenType =
  | 'comment'
  | 'property'
  | 'string'
  | 'number'
  | 'boolean'
  | 'keyword'
  | 'function'
  | 'builtin'
  | 'operator'
  | 'punctuation'
  | 'variable';

interface TokenPattern {
  type: TokenType;
  pattern: RegExp;
}

const jsonPatterns: TokenPattern[] = [
  { type: 'property', pattern: /"(?:\\.|[^"\\])*"(?=\s*:)/y },
  { type: 'string', pattern: /"(?:\\.|[^"\\])*"/y },
  { type: 'number', pattern: /-?\b\d+(?:\.\d+)?(?:e[+-]?\d+)?\b/iy },
  { type: 'boolean', pattern: /\b(?:true|false)\b/y },
  { type: 'keyword', pattern: /\bnull\b/y },
  { type: 'operator', pattern: /:/y },
  { type: 'punctuation', pattern: /[{}[\],]/y },
];

const bashPatterns: TokenPattern[] = [
  { type: 'comment', pattern: /#.*/y },
  { type: 'string', pattern: /'(?:[^']*)'|"(?:\\.|[^"\\])*"/y },
  { type: 'function', pattern: /\b(?:curl|wget|fetch|http|httpie)\b/y },
  { type: 'variable', pattern: /\$[A-Za-z_][\w]*|\$\{[^}]+\}/y },
  { type: 'keyword', pattern: /\b(?:if|then|else|fi|for|do|done|while|case|esac)\b/y },
  { type: 'number', pattern: /\b\d+(?:\.\d+)?\b/y },
  { type: 'operator', pattern: /&&|\|\||[|&;=<>]/y },
  { type: 'punctuation', pattern: /\\|[()[\]{}]/y },
  { type: 'builtin', pattern: /-{1,2}[A-Za-z][\w-]*/y },
];

const javascriptPatterns: TokenPattern[] = [
  { type: 'comment', pattern: /\/\/.*|\/\*.*?\*\//y },
  { type: 'string', pattern: /'(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*"|`(?:\\.|[^`\\])*`/y },
  {
    type: 'keyword',
    pattern:
      /\b(?:await|async|const|let|var|return|if|else|for|while|try|catch|throw|new|import|export|from|function|class)\b/y,
  },
  { type: 'boolean', pattern: /\b(?:true|false|null|undefined)\b/y },
  { type: 'function', pattern: /\b[A-Za-z_$][\w$]*(?=\s*\()/y },
  { type: 'number', pattern: /\b\d+(?:\.\d+)?\b/y },
  { type: 'operator', pattern: /=>|===|!==|==|!=|<=|>=|\+\+|--|&&|\|\||[+\-*/%=<>!?:]/y },
  { type: 'punctuation', pattern: /[()[\]{}.,;]/y },
];

const pythonPatterns: TokenPattern[] = [
  { type: 'comment', pattern: /#.*/y },
  { type: 'string', pattern: /'''[\s\S]*?'''|"""[\s\S]*?"""|'(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*"/y },
  {
    type: 'keyword',
    pattern:
      /\b(?:import|from|as|def|class|return|if|elif|else|for|while|try|except|with|lambda|pass|None|True|False|and|or|not|in|is)\b/y,
  },
  { type: 'function', pattern: /\b[A-Za-z_]\w*(?=\s*\()/y },
  { type: 'number', pattern: /\b\d+(?:\.\d+)?\b/y },
  { type: 'operator', pattern: /==|!=|<=|>=|:=|[+\-*/%=<>]/y },
  { type: 'punctuation', pattern: /[()[\]{}.,:;]/y },
];

const goPatterns: TokenPattern[] = [
  { type: 'comment', pattern: /\/\/.*|\/\*.*?\*\//y },
  { type: 'string', pattern: /`[^`]*`|'(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*"/y },
  {
    type: 'keyword',
    pattern:
      /\b(?:package|import|func|var|const|type|struct|interface|return|if|else|for|range|go|defer|select|case|switch|default|nil|true|false)\b/y,
  },
  {
    type: 'builtin',
    pattern:
      /\b(?:append|bool|byte|cap|close|complex64|complex128|copy|delete|error|float32|float64|int|int8|int16|int32|int64|len|make|new|panic|print|println|real|recover|rune|string|uint|uint8|uint16|uint32|uint64|uintptr)\b/y,
  },
  { type: 'function', pattern: /\b[A-Za-z_]\w*(?=\s*\()/y },
  { type: 'number', pattern: /\b\d+(?:\.\d+)?\b/y },
  { type: 'operator', pattern: /:=|==|!=|<=|>=|\+\+|--|&&|\|\||[+\-*/%=<>!&|]/y },
  { type: 'punctuation', pattern: /[()[\]{}.,;:]/y },
];

const languagePatterns: Record<Exclude<CodeLanguage, 'plain'>, TokenPattern[]> = {
  json: jsonPatterns,
  bash: bashPatterns,
  javascript: javascriptPatterns,
  python: pythonPatterns,
  go: goPatterns,
};

function readToken(line: string, start: number, patterns: TokenPattern[]) {
  for (const token of patterns) {
    token.pattern.lastIndex = start;
    const match = token.pattern.exec(line);
    if (match?.index === start && match[0]) {
      return {
        type: token.type,
        value: match[0],
      };
    }
  }
  return null;
}

/** Tokenize a single line into themed React nodes. */
export function highlightLine(line: string, language: CodeLanguage): React.ReactNode {
  if (language === 'plain' || !line) return line;

  const patterns = languagePatterns[language];
  const nodes: React.ReactNode[] = [];
  let buffer = '';
  let cursor = 0;
  let key = 0;

  while (cursor < line.length) {
    const token = readToken(line, cursor, patterns);

    if (!token) {
      buffer += line[cursor];
      cursor += 1;
      continue;
    }

    if (buffer) {
      nodes.push(buffer);
      buffer = '';
    }

    nodes.push(
      <span key={key} className={`token ${token.type}`}>
        {token.value}
      </span>,
    );
    key += 1;
    cursor += token.value.length;
  }

  if (buffer) nodes.push(buffer);
  return nodes;
}
