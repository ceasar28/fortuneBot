import { Test, TestingModule } from '@nestjs/testing';
import { TestBotController } from './test-bot.controller';

describe('TestBotController', () => {
  let controller: TestBotController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TestBotController],
    }).compile();

    controller = module.get<TestBotController>(TestBotController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
