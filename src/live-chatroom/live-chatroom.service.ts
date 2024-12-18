import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import { User } from 'src/user/user.type';

@Injectable()
export class LiveChatroomService {
  private redisClient: Redis;

  constructor() {
    this.redisClient = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
    });
  }
  async addLiveUserToChatroom(chatroomId: number, user: User): Promise<void> {
    const existingLiveUsers = await this.getLiveUsersForChatroom(chatroomId);

    const existingUsers = existingLiveUsers.find(
      (liveUser) => liveUser.id === user.id,
    );

    if (existingUsers) return;
    await this.redisClient.sadd(
      `liveUsers:chatroom:${chatroomId}`,
      JSON.stringify(user),
    );
  }

  async removeLiveUserFromChatroom(
    chatroomId: number,
    user: User,
  ): Promise<void> {
    await this.redisClient
      .srem(`liveUsers:chatroom:${chatroomId}`, JSON.stringify(user))
      .catch((error) => {
        console.log('removeLiveUserFromChatroom Error: ', error);
      })
      .then((res) => {
        console.log('removeLiveUserFromChatroom Response: ', res);
      });
  }

  async getLiveUsersForChatroom(chatroomId: number): Promise<User[]> {
    const users = await this.redisClient.smembers(
      `liveUsers:chatroom:${chatroomId}`,
    );
    return users.map((user) => JSON.parse(user));
  }
}
