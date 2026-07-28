export type Interval = {
  startsAt: Date;
  endsAt: Date;
};

// Правило задане [) в Exclude констресйті записане кодом

// Під час запису цієї функції немає і використовувати не можна - перевірка перед вставкою
// не рятує від гонки, неперетинність гарантує EXCLUDE констрейнт в бд

// Функція існує заради вимоги ТЗ - юніт-тести мають проходити по `npm test`, тобто без піднятої БД
// Перевірка чи ця ф-ія й констрейнт дають однакові результати на тих самих кейсах було проведено
export function intervalsOverlap(a: Interval, b: Interval): boolean {
  return a.startsAt < b.endsAt && b.startsAt < a.endsAt;
}
