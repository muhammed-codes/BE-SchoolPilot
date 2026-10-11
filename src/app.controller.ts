import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class AppController {
  @Get()
  checkHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}

@Controller()
export class RootHealthController {
  @Get()
  checkRootHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
