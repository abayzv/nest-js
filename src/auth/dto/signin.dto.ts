import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsEmail, IsOptional } from 'class-validator';

export class SigninDto {
    @ApiProperty()
    @IsOptional()
    @IsEmail()
    email: string;

    @ApiProperty()
    username: string;

    @ApiProperty()
    @IsNotEmpty()
    password: string;
}