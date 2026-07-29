import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get('live')
  live() {
    return {
      data: {
        status: 'ok',
        service: 'ready-on-api',
      },
    };
  }

  @Get('ready')
  ready() {
    return {
      data: {
        status: 'ready',
        service: 'ready-on-api',
      },
    };
  }
}
