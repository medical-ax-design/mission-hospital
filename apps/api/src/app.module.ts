import { Module } from '@nestjs/common';
import { CaregiverJourneyModule } from './caregiver-journey/caregiver-journey.module.js';
import { HealthController } from './health/health.controller.js';
import { HospitalGuideModule } from './hospital-guide/hospital-guide.module.js';
import { RestrictionGuidanceModule } from './restriction-guidance/restriction-guidance.module.js';

@Module({
  imports: [
    CaregiverJourneyModule,
    HospitalGuideModule,
    RestrictionGuidanceModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
