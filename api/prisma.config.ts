import { defineConfig } from 'prisma/config';

try {
  process.loadEnvFile('../.env');
} catch {
  // якщо файлу нема працюємо на тому що вже є в оточенні
}

export default defineConfig({
  schema: 'src/db/schema.prisma',
  migrations: {
    path: 'src/db/migrations',
  },
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
