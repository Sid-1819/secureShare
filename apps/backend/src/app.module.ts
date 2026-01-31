import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MetricsModule } from './metrics/metrics.module';
import { NotesModule } from './notes/notes.module';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';

@Module({
  imports: [MetricsModule, PrismaModule, RedisModule, NotesModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
