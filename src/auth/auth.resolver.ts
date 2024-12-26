import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql';
import { AuthService } from './auth.service';
import { LoginResponse, RegisterResponse } from './types';
import { LoginDto, RegisterDto } from './dto';
import { BadRequestException, UseFilters } from '@nestjs/common';
import { Request } from 'express';
import { GraphQLErrorFilter } from 'src/filters/custom-exception.filter';

@UseFilters(GraphQLErrorFilter)
@Resolver()
export class AuthResolver {
  constructor(private readonly authService: AuthService) {}

  // 新規登録処理
  @Mutation(() => RegisterResponse)
  async register(
    @Args('registerInput') registerDto: RegisterDto,
    @Context() context: { req: Request },
  ) {
    if (registerDto.password !== registerDto.confirmPassword) {
      throw new BadRequestException({
        confirmPassword: 'パスワードが一致していません。',
      });
    }
    const { user } = await this.authService.register(
      registerDto,
      context.req.res,
    );
    return { user };
  }

  // ログイン処理
  @Mutation(() => LoginResponse)
  async login(
    @Args('loginInput') loginDto: LoginDto,
    @Context() context: { req: Request },
  ) {
    return this.authService.login(loginDto, context.req.res);
  }

  // ログアウト処理
  @Mutation(() => String)
  async logout(@Context() context: { req: Request }) {
    return this.authService.logout(context.req.res);
  }

  @Mutation(() => String)
  async refreshToken(@Context() context: { req: Request }) {
    try {
      return this.authService.refreshToken(context.req, context.req.res);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Query(() => String)
  async hello() {
    return 'hello';
  }
}
