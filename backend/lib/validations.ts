import { z } from 'zod';

const instagramUsernameRegex = /^[a-zA-Z0-9._]{1,30}$/;

export const createOrderSchema = z.object({
  packageId: z.string().uuid({ message: 'ID Paket tidak valid.' }),
  customerName: z.string().min(2, { message: 'Nama harus minimal 2 karakter.' }).max(100),
  customerEmail: z.string().email({ message: 'Email tidak valid.' }),
  instagramUsername: z
    .string()
    .min(1, { message: 'Username Instagram wajib diisi.' })
    .max(30, { message: 'Username maksimal 30 karakter.' })
    .transform((val) => val.replace(/^@+/, '').trim().toLowerCase())
    .refine((val) => instagramUsernameRegex.test(val), {
      message: 'Format username Instagram tidak valid (gunakan huruf, angka, titik, underscore).',
    }),
  paymentMethod: z.string().default('xendit'),
  customerNote: z.string().max(500).optional().nullable(),
  userId: z.string().uuid().optional().nullable(),
});

export const updateOrderStatusSchema = z.object({
  paymentStatus: z
    .string()
    .transform((val) => val.toUpperCase())
    .pipe(z.enum(['PENDING_PAYMENT', 'PAID', 'FAILED', 'EXPIRED', 'REFUNDED', 'PENDING']))
    .transform((val) => (val === 'PENDING' ? 'PENDING_PAYMENT' : val))
    .optional(),
  serviceStatus: z
    .string()
    .transform((val) => val.toUpperCase())
    .pipe(
      z.enum([
        'PENDING_PAYMENT',
        'PAID',
        'WAITING_FOR_FULFILLMENT',
        'PROCESSING',
        'PARTIALLY_COMPLETED',
        'COMPLETED',
        'CANCELLED',
        'FAILED',
        'ADMIN_APPROVED',
        'PENDING',
      ])
    )
    .transform((val) => (val === 'PENDING' ? 'PENDING_PAYMENT' : val))
    .optional(),
  adminNote: z.string().max(1000).optional().nullable(),
});

export const packageCategoryEnum = z.enum(['INDONESIA', 'INTERNATIONAL', 'PROMOTION_PAID', 'PROMOTION_FREE']);

export const packageSchema = z.object({
  name: z.string().min(2, { message: 'Nama paket minimal 2 karakter.' }),
  category: packageCategoryEnum.default('INDONESIA'),
  followers: z.number().int().positive({ message: 'Jumlah followers harus lebih dari 0.' }),
  price: z.number().nonnegative({ message: 'Harga tidak boleh negatif.' }),
  description: z.string().optional().nullable(),
  estimatedProcessingMinutes: z.number().int().positive().default(5),
  estimatedTime: z.string().min(1, { message: 'Estimasi waktu wajib diisi.' }).default('1–5 Menit'),
  badge: z.string().optional().nullable(),
  providerServiceId: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
});

export const freeOrderSchema = z.object({
  packageId: z.string().uuid({ message: 'ID Paket tidak valid.' }),
  instagramUsername: z
    .string()
    .min(1, { message: 'Username Instagram wajib diisi.' })
    .max(30, { message: 'Username maksimal 30 karakter.' })
    .transform((val) => val.replace(/^@+/, '').trim().toLowerCase())
    .refine((val) => instagramUsernameRegex.test(val), {
      message: 'Format username Instagram tidak valid.',
    }),
  customerName: z.string().min(2).default('Admin Internal Promotion'),
  customerEmail: z.string().email().default('admin@portalfollowers.com'),
  adminReason: z.string().min(3, { message: 'Alasan order gratis wajib diisi.' }),
  adminNote: z.string().optional().nullable(),
});
