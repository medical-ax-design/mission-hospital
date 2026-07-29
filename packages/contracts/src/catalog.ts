import { z } from 'zod';

const optionalCodeSchema = z
  .string()
  .transform((value) => value.trim())
  .transform((value) => (value.length === 0 ? null : value))
  .nullable()
  .optional()
  .default(null);

export const createProcedureSchema = z.object({
  procedureType: z.enum(['EXAM', 'SURGERY']),
  name: z.string().trim().min(1).max(120),
  externalCode: optionalCodeSchema,
  department: z.string().trim().min(1).max(120),
  description: z.string().trim().max(500).nullable().optional().default(null),
});

export const procedureSchema = createProcedureSchema.extend({
  id: z.string().uuid(),
  isActive: z.boolean(),
  rowVersion: z.number().int().positive(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export type CreateProcedureInput = z.infer<typeof createProcedureSchema>;
export type Procedure = z.infer<typeof procedureSchema>;
