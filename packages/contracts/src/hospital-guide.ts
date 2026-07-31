import { z } from 'zod';

export const GuideBuildingIdSchema = z.enum([
  'MAIN',
  'ANNEX',
  'CANCER',
  'PROTON',
]);

export const GuideSourceStatusSchema = z.enum([
  'HOSPITAL_VERIFIED',
  'OFFICIAL_PUBLIC',
  'DEMO',
  'UNKNOWN',
]);

export const RouteStatusSchema = z.enum([
  'VERIFIED',
  'MAP_ONLY',
  'UNAVAILABLE',
]);

export const GuidePlaceSchema = z
  .object({
    id: z.string().trim().min(1),
    officialNumber: z.string().trim().min(1).nullable(),
    officialName: z.string().trim().min(1),
    aliases: z.array(z.string().trim().min(1)),
    mapX: z.number().min(0).max(100).nullable(),
    mapY: z.number().min(0).max(100).nullable(),
    sourceStatus: GuideSourceStatusSchema,
  })
  .superRefine((place, context) => {
    if ((place.mapX === null) !== (place.mapY === null)) {
      context.addIssue({
        code: 'custom',
        message: '지도 좌표는 x와 y를 함께 제공해야 합니다.',
      });
    }
  });

export const GuideFloorSchema = z.object({
  code: z.string().regex(/^(B[1-9]|[1-9][0-9]*)F$/),
  level: z.number().int(),
  label: z.string().trim().min(1),
  mapImageUrl: z.url().nullable(),
  sourceUrl: z.url(),
  sourceCheckedAt: z.iso.date(),
  publicationStatus: z.literal('PUBLIC'),
  places: z.array(GuidePlaceSchema),
});

export const GuideBuildingSchema = z.object({
  id: GuideBuildingIdSchema,
  name: z.string().trim().min(1),
  sourceUrl: z.url(),
  floors: z.array(GuideFloorSchema).min(1),
});

export const ServiceChannelSchema = z.enum([
  'ONLINE',
  'MOBILE',
  'ONSITE',
]);

export const HospitalGuidePurposeSchema = z.object({
  id: z.string().trim().min(1),
  category: z.literal('DOCUMENT'),
  name: z.string().trim().min(1),
  searchTerms: z.array(z.string().trim().min(1)).min(1),
  options: z
    .array(
      z.object({
        id: z.string().trim().min(1),
        channel: ServiceChannelSchema,
        placeId: z.string().trim().min(1).nullable(),
        title: z.string().trim().min(1),
        requiredItems: z.array(z.string().trim().min(1)),
        orderedSteps: z.array(z.string().trim().min(1)).min(1),
        sourceUrl: z.url(),
        sourceStatus: GuideSourceStatusSchema,
      }),
    )
    .min(1),
});

export const HospitalGuideCatalogSchema = z.object({
  checkedAt: z.iso.date(),
  buildings: z.array(GuideBuildingSchema).length(4),
  purposes: z.array(HospitalGuidePurposeSchema),
});

export const HospitalGuideCatalogResponseSchema = z.object({
  catalog: HospitalGuideCatalogSchema,
});

export const HospitalGuidePurposeResultSchema = z.object({
  purpose: HospitalGuidePurposeSchema,
  places: z.array(
    z.object({
      buildingId: GuideBuildingIdSchema,
      floorCode: z.string().trim().min(1),
      place: GuidePlaceSchema,
    }),
  ),
});

export const HospitalGuidePurposeResponseSchema = z.object({
  result: HospitalGuidePurposeResultSchema,
});

const RoutePointSchema = z.tuple([
  z.number().min(0).max(100),
  z.number().min(0).max(100),
]);

export const WalkRouteSegmentSchema = z.object({
  kind: z.literal('WALK'),
  floorKey: z.string().trim().min(1),
  label: z.string().trim().min(1),
  startNodeId: z.string().trim().min(1),
  endNodeId: z.string().trim().min(1),
  points: z.array(RoutePointSchema).min(2),
});

export const ElevatorTransitionSegmentSchema = z.object({
  kind: z.literal('VERTICAL'),
  mode: z.literal('ELEVATOR'),
  fromFloorKey: z.string().trim().min(1),
  toFloorKey: z.string().trim().min(1),
  entryNodeId: z.string().trim().min(1),
  exitNodeId: z.string().trim().min(1),
  entryPoint: RoutePointSchema,
  exitPoint: RoutePointSchema,
  bankId: z.string().trim().min(1),
});

export const EscalatorTransitionSegmentSchema = z.object({
  kind: z.literal('VERTICAL'),
  mode: z.literal('ESCALATOR'),
  fromFloorKey: z.string().trim().min(1),
  toFloorKey: z.string().trim().min(1),
  entryNodeId: z.string().trim().min(1),
  exitNodeId: z.string().trim().min(1),
  entryPoint: RoutePointSchema,
  exitPoint: RoutePointSchema,
  direction: z.enum(['UP', 'DOWN']),
  operatingStatus: z.literal('OPEN'),
});

export const VerifiedRouteSchema = z.object({
  status: z.literal('VERIFIED'),
  sourceStatus: z.enum(['HOSPITAL_VERIFIED', 'OFFICIAL_PUBLIC']),
  sourceCheckedAt: z.iso.date().optional(),
  sourceUrls: z.array(z.url()).min(1).optional(),
  segments: z
    .array(
      z.union([
        WalkRouteSegmentSchema,
        ElevatorTransitionSegmentSchema,
        EscalatorTransitionSegmentSchema,
      ]),
    )
    .min(1),
});

export const RouteAvailabilitySchema = z.discriminatedUnion('status', [
  VerifiedRouteSchema,
  z.object({
    status: z.literal('MAP_ONLY'),
    sourceUrl: z.url(),
  }),
  z.object({
    status: z.literal('UNAVAILABLE'),
    reason: z.string().trim().min(1),
  }),
]);

export type GuideBuildingId = z.infer<typeof GuideBuildingIdSchema>;
export type GuideSourceStatus = z.infer<
  typeof GuideSourceStatusSchema
>;
export type GuidePlace = z.infer<typeof GuidePlaceSchema>;
export type GuideFloor = z.infer<typeof GuideFloorSchema>;
export type GuideBuilding = z.infer<typeof GuideBuildingSchema>;
export type HospitalGuidePurpose = z.infer<
  typeof HospitalGuidePurposeSchema
>;
export type HospitalGuideCatalog = z.infer<
  typeof HospitalGuideCatalogSchema
>;
export type HospitalGuidePurposeResult = z.infer<
  typeof HospitalGuidePurposeResultSchema
>;
export type VerifiedRoute = z.infer<typeof VerifiedRouteSchema>;
export type RouteAvailability = z.infer<
  typeof RouteAvailabilitySchema
>;
