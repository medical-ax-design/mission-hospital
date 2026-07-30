import { Controller, Get, Inject, Param, Post } from '@nestjs/common';
import { CaregiverJourneyService } from './caregiver-journey.service.js';

@Controller('caregiver-journeys')
export class CaregiverJourneyController {
  constructor(
    @Inject(CaregiverJourneyService)
    private readonly caregiverJourneyService: CaregiverJourneyService,
  ) {}

  @Get('demo')
  async getDemoJourney() {
    return {
      journey: await this.caregiverJourneyService.getDemo(),
    };
  }

  @Post('demo/link')
  async linkDemoJourney() {
    return {
      journey: await this.caregiverJourneyService.linkDemo(),
    };
  }

  @Post('demo/tasks/:taskId/complete')
  async completeTask(@Param('taskId') taskId: string) {
    return {
      journey: await this.caregiverJourneyService.completeTask(taskId),
    };
  }

  @Post('demo/advance')
  async advanceDemoJourney() {
    return {
      journey: await this.caregiverJourneyService.advanceDemo(),
    };
  }
}
