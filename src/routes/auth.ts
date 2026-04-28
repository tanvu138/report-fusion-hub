import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validation/validate';

const router = Router();

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

router.post('/signup', validate(signupSchema), (req, res) => {
  res.json(req.body);
});

export default router;
