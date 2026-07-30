import { Module } from '@nestjs/common';
import { CaregiverJourneyController } from './caregiver-journey.controller.js';
import { CAREGIVER_JOURNEY_REPOSITORY } from './caregiver-journey.repository.js';
import { CaregiverJourneyService } from './caregiver-journey.service.js';
import { MemoryCaregiverJourneyRepository } from './memory-caregiver-journey.repository.js';

@Module({
  controllers: [CaregiverJourneyController],
  providers: [
    CaregiverJourneyService,
    {
      provide: CAREGIVER_JOURNEY_REPOSITORY,
      useClass: MemoryCaregiverJourneyRepository,
    },
  ],
})
export class CaregiverJourneyModule {}
