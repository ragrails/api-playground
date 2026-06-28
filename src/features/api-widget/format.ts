export function formatJsonIfPossible(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return value;

  try {
    return JSON.stringify(JSON.parse(trimmed), null, 2);
  } catch {
    return value;
  }
}
