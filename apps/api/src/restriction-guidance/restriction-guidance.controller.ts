import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { CreateSavedQuestionSchema } from '@ready-on/contracts';
import { RestrictionGuidanceService } from './restriction-guidance.service.js';

@Controller('caregiver-journeys/demo')
export class RestrictionGuidanceController {
  constructor(
    @Inject(RestrictionGuidanceService)
    private readonly service: RestrictionGuidanceService,
  ) {}

  @Get('restrictions')
  async getGuidance() {
    return { guidance: await this.service.getGuidance() };
  }

  @Get('restrictions/search')
  async search(@Query('q') query?: string) {
    return { result: await this.service.search(query ?? '') };
  }

  @Post('restrictions/advance')
  async advancePhase() {
    return { guidance: await this.service.advancePhase() };
  }

  @Get('questions')
  async listQuestions() {
    return { questions: await this.service.listQuestions() };
  }

  @Post('questions')
  async saveQuestion(@Body() body: unknown) {
    const parsed = CreateSavedQuestionSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException('검색어를 확인해 주세요.');
    }
    return {
      question: await this.service.saveQuestion(parsed.data.query),
    };
  }

  @Post('questions/:questionId/complete')
  async completeQuestion(@Param('questionId') questionId: string) {
    return {
      question: await this.service.completeQuestion(questionId),
    };
  }

  @Delete('questions/:questionId')
  async deleteQuestion(@Param('questionId') questionId: string) {
    await this.service.deleteQuestion(questionId);
    return { deleted: true };
  }
}
