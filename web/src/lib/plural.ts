// множина: [одна, дві-чотири, п'ять+
function plural(n: number, forms: [string, string, string]): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return forms[0];
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return forms[1];
  return forms[2];
}

export const roomsWord = (n: number) => plural(n, ['кімната', 'кімнати', 'кімнат']);
export const freeWord = (n: number) => plural(n, ['вільна', 'вільні', 'вільних']);
export const peopleWord = (n: number) => plural(n, ['людина', 'людини', 'людей']);
