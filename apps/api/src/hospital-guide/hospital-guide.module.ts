import { Module } from '@nestjs/common';
import { HospitalGuideController } from './hospital-guide.controller.js';
import { HospitalGuideService } from './hospital-guide.service.js';

@Module({
  controllers: [HospitalGuideController],
  providers: [HospitalGuideService],
})
export class HospitalGuideModule {}
