import { Test, TestingModule } from '@nestjs/testing';
import { TestBotService } from './test-bot.service';

describe('TestBotService', () => {
  let service: TestBotService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TestBotService],
    }).compile();

    service = module.get<TestBotService>(TestBotService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
