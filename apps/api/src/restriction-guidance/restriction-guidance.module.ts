import { Module } from '@nestjs/common';
import { CaregiverJourneyModule } from '../caregiver-journey/caregiver-journey.module.js';
import { RestrictionGuidanceController } from './restriction-guidance.controller.js';
import { RestrictionGuidanceService } from './restriction-guidance.service.js';

@Module({
  imports: [CaregiverJourneyModule],
  controllers: [RestrictionGuidanceController],
  providers: [RestrictionGuidanceService],
})
export class RestrictionGuidanceModule {}
