import { IsString, IsOptional, IsBoolean, IsInt, Min, IsEnum, MaxLength } from 'class-validator';
import { GroupVisibility } from './create-group.dto';

export class UpdateGroupDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsEnum(GroupVisibility)
  visibility?: GroupVisibility;

  @IsOptional()
  @IsBoolean()
  requireApproval?: boolean;

  @IsOptional()
  @IsInt()
  @Min(2)
  maxMembers?: number;
}
