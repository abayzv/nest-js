import { Exclude } from "class-transformer";
import { User } from "@prisma/client";

export class UserEntity implements User {

    id: string;
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    emailVerified: boolean;
    createdAt: Date;
    updatedAt: Date;

    @Exclude()
    password: string;
    @Exclude()
    verificationToken: string;
    @Exclude()
    otpNumber: number;

    constructor(partial: Partial<UserEntity>) {
        Object.assign(this, partial);
    }
}