import { z } from 'zod';

export const RestrictionPhaseCodeSchema = z.enum([
  'THREE_DAYS_BEFORE',
  'DAY_BEFORE',
  'ABSOLUTE_FASTING',
]);

export const RestrictionCategorySchema = z.enum([
  'FOOD',
  'MEDICATION',
  'ACTIVITY',
  'PREPARATION',
]);

export const RestrictionResultTypeSchema = z.enum([
  'DO_NOT_PROVIDE',
  'CHECK_BEFORE_PROVIDING',
]);

export const RestrictionSourceSchema = z.object({
  title: z.string().trim().min(1),
  url: z.url(),
  checkedAt: z.iso.date(),
  dataVersion: z.string().trim().min(1),
});

export const RestrictionPhaseSchema = z.object({
  code: RestrictionPhaseCodeSchema,
  label: z.string().trim().min(1),
  effectiveText: z.string().trim().min(1),
});

export const RestrictionItemSchema = z.object({
  id: z.string().trim().min(1),
  category: RestrictionCategorySchema,
  itemName: z.string().trim().min(1),
  resultType: RestrictionResultTypeSchema,
  reason: z.string().trim().min(1),
  effectiveText: z.string().trim().min(1),
});

export const RestrictionGuidanceSchema = z.object({
  scenarioId: z.literal('morning-colonoscopy'),
  phase: RestrictionPhaseSchema,
  headline: z.string().trim().min(1),
  items: z.array(RestrictionItemSchema),
  source: RestrictionSourceSchema,
});

export const RestrictionGuidanceResponseSchema = z.object({
  guidance: RestrictionGuidanceSchema,
});

export const RestrictionSearchResultSchema = z.object({
  query: z.string().trim().min(1),
  normalizedQuery: z.string().trim().min(1),
  resultType: RestrictionResultTypeSchema,
  headline: z.string().trim().min(1),
  reason: z.string().trim().min(1),
  effectiveText: z.string().trim().min(1),
  matchedRuleId: z.string().trim().min(1).nullable(),
  source: RestrictionSourceSchema,
});

export const RestrictionSearchResponseSchema = z.object({
  result: RestrictionSearchResultSchema,
});

export const SavedQuestionStatusSchema = z.enum(['OPEN', 'DONE']);

export const SavedQuestionSchema = z.object({
  id: z.string().trim().min(1),
  query: z.string().trim().min(1),
  questionText: z.string().trim().min(1),
  reason: z.string().trim().min(1),
  status: SavedQuestionStatusSchema,
  createdAt: z.iso.datetime(),
  completedAt: z.iso.datetime().nullable(),
});

export const SavedQuestionResponseSchema = z.object({
  question: SavedQuestionSchema,
});

export const SavedQuestionListResponseSchema = z.object({
  questions: z.array(SavedQuestionSchema),
});

export const CreateSavedQuestionSchema = z.object({
  query: z.string().trim().min(1).max(80),
});

export type RestrictionPhaseCode = z.infer<
  typeof RestrictionPhaseCodeSchema
>;
export type RestrictionCategory = z.infer<
  typeof RestrictionCategorySchema
>;
export type RestrictionGuidance = z.infer<
  typeof RestrictionGuidanceSchema
>;
export type RestrictionSearchResult = z.infer<
  typeof RestrictionSearchResultSchema
>;
export type SavedQuestion = z.infer<typeof SavedQuestionSchema>;
