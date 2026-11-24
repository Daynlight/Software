import 'reflect-metadata';
import { plainToInstance, Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  Min,
  MinLength,
  validateSync,
} from 'class-validator';

export class EnvironmentVariables {
  @IsUrl({ protocols: ['https'], require_protocol: true })
  USOS_API_BASE_URL: string;

  @IsString()
  @IsNotEmpty()
  USOS_CONSUMER_KEY: string;

  @IsString()
  @IsNotEmpty()
  USOS_CONSUMER_SECRET: string;

  @IsUrl({
    protocols: ['http', 'https'],
    require_protocol: true,
    require_tld: false,
  })
  USOS_CALLBACK_URL: string;

  @IsUrl({
    protocols: ['http', 'https'],
    require_protocol: true,
    require_tld: false,
  })
  FRONTEND_URL: string;

  @IsString()
  @MinLength(32)
  SESSION_SECRET: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(65535)
  PORT: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(60)
  SESSION_TTL_SECONDS: number;

  @IsOptional()
  @IsString()
  USOS_SCOPES: string;

  @IsString()
  @IsNotEmpty()
  DB_HOST: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(65535)
  DB_PORT: number;

  @IsString()
  @IsNotEmpty()
  DB_USER: string;

  @IsOptional()
  @IsString()
  DB_PASSWORD: string;

  @IsString()
  @IsNotEmpty()
  DB_DATABASE: string;
}

export function validateEnvironment(
  config: Record<string, unknown>,
): Record<string, unknown> {
  const environment = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(environment, { whitelist: true });

  if (errors.length > 0) {
    const details = errors
      .map((error) => Object.values(error.constraints).join(', '))
      .join('; ');

    throw new Error(`Invalid environment configuration: ${details}`);
  }

  return config;
}
