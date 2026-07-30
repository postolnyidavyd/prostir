#збірка
FROM node:24-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
# --ignore-scripts щоб не виконувався postinstall який кличе prisma generate
RUN npm ci --ignore-scripts

COPY tsconfig.json tsconfig.build.json prisma.config.ts ./
COPY src ./src

RUN npx prisma generate
RUN npm run build

# рантайм
FROM node:24-alpine
WORKDIR /app

# можна перевизначити через compose
ENV NODE_ENV=production

# schema-engine prisma потребує openssl
RUN apk add --no-cache openssl

COPY package.json package-lock.json ./
# --ignore-scripts заглушив postinstall, але заодно глушить й завантаження schema-engine
# тягнемо його окремо
RUN npm ci --omit=dev --ignore-scripts \
 && npm rebuild @prisma/engines \
 && npm cache clean --force


COPY prisma.config.ts ./
COPY src/db/schema.prisma ./src/db/schema.prisma
COPY src/db/migrations ./src/db/migrations


COPY --from=build /app/dist ./dist

USER node

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/db/seed/seed.js && exec node dist/index.js"]
