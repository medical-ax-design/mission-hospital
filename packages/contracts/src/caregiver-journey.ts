import { z } from 'zod';

export const DemoScenarioIdSchema = z.enum([
  'gastric-surgery',
  'morning-colonoscopy',
]);

export const TreatmentStageSchema = z.enum([
  'PREPARING',
  'IN_OPERATING_ROOM',
  'IN_PROGRESS',
  'RECOVERY',
  'COMPLETED',
]);

export const CaregiverTaskStatusSchema = z.enum([
  'AVAILABLE',
  'IN_PROGRESS',
  'COMPLETED',
]);

const PatientSchema = z.object({
  id: z.string().min(1),
  displayName: z.string().trim().min(1),
  age: z.number().int().positive(),
  procedureName: z.string().trim().min(1),
  scheduledAt: z.iso.datetime(),
});

const CaregiverSchema = z.object({
  displayName: z.string().trim().min(1),
  relationship: z.string().trim().min(1),
});

const TreatmentProgressSchema = z.object({
  stage: TreatmentStageSchema,
  label: z.string().trim().min(1),
  updatedAt: z.iso.datetime().nullable(),
  nextNotice: z.string().trim().min(1),
});

const CaregiverTaskSchema = z.object({
  id: z.string().min(1),
  title: z.string().trim().min(1),
  status: CaregiverTaskStatusSchema,
  estimatedMinutes: z.number().int().positive(),
  requiredItems: z.array(z.string().trim().min(1)).min(1),
});

const PurposeGuideSchema = z.object({
  currentLocation: z.string().trim().min(1),
  destination: z.string().trim().min(1),
  estimatedTravelMinutes: z.number().int().positive(),
  ticketRequired: z.boolean(),
  steps: z.array(z.string().trim().min(1)).min(1),
  fallback: z.string().trim().min(1),
});

const ClinicalSummarySchema = z.discriminatedUnion('status', [
  z.object({
    status: z.literal('UNAVAILABLE'),
  }),
  z.object({
    status: z.literal('CONFIRMED'),
    confirmedAt: z.iso.datetime(),
    currentStatus: z.string().trim().min(1),
    items: z.array(z.string().trim().min(1)).min(1),
    nextSchedule: z.string().trim().min(1),
  }),
]);

export const CaregiverJourneySchema = z.object({
  id: z.string().min(1),
  scenarioId: DemoScenarioIdSchema,
  linked: z.boolean(),
  patient: PatientSchema,
  caregiver: CaregiverSchema,
  treatment: TreatmentProgressSchema,
  task: CaregiverTaskSchema.nullable(),
  guide: PurposeGuideSchema.nullable(),
  summary: ClinicalSummarySchema,
});

export const CaregiverJourneyResponseSchema = z.object({
  journey: CaregiverJourneySchema,
});

export type TreatmentStage = z.infer<typeof TreatmentStageSchema>;
export type DemoScenarioId = z.infer<typeof DemoScenarioIdSchema>;
export type CaregiverTaskStatus = z.infer<typeof CaregiverTaskStatusSchema>;
export type CaregiverJourney = z.infer<typeof CaregiverJourneySchema>;
export type CaregiverJourneyResponse = z.infer<
  typeof CaregiverJourneyResponseSchema
>;
