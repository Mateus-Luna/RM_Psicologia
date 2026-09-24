import { Body, Controller, Get, Post, Request } from '@nestjs/common';
import { LoginDto } from './dto/login.dto';
import { SetupDto } from './dto/setup.dto';
import { AuthService } from './auth.service';
import { Public } from './public.decorator';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

  @Get('setup-status')
  @Public()
  getSetupStatus() {
    return this.authService
      .isConfigured()
      .then((configured) => ({ configured }));
  }

  @Post('setup')
  @Public()
  setup(@Body() setupDto: SetupDto) {
    return this.authService.setup(setupDto);
  }

  @Post('login')
  @Public()
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto.password);
  }

  @Post('unlock')
  async unlock(
    @Request() request: any,
    @Body() loginDto: LoginDto,
  ) {
    return this.authService.unlock(
      request.user.id,
      loginDto.password,
    );
  }
}
