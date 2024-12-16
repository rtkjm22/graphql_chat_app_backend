import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async updateProfile(userId: number, fullname: string, avatarUrl: string) {
    if (avatarUrl) {
      return await this.prisma.user.update({
        where: { id: userId },
        data: {
          fullname,
          avatarUrl,
        },
      });
    }
    return await this.prisma.user.update({
      where: { id: userId },
      data: { fullname },
    });
  }

  async searchUsers(fullname: string, userId: number) {
    return this.prisma.user.findMany({
      where: {
        fullname: {
          contains: fullname,
        },
        id: {
          not: userId,
        },
      },
    });
  }

  async getUsersOfChatroom(chatroomId: number) {
    return this.prisma.user.findMany({
      where: {
        chatrooms: {
          some: {
            id: chatroomId,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}
