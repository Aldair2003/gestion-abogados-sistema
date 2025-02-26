import { Router } from 'express';
import { login, register, forgotPassword, resetPassword } from '../controllers/userController';

const router = Router();

router.post('/login', login);
router.post('/register', register);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

export default router; 