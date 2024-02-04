import { Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { EmailController } from './email.controller';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { join } from 'path';

@Module({
  imports: [
    MailerModule.forRoot({
      transport: {
        host: 'mail.jatengdev.com',
        port: 465,
        secure: true,
        auth: {
          user: 'bayu@jatengdev.com',
          pass: 'OFNq8]xF[BUF',
        },
      },
      defaults: {
        from: '"JatengDev" <bayu@jatengdev.com>',
      },
      template: {
        dir: join(__dirname, 'templates'),
        adapter: new HandlebarsAdapter(),
        options: {
          strict: true,
        },
      },
    }),
  ],
  controllers: [EmailController],
  providers: [EmailService]
})
export class EmailModule { }
