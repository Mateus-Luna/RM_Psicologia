import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class SetupDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @MinLength(8)
  @IsNotEmpty()
  password!: string;

  @IsString()
  @IsNotEmpty()
  crp!: string;
}