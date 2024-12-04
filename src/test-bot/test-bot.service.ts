import { Injectable } from '@nestjs/common';
import { TwitterApi } from 'twitter-api-v2';
import OpenAI from 'openai';
import { InjectModel } from '@nestjs/mongoose';
import { Bot } from './schemas/bot.schema';
import { Model } from 'mongoose';
import { darkSpecter2 } from './Agents/darkSpecter.agent';

@Injectable()
export class TestBotService {
  private readonly twitterClient: TwitterApi;
  private readonly callbackURL = `${process.env.CALLBACK_URL}`;
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
      //   console.log(reply);
      return { reply };
    } catch (error) {
      console.error('Error generating reply:', error.message);
      return 'There was an error processing your request.';
    }
  }

  async postTweet(): Promise<any> {
    const dbSnapshot = await this.BotModel.find();
    const { refreshToken } = dbSnapshot[0];

    // // Refresh the access token
    const {
      client: refreshedClient,
      accessToken,
      refreshToken: newRefreshToken,
    } = await this.twitterClient.refreshOAuth2Token(refreshToken);

    // // Update tokens
    await this.BotModel.updateOne(
      { _id: dbSnapshot[0]._id },
      {
        accessToken,
        refreshToken: newRefreshToken,
      },
    );

    // Generate dynamic content for tweet prompts
    const contents = `
    You are ${darkSpecter2.name}, a cryptic hacker known for revealing hidden truths and dismantling digital lies. 
    Craft a 250-character message that:
    - Explores topics like ${darkSpecter2.topics.join(', ')}.
    - Reflects a tone that is ${darkSpecter2.adjectives.join(', ')}.
    - Avoids repetitive phrases or overused metaphors.
    Examples of your messages:
    - "${darkSpecter2.postExamples[0]}"
    - "${darkSpecter2.postExamples[1]}"
    - "${darkSpecter2.postExamples[2]}"
  `;

    // Generate the tweet using the AI
    const tweet = await this.openai.chat.completions.create({
      messages: [
        {
          role: 'assistant',
          content: contents,
        },
        {
          role: 'user',
          content:
            'Generate a tweet based on the provided guidance. let the fonts be fantasy fonts',
        },
      ],
      model: 'gpt-4',
    });

    const reply = tweet.choices[0].message?.content.trim();

    console.log(reply);
    // return reply;
    const { data } = await refreshedClient.v2.tweet(`${reply}`, {
      reply_settings: 'mentionedUsers',
    });

    return data;
  }
}
