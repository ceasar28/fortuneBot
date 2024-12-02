import { Injectable } from '@nestjs/common';
import * as Twit from 'twit';

@Injectable()
export class BotService {
  private readonly twitterBot: Twit;
  constructor() {
    this.twitterBot = new Twit({
      consumer_key: '...',
      consumer_secret: '...',
      access_token: '...',
      access_token_secret: '...',
      timeout_ms: 60 * 1000, // optional HTTP request timeout to apply to all requests.
      strictSSL: true, // optional - requires SSL certificates to be valid.
    });
  }

  async postTweeets(tweetContent: string) {
    try {
      this.twitterBot.post(
        'statuses/update',
        { status: `${tweetContent}` },
        function (err, data, response) {
          console.log(data);
          return response;
        },
      );
      return;
    } catch (error) {
      console.error(error);
    }
  }
}
