export function calcPnl(side: string, mark: number, entry: number, size: number): number {
  if (isNaN(mark) || isNaN(entry) || isNaN(size)) return 0;
  return side === 'long' ? (mark - entry) * size : (entry - mark) * size;
}
