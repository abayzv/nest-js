import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, HttpException } from '@nestjs/common';
import { Observable } from 'rxjs';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthGuard implements CanActivate {
    canActivate(
        context: ExecutionContext,
    ): boolean | Promise<boolean> | Observable<boolean> {
        const request = context.switchToHttp().getRequest();
        const token = request.headers['authorization']?.split(' ')[1] || null;
        if (!token) return false;

        const jwtService = new JwtService({
            secret: process.env.JWT_SECRET,
        });

        // Verify the token
        try {
            jwtService.verify(token);
        } catch (error) {
            throw new UnauthorizedException('Invalid token');
        }

        // Check if email verification is enabled
        if (process.env.EMAIL_VERIFICATION_ENABLED === 'true') {
            const { emailVerified } = jwtService.decode(token);
            if (!emailVerified) throw new UnauthorizedException('Email not verified');
        }

        return true;
    }
}