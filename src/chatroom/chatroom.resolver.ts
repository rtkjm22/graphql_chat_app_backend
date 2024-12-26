import {
  Args,
  Context,
  Mutation,
  Resolver,
  Query,
  Subscription,
} from '@nestjs/graphql';
import { UserService } from 'src/user/user.service';
import { ChatroomService } from './chatroom.service';
import { UseFilters, UseGuards } from '@nestjs/common';
import { GraphQLErrorFilter } from 'src/filters/custom-exception.filter';
import { GraphqlAuthGuard } from 'src/auth/graphql-auth.guard';
import { Chatroom, Message } from './chatroom.types';
import { Request } from 'express';
import { PubSub } from 'graphql-subscriptions';
import { User } from 'src/user/user.type';
import { FileUpload, GraphQLUpload } from 'graphql-upload-ts';

@Resolver()
export class ChatroomResolver {
  public pubSub: PubSub;
  constructor(
    private readonly chatroomService: ChatroomService,
    private readonly userService: UserService,
  ) {
    this.pubSub = new PubSub();
  }

  @Subscription(() => Message, {
    nullable: true,
    resolve: (value) => value.newMessage,
  })
  newMessage(@Args('chatroomId') chatroomId: number) {
    return this.pubSub.asyncIterator(`newMessage.${chatroomId}`);
  }

  @Subscription(() => User, {
    nullable: true,
    resolve: (value) => value.user,
    filter: (payload, variables) => {
      console.log('payload1', variables, payload.typingUserId);
      return variables.userId !== payload.typingUserId;
    },
  })
  userStartedTyping(@Args('chatroomId') chatroomId: number) {
    return this.pubSub.asyncIterator(`userStartedTyping.${chatroomId}`);
  }

  @Subscription(() => User, {
    nullable: true,
    resolve: (value) => value.user,
    filter: (payload, variables) => {
      console.log('payload2', variables, payload.typingUserId);
      return variables.userId !== payload.typingUserId;
    },
  })
  userStoppedTyping(@Args('chatroomId') chatroomId: number) {
    return this.pubSub.asyncIterator(`userStoppedTyping.${chatroomId}`);
  }

  @UseFilters(GraphQLErrorFilter)
  @UseGuards(GraphqlAuthGuard)
  @Mutation(() => User)
  async userStartedTypingMutation(
    @Args('chatroomId') chatroomId: number,
    @Context() context: { req: Request },
  ) {
    const user = await this.userService.getUser(context.req.user.sub);
    await this.pubSub.publish(`userStartedTyping.${chatroomId}`, {
      user,
      typingUserId: user.id,
    });
    return user;
  }

  @UseFilters(GraphQLErrorFilter)
  @UseGuards(GraphqlAuthGuard)
  @Mutation(() => User, {})
  async userStoppedTypingMutation(
    @Args('chatroomId') chatroomId: number,
    @Context() context: { req: Request },
  ) {
    const user = await this.userService.getUser(context.req.user.sub);
    await this.pubSub.publish(`userStoppedTyping.${chatroomId}`, {
      user,
      typingUserId: user.id,
    });
    return user;
  }

  @UseGuards(GraphqlAuthGuard)
  @Mutation(() => Message)
  async sendMessage(
    @Args('chatroomId') chatroomId: number,
    @Args('content') content: string,
    @Context() context: { req: Request },
    @Args('image', { type: () => GraphQLUpload, nullable: true })
    image?: FileUpload,
  ) {
    let imagePath = null;
    if (image) imagePath = await this.chatroomService.saveImage(image);
    const newMessage = await this.chatroomService.sendMessage(
      chatroomId,
      content,
      context.req.user.sub,
      imagePath,
    );
    await this.pubSub
      .publish(`newMessage.${chatroomId}`, { newMessage })
      .then((res) => {
        console.log('published: ', res);
      })
      .catch((error) => {
        console.log('Error: ', error);
      });
    return newMessage;
  }

  @UseFilters(GraphQLErrorFilter)
  @UseGuards(GraphqlAuthGuard)
  @Mutation(() => Chatroom)
  async createChatroom(
    @Args('name') name: string,
    @Context() context: { req: Request },
  ) {
    return this.chatroomService.createChatroom(name, context.req.user.sub);
  }

  @Mutation(() => Chatroom)
  async addUsersToChatroom(
    @Args('chatroomId') chatroomId: number,
    @Args('userIds', { type: () => [Number] }) userIds: number[],
  ) {
    return this.chatroomService.addUsersToChatroom(chatroomId, userIds);
  }

  @Query(() => [Chatroom])
  async getChatroomsForUser(@Args('userId') userId: number) {
    return this.chatroomService.getChatroomsForUser(userId);
  }

  @Query(() => [Message])
  async getMessageForChatroom(@Args('chatroomId') chatroomId: number) {
    return this.chatroomService.getMessageForChatroom(chatroomId);
  }

  @Mutation(() => String)
  async deleteChatroom(@Args('chatroomId') chatroomId: number) {
    await this.chatroomService.deleteChatroom(chatroomId);
    return 'チャットルームの削除が成功しました。';
  }
}
