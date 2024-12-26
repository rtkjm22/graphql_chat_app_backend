import { ApolloError } from 'apollo-server-express';
import { Catch, BadRequestException } from '@nestjs/common';
import { GqlExceptionFilter } from '@nestjs/graphql';

@Catch(BadRequestException)
export class GraphQLErrorFilter implements GqlExceptionFilter {
  catch(exception: BadRequestException) {
    const response = exception.getResponse();

    if (typeof response === 'object') {
      throw new ApolloError(
        'バリデーションエラー',
        'VALIDATION_ERROR',
        response,
      );
    } else {
      throw new ApolloError('バッドリクエスト');
    }
  }
}
