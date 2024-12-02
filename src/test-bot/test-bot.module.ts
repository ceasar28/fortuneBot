import { Module } from '@nestjs/common';
import { TestBotService } from './test-bot.service';
import { TestBotController } from './test-bot.controller';
import { DatabaseModule } from 'src/database/database.module';
import { MongooseModule } from '@nestjs/mongoose';
import { Bot, BotSchema } from './schemas/bot.schema';

@Module({
  providers: [TestBotService],
  controllers: [TestBotController],
  imports: [
    DatabaseModule,
    MongooseModule.forFeature([{ name: Bot.name, schema: BotSchema }]),
  ],
})
export class TestBotModule {}
