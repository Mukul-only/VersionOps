import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from './config/config.module';
import { LoggerModule } from './logger/logger.module';
import { PrismaModule } from './prisma/prisma.module';
import { CollegeModule } from './modules/college/college.module';
import { ParticipantModule } from './modules/participant/participant.module';
import { EventModule } from './modules/event/event.module';
import { EventParticipationModule } from './modules/event-participation/event-participation.module';
import { EventResultModule } from './modules/event-result/event-result.module';
import { LeaderboardModule } from './modules/leaderboard/leadeboard.module';
import { UserModule } from './modules/user/user.module';
import { AdminSeedService } from './prisma/seed/admin.seed';
import { AuthModule } from './modules/auth/auth.module';

@Module({
  imports: [
    ConfigModule,
    LoggerModule,
    PrismaModule,
    CollegeModule,
    ParticipantModule,
    EventModule,
    EventParticipationModule,
    EventResultModule,
    LeaderboardModule,
    UserModule,
    AuthModule,
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 60,
          limit: 100,
        },
      ],
    }),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    AdminSeedService,
  ],
})
export class AppModule {}
