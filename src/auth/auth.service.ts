import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { User, Prisma } from '.prisma/client';
import { SigninDto } from './dto/signin.dto';
import { RegisterDto } from './dto/register.dto';
import { TypedEventEmitter } from 'src/event-emitter/typed-event-emitter.class';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private eventEmitter: TypedEventEmitter
  ) { }

  async signIn(signInDto: SigninDto): Promise<{ access_token: string }> {
    const { email, username, password } = signInDto;

    if (!email && !username) {
      throw new UnauthorizedException();
    }

    let user: User | null = null;
    if (email) {
      user = await this.usersService.findByEmail(email);
    } else if (username) {
      user = await this.usersService.findByUsername(username);
    }

    if (user?.password !== password) {
      throw new UnauthorizedException();
    }
    const payload = { sub: user.id, username: user.username, firstName: user.firstName, lastName: user.lastName };
    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }

  async signUp(registerDto: RegisterDto): Promise<User> {
    const user = await this.usersService.create(registerDto);
    this.eventEmitter.emit('user.registered', { email: user.email, name: `${user.firstName} ${user.lastName}` });
    return user;
  }
}