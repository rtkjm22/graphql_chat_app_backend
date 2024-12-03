import { InputType, Field } from '@nestjs/graphql';
import { IsNotEmpty, IsString, IsArray, isString } from 'class-validator';

@InputType()
export class CreateChatroom {
  @Field()
  @IsString()
  @IsNotEmpty({ message: '名前は必須です。' })
  name: string;

  @Field(() => [String])
  @IsArray()
  userIds: string[];
}
