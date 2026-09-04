import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class SetupDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @MinLength(8)
  password!: string;
}