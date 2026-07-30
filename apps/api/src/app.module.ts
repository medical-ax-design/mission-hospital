import { Module } from '@nestjs/common';
import { CaregiverJourneyModule } from './caregiver-journey/caregiver-journey.module.js';
import { HealthController } from './health/health.controller.js';

@Module({
  imports: [CaregiverJourneyModule],
  controllers: [HealthController],
})
export class AppModule {}
