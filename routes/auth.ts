import express from 'express';
import {
  loginUser,
  logoutUser,
  refreshAccessToken,
  registerNewUser,
} from '../controllers/index.ts';
import { authenticate } from '../middlewares/authenticate.ts';

const router = express.Router();

router.post('/register', registerNewUser);

router.post('/login', loginUser);

router.post('/refresh-access-token', refreshAccessToken);

// protected route
router.post('/logout', authenticate, logoutUser);

export default router;
