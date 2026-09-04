import { Body, Controller, Get, Post } from '@nestjs/common';
import { LoginDto } from './dto/login.dto';
import { SetupDto } from './dto/setup.dto';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

  @Get('setup-status')
  getSetupStatus() {
    return this.authService
      .isConfigured()
      .then((configured) => ({ configured }));
  }

  @Post('setup')
  setup(@Body() setupDto: SetupDto) {
    return this.authService.setup(setupDto);
  }

  @Post('login')
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto.password);
  }
}
