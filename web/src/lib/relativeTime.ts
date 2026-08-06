// менше хвилини / 40 хв / 2 год / 3 дн
export function humanizeDuration(ms: number): string {
  if (ms < 60_000) return 'менше хвилини';
  const minutes = Math.round(ms / 60_000);
  if (minutes < 60) return `${minutes} хв`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} год`;
  return `${Math.round(hours / 24)} дн`;
}
