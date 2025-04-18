import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { verify } from 'jsonwebtoken';

@Injectable()
export class TokenService {
  constructor(private configService: ConfigService) {}

  // トークンを抽出
  extractToken(connectionParams: any): string | null {
    return connectionParams?.token || null;
  }

  /**
   * トークンのバリデーション
   * @returns user | null
   */
  validateToken(token: string): any {
    const refreshTokenSecret = this.configService.get<string>(
      'REFRESH_TOKEN_SECRET',
    );
    try {
      return verify(token, refreshTokenSecret);
    } catch (error) {
      return null;
    }
  }
}
