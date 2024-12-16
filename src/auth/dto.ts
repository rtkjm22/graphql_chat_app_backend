import { InputType, Field } from '@nestjs/graphql';
import { IsEmail, IsNotEmpty, MinLength, IsString } from 'class-validator';

@InputType()
export class RegisterDto {
  @Field()
  @IsNotEmpty({ message: '必須項目です。' })
  @IsString({ message: '文字列で入力してください。' })
  fullname: string;

  @Field()
  @IsNotEmpty({ message: '必須項目です。' })
  @MinLength(8, { message: '最低８文字以上入力してください。' })
  password: string;

  @Field()
  @IsNotEmpty({ message: '必須項目です。' })
  confirmPassword: string;

  @Field()
  @IsNotEmpty({ message: '必須項目です。' })
  @IsEmail({}, { message: '不正なメール形式です。' })
  email: string;
}

@InputType()
export class LoginDto {
  @Field()
  @IsNotEmpty({ message: '必須項目です。' })
  @IsEmail({}, { message: '不正なメール形式です。' })
  email: string;

  @Field()
  @IsNotEmpty({ message: '必須項目です。' })
  password: string;
}
