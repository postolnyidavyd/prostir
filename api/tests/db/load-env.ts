
try {
  process.loadEnvFile('../.env');
} catch {
  // змінні вже в оточенні
}

process.env.NODE_ENV = 'test';
