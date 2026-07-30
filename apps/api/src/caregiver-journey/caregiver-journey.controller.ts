import {
  BadRequestException,
  Controller,
  Get,
  Inject,
  Param,
  Post,
} from '@nestjs/common';
import { DemoScenarioIdSchema } from '@ready-on/contracts';
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

  @Post('demo/scenarios/:scenarioId/select')
  async selectDemoScenario(@Param('scenarioId') scenarioId: string) {
    const parsed = DemoScenarioIdSchema.safeParse(scenarioId);
    if (!parsed.success) {
      throw new BadRequestException('지원하지 않는 발표 시나리오입니다.');
    }

    return {
      journey: await this.caregiverJourneyService.selectDemoScenario(
        parsed.data,
      ),
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
