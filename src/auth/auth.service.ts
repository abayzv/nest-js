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

  isExpiredToken(token: string) {
    // check if token is expired
    const payload = this.jwtService.verify(token);
    const expiredAt = new Date(payload.expiredAt);
    return expiredAt < new Date();
  }

  async sendVerificationEmail(user: UserEntity) {
    const token = await this.generateToken(36000);
    await this.usersService.verify(user.id, { verificationToken: token });

    const url = `${this.configService.get('FRONTEND_URL')}/verify-email?token=${token}`;
    this.eventEmitter.emit('user.registered', { email: user.email, name: `${user.firstName} ${user.lastName}`, url });
  }

  async resendVerificationEmail(email: string) {
    if (!email) {
      throw new UnauthorizedException('Invalid email');
    }

    // Find the user by email
    const user = await this.usersService.findByEmail(email);

    // If user is not found, throw an error
    if (!user) {
      throw new UnauthorizedException('Email not registered');
    }

    // Send verification email
    if (this.configService.get("EMAIL_VERIFICATION_ENABLED") === 'true' && !user.emailVerified) {
      await this.sendVerificationEmail(user);
      return {
        statusCode: 200,
        message: 'Verification email sent'
      }
    } else {
      return {
        statusCode: 400,
        message: 'Email already verified'
      }
    }
  }

  async sendOtp(user: UserEntity) {
    const token = await this.generateToken(5);
    const generateOtp = Math.floor(100000 + Math.random() * 900000);
    this.eventEmitter.emit('user.verify-email', { email: user.email, name: `${user.firstName} ${user.lastName}`, otp: String(generateOtp) });
    this.usersService.verify(user.id, { otpNumber: generateOtp, verificationToken: token });

    return {
      token
    }
  }

  async resendOtp(token: string) {
    if (!token) {
      throw new UnauthorizedException('Invalid token');
    }

    // Find the user by verification token
    const user = await this.usersService.findByVerificationToken(token);

    // If user is not found, throw an error
    if (!user) {
      throw new UnauthorizedException('Invalid token');
    }

    const isExpired = this.isExpiredToken(user.verificationToken);
    if (!isExpired) return {
      statusCode: 400,
      message: 'Please wait for 1 minute before sending another OTP'
    }

    // Send OTP to user's email
    const sendOtp = await this.sendOtp(user);
    return {
      statusCode: 200,
      message: 'OTP sent',
      accessToken: sendOtp.token
    }

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

    // return the access token
    const payload = { sub: user.id, username: user.username, firstName: user.firstName, lastName: user.lastName, emailVerified: user.emailVerified };

    // Send OTP to user's email
    if (this.configService.get('LOGIN_OTP_ENABLED') === 'true') {

      if (user.verificationToken) {
        const isExpired = this.isExpiredToken(user.verificationToken);
        if (isExpired) {
          const sendOtp = await this.sendOtp(user);
          return {
            access_token: sendOtp.token,
          }
        } else {
          return {
            access_token: user.verificationToken,
          };
        }
      } else {
        const sendOtp = await this.sendOtp(user);

        return {
          access_token: sendOtp.token,
        }
      }

    }

    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }

  async signUp(registerDto: RegisterDto): Promise<{ accesToken: string }> {
    // Create a new user
    const user = await this.usersService.create(registerDto);

    // Send verification email
    if (this.configService.get("EMAIL_VERIFICATION_ENABLED") === 'true' && !user.emailVerified) {
      await this.sendVerificationEmail(user);
    }

    const payload = { sub: user.id, username: user.username, firstName: user.firstName, lastName: user.lastName, emailVerified: user.emailVerified };
    return {
      accesToken: await this.jwtService.signAsync(payload),
    };
  }

  async verifyEmail(token: string) {
    if (!token) {
      throw new UnauthorizedException('Invalid token');
    }

    // Find the user by verification token
    const user = await this.usersService.findByVerificationToken(token);

    // If user is not found, throw an error
    if (!user) {
      throw new UnauthorizedException('Invalid token');
    }

    // Update the user's emailVerified and verificationToken fields
    await this.usersService.verify(user.id, { emailVerified: true, verificationToken: null });

    return {
      statusCode: 200,
      message: 'Email successfully verified',
    }
  }

  async verifyOtp(otp: string, token: string) {
    if (!otp || !token) {
      throw new UnauthorizedException('Invalid OTP or token');
    }

    const isExpired = this.isExpiredToken(token);
    if (isExpired) {
      throw new UnauthorizedException('Expired token');
    }

    // Find the user by verification token
    const user = await this.usersService.findByVerificationToken(token);

    // If user is not found, throw an error
    if (!user) {
      throw new UnauthorizedException('Invalid token');
    }

    // If OTP is incorrect, throw an error
    if (user.otpNumber !== Number(otp)) {
      throw new UnauthorizedException('Invalid OTP');
    }

    // Update the user's emailVerified and verificationToken fields
    await this.usersService.verify(user.id, { emailVerified: true, verificationToken: null, otpNumber: null });

    const payload = { sub: user.id, username: user.username, firstName: user.firstName, lastName: user.lastName, emailVerified: user.emailVerified };

    return {
      statusCode: 200,
      message: 'OTP successfully verified',
      accessToken: await this.jwtService.signAsync(payload),
    }
  }
}