import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserEntity } from './entities/user.entity';

@Injectable()
export class UsersService {

  constructor(private prisma: PrismaService) { }

  create(createUserDto: CreateUserDto) {
    return this.prisma.user.create({
      data: createUserDto
    });
  }

  async findAll(): Promise<UserEntity[]> {
    const users = await this.prisma.user.findMany();
    return users.map(user => new UserEntity(user));
  }

  async findOne(id: string): Promise<UserEntity | null> {
    const user = await this.prisma.user.findUnique({
      where: {
        id: id
      }
    });

    return user ? new UserEntity(user) : null;
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    const user = await this.prisma.user.findUnique({
      where: {
        email: email
      }
    });

    return user ? new UserEntity(user) : null;
  }

  async findByUsername(username: string): Promise<UserEntity | null> {
    return this.prisma.user.findUnique({
      where: {
        username: username,
      },
    });
  }

  async findByVerificationToken(verificationToken: string): Promise<UserEntity | null> {
    const user = await this.prisma.user.findFirst({
      where: {
        verificationToken: verificationToken
      }
    });

    return user ? new UserEntity(user) : null;
  }

  verify(id: string, data: { emailVerified?: boolean, verificationToken?: string, otp?: string }) {
    return this.prisma.user.update({
      where: {
        id: id
      },
      data: data
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<UserEntity> {
    const user = await this.prisma.user.update({
      where: {
        id: id
      },
      data: updateUserDto
    });

    return new UserEntity(user);
  }

  remove(id: string) {
    return this.prisma.user.delete({
      where: {
        id: id
      }
    });
  }
}
