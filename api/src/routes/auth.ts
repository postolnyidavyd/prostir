import { Router } from 'express';

import * as authController from '../controllers/auth.js';
import { authGuard } from '../middleware/auth-guard.js';
import { validate } from '../middleware/validate.js';
import { loginSchema, registerSchema } from '../schemas/auth.js';

export const authRouter = Router();

authRouter.post('/register', validate({ body: registerSchema }), authController.register);
authRouter.post('/login', validate({ body: loginSchema }), authController.login);
authRouter.post('/refresh', authController.refresh);
authRouter.post('/logout', authController.logout);
authRouter.get('/me', authGuard, authController.me);
