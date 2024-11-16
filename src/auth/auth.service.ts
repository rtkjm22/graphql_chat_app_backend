import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import { Request, Response } from 'express';
import { PrismaService } from 'src/prisma.service';
import { LoginDto, RegisterDto } from './dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async refreshToken(req: Request, res: Response) {
    const refreshToken = req.cookies['refresh_token'];
    if (!refreshToken)
      throw new UnauthorizedException('リフレッシュトークンが見つかりません。');
    let payload;

    try {
      payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('REFRESH_TOKEN_SECRET'),
      });
    } catch (error) {
      throw new UnauthorizedException(
        'リフレッシュトークンが有効期限切れか不正な値です。',
      );
    }

    const userExists = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!userExists) {
      throw new BadRequestException('ユーザーが存在しません。');
    }

    const expiresIn = 15000;
    const expiration = Math.floor(Date.now() / 1000) + expiresIn;
    const accessToken = this.jwtService.sign(
      { ...payload, exp: expiration },
      {
        secret: this.configService.get<string>('ACCESS_TOKEN_SECRET'),
      },
    );

    return accessToken;
  }

  // アクセストークン及びリフレッシュトークンが生成されて、レスポンスクッキーにトークン情報を保存
  private async issueToken(user: User, response: Response) {
    const payload = { username: user.fullname, sub: user.id };

    const accessToken = this.jwtService.sign(
      { ...payload },
      {
        secret: this.configService.get<string>('ACCESS_TOKEN_SECRET'),
        expiresIn: '150sec',
      },
    );

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('REFRESH_TOKEN_SECRET'),
      expiresIn: '7d',
    });

    response.cookie('access_token', accessToken, { httpOnly: true });
    response.cookie('refresh_token', refreshToken, { httpOnly: true });

    return { user };
  }

  // ユーザー登録時に認証情報を生成
  async register(registerDto: RegisterDto, response: Response) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw new BadRequestException({
        email: 'このメールアドレスはすでに使用されています。',
      });
    }
    const salt = 10;
    const hashedPassword = await bcrypt.hash(registerDto.password, salt);
    const user = await this.prisma.user.create({
      data: {
        fullname: registerDto.fullname,
        password: hashedPassword,
        email: registerDto.email,
      },
    });
    return this.issueToken(user, response);
  }

  // ログイン時、ユーザーの存在確認を行い、ユーザー情報を返却
  async validateUser(loginDto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: loginDto.email },
    });

    if (user && (await bcrypt.compare(loginDto.password, user.password))) {
      return user;
    }
    return null;
  }

  // ログイン処理
  async login(loginDto: LoginDto, response: Response) {
    const user = await this.validateUser(loginDto);
    if (!user) {
      throw new BadRequestException({
        invalidCredentials: 'ログイン情報に誤りがあります。',
      });
    }
    return this.issueToken(user, response);
  }

  // ログアウト処理
  async logout(response: Response) {
    response.clearCookie('access_token');
    response.clearCookie('refresh_token');
    return 'ログアウトが成功しました。';
  }
}
