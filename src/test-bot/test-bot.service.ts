import { Injectable } from '@nestjs/common';
import { TwitterApi } from 'twitter-api-v2';
import OpenAI from 'openai';
import { InjectModel } from '@nestjs/mongoose';
import { Bot } from './schemas/bot.schema';
import { Model } from 'mongoose';

@Injectable()
export class TestBotService {
  private readonly twitterClient: TwitterApi;
  private readonly callbackURL = 'http://127.0.0.1:5000/test-bot/callback';
  private readonly openai: OpenAI;

  constructor(
    @InjectModel(Bot.name)
    private readonly BotModel: Model<Bot>,
  ) {
    // Initialize Twitter API client
    this.twitterClient = new TwitterApi({
      clientId: process.env.YOUR_CLIENT_ID,
      clientSecret: process.env.YOUR_CLIENT_SECRET,
    });

    // Initialize OpenAI API client
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY, // This is the default and can be omitted
    });
  }

  async generateAuthUrl(): Promise<string> {
    const { url, codeVerifier, state } =
      this.twitterClient.generateOAuth2AuthLink(this.callbackURL, {
        scope: ['tweet.read', 'tweet.write', 'users.read', 'offline.access'],
      });

    // Store verifier and state
    await this.BotModel.deleteMany(); // delete first before saving
    await this.BotModel.create({ codeVerifier, state });
    return url;
  }

  async handleCallback(state: string, code: string): Promise<any> {
    const dbSnapshot = await this.BotModel.find();
    const { codeVerifier, state: storedState } = dbSnapshot[0];

    if (state !== storedState) {
      throw new Error('Stored tokens do not match!');
    }

    const {
      client: loggedClient,
      accessToken,
      refreshToken,
    } = await this.twitterClient.loginWithOAuth2({
      code,
      codeVerifier,
      redirectUri: this.callbackURL,
    });

    // Store access and refresh tokens
    await this.BotModel.updateOne(
      { _id: dbSnapshot[0]._id },
      {
        accessToken,
        refreshToken,
      },
    );

    // Fetch authenticated user details
    const { data } = await loggedClient.v2.me();
    return data;
  }

  async foturneAI(prompt: string): Promise<any> {
    try {
      const response = await this.openai.chat.completions.create({
        messages: [
          {
            role: 'system',
            content:
              'Act as a fortune telling witch and reply prompts with maximum of 100 character lenght reply',
          },
          { role: 'user', content: `${prompt.trim()}` },
        ],
        model: 'gpt-4o-mini',
      });
      const reply = response.choices[0].message?.content.trim();
      console.log(reply);
      return { reply };
    } catch (error) {
      console.error('Error generating reply:', error.message);
      return 'There was an error processing your request.';
    }
  }

  async postTweet(): Promise<any> {
    const dbSnapshot = await this.BotModel.find();
    const { refreshToken } = dbSnapshot[0];

    // Refresh the access token
    const {
      client: refreshedClient,
      accessToken,
      refreshToken: newRefreshToken,
    } = await this.twitterClient.refreshOAuth2Token(refreshToken);

    console.log('client :', refreshedClient);
    console.log('acceToken :', accessToken);
    console.log('refreshToken :', newRefreshToken);

    // Update tokens
    await this.BotModel.updateOne(
      { _id: dbSnapshot[0]._id },
      {
        accessToken,
        refreshToken: newRefreshToken,
      },
    );

    const tweet = await this.openai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content:
            'Act act a fortune telling witch and generate tweet with maximum of 100 character lenght and a hashtag: #FortuneTales.. let the tweets be unique',
        },
      ],
      model: 'gpt-4o-mini',
    });
    const reply = tweet.choices[0].message?.content.trim();
    console.log(reply);

    const { data, errors } = await refreshedClient.v2.tweet(`${reply}`);
    console.log('errors :', errors);
    return data;
  }
}
