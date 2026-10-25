/** API boolean과 DB의 0/1을 명시적으로 해석해 문자열 '0'도 false로 유지한다. */
export function isProjectFlagEnabled(value: unknown): boolean {
  return value === true || value === 1 || value === "1" || value === "true";
}
