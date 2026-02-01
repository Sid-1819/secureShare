import {
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  IsDateString,
  IsInt,
  Min,
  Max,
  ValidateIf,
  ValidateBy,
} from 'class-validator';
import { Transform } from 'class-transformer';

const CONTENT_MAX_LENGTH = 1_048_576; // 1MB
const MAX_VIEWS_CAP = 1000;

function isFutureDate(value: unknown): boolean {
  if (value == null || value === '') return true;
  const date = new Date(value as string);
  return !Number.isNaN(date.getTime()) && date.getTime() > Date.now();
}

const IsFutureDate = () =>
  ValidateBy({
    name: 'isFutureDate',
    validator: { validate: isFutureDate, defaultMessage: () => 'expiresAt must be a future date' },
  });

export class CreateNoteDto {
  @IsString()
  @IsNotEmpty({ message: 'content must not be empty' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @MaxLength(CONTENT_MAX_LENGTH, {
    message: `content must not exceed ${CONTENT_MAX_LENGTH} characters`,
  })
  content!: string;

  @IsOptional()
  @IsDateString()
  @IsFutureDate()
  @ValidateIf((_o, v) => v != null && v !== '')
  expiresAt?: string;

  @IsOptional()
  @IsInt()
  @Min(1, { message: 'maxViews must be at least 1' })
  @Max(MAX_VIEWS_CAP, { message: `maxViews must not exceed ${MAX_VIEWS_CAP}` })
  @Transform(({ value }) => (value != null ? Number(value) : value))
  maxViews?: number;
}
