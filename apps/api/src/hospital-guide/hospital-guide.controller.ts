import { Controller, Get, Inject, Query } from '@nestjs/common';
import { HospitalGuideService } from './hospital-guide.service.js';

@Controller('hospital-guide')
export class HospitalGuideController {
  constructor(
    @Inject(HospitalGuideService)
    private readonly service: HospitalGuideService,
  ) {}

  @Get('catalog')
  getCatalog() {
    return { catalog: this.service.getCatalog() };
  }

  @Get('purposes/search')
  findPurpose(@Query('q') query = '') {
    return { result: this.service.findPurpose(query) };
  }
}
