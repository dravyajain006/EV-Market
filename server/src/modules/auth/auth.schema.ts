import { z } from 'zod';

const emailValidator = z
  .string()
  .refine((val) => /^[^\s@]+@[^\s@]+$/.test(val), {
    message: 'Valid institutional or corporate email required',
  });

export const loginSchema = z.object({
  email: emailValidator,
  password: z.string().min(6, 'Password must be at least 6 characters long'),
});

export const registerSchema = z.object({
  email: emailValidator,
  password: z.string().min(8, 'Password must contain at least 8 characters'),
  fullName: z.string().min(2, 'Full name must contain at least 2 characters'),
  role: z.enum(['ADMIN', 'ANALYST', 'VIEWER']).default('VIEWER'),
  department: z.string().optional(),
});

export const updateProfileSchema = z.object({
  fullName: z.string().min(2).optional(),
  department: z.string().optional(),
});
