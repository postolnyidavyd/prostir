# Простір — бронювання переговорних

Внутрішній веб-застосунок для бронювання переговорних кімнат: тижневий розклад,
вільні/зайняті слоти, скасування власних бронювань.

## Стек

- **web/** — React + Vite + TypeScript + styled-components
- **api/** — Express + TypeScript + Prisma
- **БД** — PostgreSQL (у Docker)

## Запуск

```bash
cp .env.example .env      # локальні дефолти вже підставлені
docker compose up         # web + api + postgres
```

## Сіди

Застосовуються автоматично при старті api через docker compose. Повторно вручну:

```bash
docker compose exec api npm run seed:dist
```

Сіди ідемпотентні: кімнати й користувачі оновлюються, бронювання наповнюють лише
порожню таблицю (щоб повторний запуск не плодив дублі на нових датах).

## Тестові користувачі

Пароль у всіх однаковий — `1q2w3e4r`.

| Email | Ім'я |
|-------|------|
| `ivan.petrenko@gmail.com` | Іван Петренко |
| `olena.kovalchuk@gmail.com` | Олена Ковальчук |
| `taras.shevchenko@gmail.com` | Тарас Шевченко |

