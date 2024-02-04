import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { EmailModule } from './email/email.module';
import { EventEmitterModule } from '@nestjs/event-emitter';

@Module({
  imports: [AuthModule, UsersModule, EmailModule, EventEmitterModule.forRoot()],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
