import request from 'supertest';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';

import { app } from '../../src/app.js';
import { prisma } from '../../src/db/client.js';

const EMAIL = 'auth-test@gmail.com';
const OTHER_EMAIL = 'auth-test-2@gmail.com';
const PASSWORD = 'parol12345';

const credentials = {
  email: EMAIL,
  password: PASSWORD,
  firstName: 'Тест',
  lastName: 'Автентифікації',
};

function refreshCookie(headers: Record<string, unknown>): string {
  const cookies = headers['set-cookie'];

  return Array.isArray(cookies) ? (cookies.find((c) => c.startsWith('refreshToken=')) ?? '') : '';
}

async function registerUser(overrides: Partial<typeof credentials> = {}) {
  const response = await request(app)
    .post('/auth/register')
    .send({ ...credentials, ...overrides });

  return { accessToken: response.body.accessToken as string, cookie: refreshCookie(response.headers) };
}

beforeEach(async () => {
  await prisma.user.deleteMany({ where: { email: { in: [EMAIL, OTHER_EMAIL] } } });
});

afterAll(async () => {
  await prisma.user.deleteMany({ where: { email: { in: [EMAIL, OTHER_EMAIL] } } });
  await prisma.$disconnect();
});

describe('POST /auth/register', () => {
  it('створює користувача і одразу видає сесію', async () => {
    const response = await request(app).post('/auth/register').send(credentials);

    expect(response.status).toBe(201);
    expect(response.body.user).toMatchObject({ email: EMAIL, firstName: 'Тест' });
    expect(response.body.accessToken).toBeTruthy();
    expect(refreshCookie(response.headers)).toContain('HttpOnly');
  });

  it('ніколи не віддає хеш пароля', async () => {
    const response = await request(app).post('/auth/register').send(credentials);

    expect(JSON.stringify(response.body)).not.toContain('passwordHash');
  });

  it('нормалізація email', async () => {
    await request(app).post('/auth/register').send(credentials);
    const response = await request(app)
      .post('/auth/register')
      .send({ ...credentials, email: '  Auth-Test@Gmail.COM  ' });

    expect(response.status).toBe(409);
  });

  it('коротий пароль і порожнє ім’я дають 400 з полями', async () => {
    const response = await request(app)
      .post('/auth/register')
      .send({ ...credentials, password: '123', firstName: '   ' });

    expect(response.status).toBe(400);
    expect(Object.keys(response.body.errors)).toEqual(['password', 'firstName']);
  });
});

describe('POST /auth/login', () => {
  it('невірний пароль - 401 без підказки', async () => {
    await registerUser();
    const response = await request(app).post('/auth/login').send({ email: EMAIL, password: 'another123' });

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Невірний email або пароль');
  });

  it('неіснуючий email дає той самий текст', async () => {
    const response = await request(app)
      .post('/auth/login')
      .send({ email: 'nikoho@prostir.local', password: PASSWORD });

    expect(response.body.message).toBe('Невірний email або пароль');
  });

  it('вірні реквізити - 200 і нова сесія', async () => {
    await registerUser();
    const response = await request(app).post('/auth/login').send({ email: EMAIL, password: PASSWORD });

    expect(response.status).toBe(200);
    expect(refreshCookie(response.headers)).toBeTruthy();
  });
});

describe('GET /auth/me', () => {
  it('без токена 401', async () => {
    const response = await request(app).get('/auth/me');

    expect(response.status).toBe(401);
  });

  it('з битим токеном 401', async () => {
    const response = await request(app).get('/auth/me').set('Authorization', 'Bearer not-a-jwt');

    expect(response.status).toBe(401);
  });

  it('з токеном свіжі дані з бази', async () => {
    const { accessToken } = await registerUser();
    const response = await request(app).get('/auth/me').set('Authorization', `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body.user.email).toBe(EMAIL);
  });
});

describe('POST /auth/refresh', () => {
  it('видає новий access і новий refresh', async () => {
    const { cookie } = await registerUser();
    const response = await request(app).post('/auth/refresh').set('Cookie', cookie);

    expect(response.status).toBe(200);
    expect(response.body.accessToken).toBeTruthy();
    expect(refreshCookie(response.headers)).not.toBe(cookie);
  });

  it('без cookie 401', async () => {
    const response = await request(app).post('/auth/refresh');

    expect(response.status).toBe(401);
  });

  it('використаний токен більше не приймається', async () => {
    const { cookie } = await registerUser();
    await request(app).post('/auth/refresh').set('Cookie', cookie);

    const response = await request(app).post('/auth/refresh').set('Cookie', cookie);

    expect(response.status).toBe(401);
  });

  it('повторне використання старого токена вбиває всю сесію', async () => {
    const { cookie } = await registerUser();
    const rotated = await request(app).post('/auth/refresh').set('Cookie', cookie);
    const freshCookie = refreshCookie(rotated.headers);

    await request(app).post('/auth/refresh').set('Cookie', cookie);
    const response = await request(app).post('/auth/refresh').set('Cookie', freshCookie);

    expect(response.status).toBe(401);
  });
});

describe('POST /auth/logout', () => {
  it('відкликає сесію, повторний refresh не проходить', async () => {
    const { cookie } = await registerUser();

    const logout = await request(app).post('/auth/logout').set('Cookie', cookie);
    const response = await request(app).post('/auth/refresh').set('Cookie', cookie);

    expect(logout.status).toBe(204);
    expect(response.status).toBe(401);
  });

  it('відкликає всі сесії користувача, а не лише поточну', async () => {
    await registerUser();
    const first = await request(app).post('/auth/login').send({ email: EMAIL, password: PASSWORD });
    const second = await request(app).post('/auth/login').send({ email: EMAIL, password: PASSWORD });

    await request(app).post('/auth/logout').set('Cookie', refreshCookie(second.headers));
    const response = await request(app).post('/auth/refresh').set('Cookie', refreshCookie(first.headers));

    expect(response.status).toBe(401);
  });

  it('без cookie теж 204', async () => {
    const response = await request(app).post('/auth/logout');

    expect(response.status).toBe(204);
  });
});

describe('PATCH /auth/me', () => {
  it('без токена 401', async () => {
    const response = await request(app)
      .patch('/auth/me')
      .send({ email: EMAIL, firstName: 'A', lastName: 'B' });

    expect(response.status).toBe(401);
  });

  it('оновлює дані, нормалізує email, getMe віддає нові', async () => {
    const { accessToken } = await registerUser();

    const response = await request(app)
      .patch('/auth/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ email: '  Auth-Test-2@Gmail.COM ', firstName: 'Нове', lastName: 'Прізвище' });

    expect(response.status).toBe(200);
    expect(response.body.user).toMatchObject({
      email: OTHER_EMAIL,
      firstName: 'Нове',
      lastName: 'Прізвище',
    });

    const me = await request(app).get('/auth/me').set('Authorization', `Bearer ${accessToken}`);
    expect(me.body.user.email).toBe(OTHER_EMAIL);
  });

  it('email зайнятий іншим - 400 з полем email', async () => {
    await registerUser();
    const other = await registerUser({ email: OTHER_EMAIL });

    const response = await request(app)
      .patch('/auth/me')
      .set('Authorization', `Bearer ${other.accessToken}`)
      .send({ email: EMAIL, firstName: 'Тест', lastName: 'Автентифікації' });

    expect(response.status).toBe(400);
    expect(response.body.errors.email).toBeTruthy();
  });

  it('порожнє ім’я - 400 з полем', async () => {
    const { accessToken } = await registerUser();

    const response = await request(app)
      .patch('/auth/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ email: EMAIL, firstName: '   ', lastName: 'Прізвище' });

    expect(response.status).toBe(400);
    expect(response.body.errors.firstName).toBeTruthy();
  });
});

describe('PATCH /auth/me/password', () => {
  it('без токена 401', async () => {
    const response = await request(app)
      .patch('/auth/me/password')
      .send({ currentPassword: PASSWORD, newPassword: 'newparol123' });

    expect(response.status).toBe(401);
  });

  it('невірний поточний - 400 з полем', async () => {
    const { accessToken } = await registerUser();

    const response = await request(app)
      .patch('/auth/me/password')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ currentPassword: 'wrongpass1', newPassword: 'newparol123' });

    expect(response.status).toBe(400);
    expect(response.body.errors.currentPassword).toBeTruthy();
  });

  it('слабкий новий - 400 з полем', async () => {
    const { accessToken } = await registerUser();

    const response = await request(app)
      .patch('/auth/me/password')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ currentPassword: PASSWORD, newPassword: '123' });

    expect(response.status).toBe(400);
    expect(response.body.errors.newPassword).toBeTruthy();
  });

  it('новий = поточний - 400 з полем', async () => {
    const { accessToken } = await registerUser();

    const response = await request(app)
      .patch('/auth/me/password')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ currentPassword: PASSWORD, newPassword: PASSWORD });

    expect(response.status).toBe(400);
    expect(response.body.errors.newPassword).toBeTruthy();
  });

  it('успіх: новий пароль працює, старий ні, інші сесії розлоговані', async () => {
    const { accessToken, cookie } = await registerUser();

    const changed = await request(app)
      .patch('/auth/me/password')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ currentPassword: PASSWORD, newPassword: 'newparol123' });

    expect(changed.status).toBe(200);
    expect(changed.body.accessToken).toBeTruthy();

    // стара refresh-сесія розлогована
    const oldRefresh = await request(app).post('/auth/refresh').set('Cookie', cookie);
    expect(oldRefresh.status).toBe(401);

    // старим паролем не зайти, новим - можна
    const oldLogin = await request(app)
      .post('/auth/login')
      .send({ email: EMAIL, password: PASSWORD });
    expect(oldLogin.status).toBe(401);

    const newLogin = await request(app)
      .post('/auth/login')
      .send({ email: EMAIL, password: 'newparol123' });
    expect(newLogin.status).toBe(200);
  });
});
