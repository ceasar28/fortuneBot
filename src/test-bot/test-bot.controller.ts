import { Body, Controller, Get, Post, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { TestBotService } from './test-bot.service';

@Controller('fortune-bot')
export class TestBotController {
  constructor(private readonly testBotService: TestBotService) {}

  @Get('auth')
  async auth(@Res() res: Response): Promise<void> {
    const authUrl = await this.testBotService.generateAuthUrl();
    res.redirect(authUrl);
  }

  @Get('callback')
  async callback(
    @Query('state') state: string,
    @Query('code') code: string,
  ): Promise<any> {
    console.log(state, code);
    return this.testBotService.handleCallback(state, code);
  }

  @Get('tweet')
  async tweet(): Promise<any> {
    return this.testBotService.postTweet();
  }

  @Post('fortune')
  async fortune(@Body() body: any): Promise<any> {
    return this.testBotService.foturneAI(body.prompt);
  }

  @Post('skynet')
  async skynet(@Body() body: any): Promise<any> {
    return this.testBotService.skynetAGI(body.prompt);
  }

  @Get('skynet')
  async skynetPost(): Promise<any> {
    return this.testBotService.skynetAGI_Post();
  }
}
