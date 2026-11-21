import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import configuration from './config/configuration';
import { validateEnvironment } from './config/environment';
import { DatabaseModule } from './database/database.module';
import { UserDBModule } from './database/users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      envFilePath: ['.env', '../.env'],
      load: [configuration],
      validate: validateEnvironment,
    }),
    AuthModule,
    DatabaseModule,
    UserDBModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
