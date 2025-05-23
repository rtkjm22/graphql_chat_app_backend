import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver } from '@nestjs/apollo';
import { join } from 'path';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RedisPubSub } from 'graphql-redis-subscriptions';
import { TokenService } from './token/token.service';
import { ServeStaticModule } from '@nestjs/serve-static';
import { ChatroomModule } from './chatroom/chatroom.module';
import { LiveChatroomModule } from './live-chatroom/live-chatroom.module';

const pubSub = new RedisPubSub({
  connection: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    retryStrategy: (times) => {
      return Math.min(times * 50, 2000);
    },
  },
});

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
      serveRoot: '/',
    }),
    AuthModule,
    UserModule,
    GraphQLModule.forRootAsync({
      imports: [ConfigModule, AppModule],
      inject: [ConfigService],
      driver: ApolloDriver,
      useFactory: async (
        configService: ConfigService,
        tokenService: TokenService,
      ) => {
        return {
          playground: true,
          autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
          sortSchema: true,
          installSubscriptionHandlers: true,
          subscriptions: {
            'graphql-ws': true,
            'subscriptions-transport-ws': true,
          },
          // cors: {
          //   origin: 'http://localhost:5173',
          //   credentials: true,
          // },
          onConnect: (connectionParams) => {
            const token = tokenService.extractToken(connectionParams);
            if (!token) {
              throw new Error('トークンを取得できませんでした。');
            }
            const user = tokenService.validateToken(token);
            if (!user) {
              throw new Error('不正なトークンです。');
            }
            return { user };
          },
          context: (req, res, connection) => {
            // console.log("グラフQLのコンテキストですj：", req.res.req.cookies)
            if (connection) {
              return {
                req: connection.context.req,
                res: connection.context.res,
                user: connection.context.user,
                pubSub,
              };
            }
            return { req, res };
          },
        };
      },
    }),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ChatroomModule,
    LiveChatroomModule,
  ],
  controllers: [AppController],
  providers: [AppService, TokenService],
})
export class AppModule {}
