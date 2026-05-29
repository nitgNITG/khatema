import { IsBoolean, IsDateString, IsEnum, IsInt, IsOptional, IsString, Max, Min, MinLength } from 'class-validator';

export class CreateKhatmaDto {
  @IsString()
  @MinLength(3)
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(['INDIVIDUAL', 'COLLECTIVE'])
  type: 'INDIVIDUAL' | 'COLLECTIVE';

  @IsEnum(['PUBLIC', 'PRIVATE', 'GROUP_ONLY'])
  visibility: 'PUBLIC' | 'PRIVATE' | 'GROUP_ONLY';

  @IsOptional()
  @IsBoolean()
  requireApproval?: boolean;

  @IsOptional()
  @IsBoolean()
  allowRepeat?: boolean;

  @IsOptional()
  @IsBoolean()
  isContinuous?: boolean;

  @IsOptional()
  @IsBoolean()
  autoRedistribute?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1000)
  maxMembers?: number;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  groupId?: string;
}
