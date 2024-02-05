import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { UserEntity } from 'src/users/entities/user.entity';
import { SigninDto } from './dto/signin.dto';
import { RegisterDto } from './dto/register.dto';
import { TypedEventEmitter } from 'src/event-emitter/typed-event-emitter.class';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private eventEmitter: TypedEventEmitter,
    private configService: ConfigService,
  ) { }

  generateToken(minutes: number = 5) {
    return this.jwtService.signAsync({
      expiredAt: new Date(Date.now() + minutes * 60000).toISOString()
    })
  }

  async signIn(signInDto: SigninDto): Promise<{ access_token: string }> {
    const { email, username, password } = signInDto;

    // If both email and username are not provided, throw an error
    if (!email && !username) {
      throw new UnauthorizedException();
    }

    let user: UserEntity | null = null;
    if (email) {
      // If email is provided, find the user by email
      user = await this.usersService.findByEmail(email);
    } else if (username) {
      // If username is provided, find the user by username
      user = await this.usersService.findByUsername(username);
    }

    // If password is incorrect, throw an error
    if (user?.password !== password) {
      throw new UnauthorizedException();
    }

    if (this.configService.get("EMAIL_VERIFICATION_ENABLED") === 'true' && !user.emailVerified) {
      const token = await this.generateToken(36000);
      await this.usersService.verify(user.id, { verificationToken: token });

      const url = `${this.configService.get('FRONTEND_URL')}/verify-email?token=${token}`;
      this.eventEmitter.emit('user.registered', { email: user.email, name: `${user.firstName} ${user.lastName}`, url });
    }

    // return the access token
    const payload = { sub: user.id, username: user.username, firstName: user.firstName, lastName: user.lastName, emailVerified: user.emailVerified };

    // Send OTP to user's email
    if (this.configService.get('LOGIN_OTP_ENABLED') === 'true') {
      const generateOtp = Math.floor(100000 + Math.random() * 900000);
      this.eventEmitter.emit('user.verify-email', { email: user.email, name: `${user.firstName} ${user.lastName}`, otp: String(generateOtp) });
    }

    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }

  async signUp(registerDto: RegisterDto): Promise<{ accesToken: string }> {
    // Create a new user
    const user = await this.usersService.create(registerDto);

    if (this.configService.get("EMAIL_VERIFICATION_ENABLED") === 'true') {
      const token = await this.generateToken(36000);
      await this.usersService.verify(user.id, { verificationToken: token });

      const url = `${this.configService.get('FRONTEND_URL')}/verify-email?token=${token}`;
      this.eventEmitter.emit('user.registered', { email: user.email, name: `${user.firstName} ${user.lastName}`, url });
    }

    const payload = { sub: user.id, username: user.username, firstName: user.firstName, lastName: user.lastName, emailVerified: user.emailVerified };
    return {
      accesToken: await this.jwtService.signAsync(payload),
    };
  }

  async verifyEmail(token: string): Promise<UserEntity> {
    const user = await this.usersService.findByVerificationToken(token);

    if (!user) {
      throw new UnauthorizedException();
    }

    const verifyUser = await this.usersService.verify(user.id, { emailVerified: true, verificationToken: null });

    return verifyUser;
  }
}