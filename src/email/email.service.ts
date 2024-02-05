import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { OnEvent } from '@nestjs/event-emitter';

@Injectable()
export class EmailService {

  constructor(private mailerService: MailerService) { }

  @OnEvent('user.registered')
  async welcomeEmail({ email, name, url }: { email: string, name: string, url: string }) {
    console.log('Sending welcome email to', email, 'with name', name)
    await this.mailerService.sendMail({
      to: email,
      subject: `Welcome to PT. Mahesa Teknologi | ${name}`,
      template: '../../templates/mail/welcome', // The `.ejs` template is used
      context: {
        name: name,
        url: url
      },
    });
  }

  @OnEvent('user.reset-password')
  async forgotPasswordEmail({ email, name, token }: { email: string, name: string, token: string }) {
    console.log('Sending forgot password email to', email, 'with name', name)
    await this.mailerService.sendMail({
      to: email,
      subject: `Forgot Password | PT. Mahesa Teknologi | ${name}`,
      template: '../../templates/mail/forgot-password', // The `.ejs` template is used
      context: {
        name: name,
        token: token
      },
    });
  }

  @OnEvent('user.verify-email')
  async verifyEmail({ email, name, otp }: { email: string, name: string, otp: string }) {
    console.log('Sending verify email to', email, 'with name', name)
    await this.mailerService.sendMail({
      to: email,
      subject: `Verify Email | PT. Mahesa Teknologi | ${name}`,
      template: '../../templates/mail/verify-email', // The `.ejs` template is used
      context: {
        name: name,
        otp: otp
      },
    });
  }

}
