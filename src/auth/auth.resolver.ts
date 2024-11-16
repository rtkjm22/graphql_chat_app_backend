import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql';
import { AuthService } from './auth.service';
import { LoginResponse, RegisterResponse } from './types';
import { LoginDto, RegisterDto } from './dto';
import { BadRequestException } from '@nestjs/common';
import { Request, Response } from 'express';

@Resolver()
export class AuthResolver {
  constructor(private readonly authService: AuthService) {}

  // 新規登録処理
  @Mutation(() => RegisterResponse)
  async register(
    @Args('registerInput') registerDto: RegisterDto,
    @Context() context: { res: Response },
  ) {
    if (registerDto.password !== registerDto.confirmPassword) {
      throw new BadRequestException({
        confirmPassword: 'パスワードが一致していません。',
      });
    }
    const { user } = await this.authService.register(registerDto, context.res);
    return { user };
  }

  // ログイン処理
  @Mutation(() => LoginResponse)
  async login(
    @Args('loginResponse') loginDto: LoginDto,
    @Context() context: { res: Response },
  ) {
    return this.authService.login(loginDto, context.res);
  }

  // ログアウト処理
  @Mutation(() => String)
  async logout(@Context() context: { res: Response }) {
    return this.authService.logout(context.res);
  }

  @Mutation(() => String)
  async refreshToken(@Context() context: { req: Request; res: Response }) {
    try {
      return this.authService.refreshToken(context.req, context.res);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Query(() => String)
  async hello() {
    return 'hello';
  }
}
