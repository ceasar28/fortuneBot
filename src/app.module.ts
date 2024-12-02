import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BotModule } from './bot/bot.module';
import { TestBotModule } from './test-bot/test-bot.module';
import { DatabaseModule } from './database/database.module';

@Module({
  imports: [BotModule, TestBotModule, DatabaseModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
