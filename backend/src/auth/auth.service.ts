import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { SetupDto } from './dto/setup.dto';
import { PrismaService } from '../prisma/prisma.service';
import * as argon2 from 'argon2';


@Injectable()
export class AuthService {
    constructor(private readonly prisma: PrismaService) {}

  async isConfigured(): Promise<boolean> {
    const user = await this.prisma.user.findFirst();

    return user !== null;
  }

  async setup(setupDto: SetupDto) {
    const alreadyConfigured = await this.isConfigured();

    if (alreadyConfigured) {
      throw new ConflictException(
        'The system has already been configured',
      );
    }

    const passwordHash = await argon2.hash(setupDto.password);

    const user = await this.prisma.user.create({
      data: {
        name: setupDto.name,
        passwordHash,
      },
      select: {
        id: true,
        name: true,
        createdAt: true,
      },
    });

    return user;
  }

  async login(password: string) {
    const user = await this.prisma.user.findFirst();

    if (!user) {
      throw new UnauthorizedException(
        'The system has not been configured',
      );
    }

    const passwordValid = await argon2.verify(
      user.passwordHash,
      password,
    );

    if (!passwordValid) {
      throw new UnauthorizedException('Invalid password');
    }

    return {
      id: user.id,
      name: user.name,
    };
  }
}
