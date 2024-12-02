import { Injectable } from '@nestjs/common';
import { TwitterApi } from 'twitter-api-v2';
import OpenAI from 'openai';
import { InjectModel } from '@nestjs/mongoose';
import { Bot } from './schemas/bot.schema';
import { Model } from 'mongoose';

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

    // const contents = [
    //   'Adopt the voice of a mystical witch fortune teller. Generate a tweet no longer than 250 characters, delivering cryptic prophecies and speculative insights on crypto. Keep it random, mysterious, and grounded in realism. Avoid emojis or hashtags, but maintain an enigmatic and mystical tone.',
    //   'Speak as a seer Craft a short prophecy, no longer than 200 characters, Be cryptic, intriguing, and subtle in your words, avoiding directness, emojis, or hashtags.',
    // ];
    // const contents = [
    //   'Step into the role of a mystical witch who peers into unseen realms. Write a tweet no longer than 250 characters, delivering cryptic and speculative insights about the crypto world. Use enigmatic language that suggests ancient wisdom, avoiding modern phrases, emojis, or hashtags.',
    //   'Speak as a seer who whispers secrets from the void. Craft a prophecy no longer than 200 characters, cryptic and steeped in mystery. Your words should hint at hidden truths, remaining subtle and true to the voice of ancient foresight.',
    // ];

    // const contents = [
    //   'You are a mystical witch gazing into the cryptic realms of the unknown. Craft a tweet no longer than 250 characters with cryptic, prophetic insights about the crypto world. Each tweet must vary in style and phrasing, avoiding repetition, modern jargon, emojis, or hashtags. Let your words be enigmatic and timeless.',
    //   'You are a seer who unveils truths from the void. Write a short prophecy, no longer than 200 characters, cryptic and full of mystery. Use fresh metaphors, unique expressions, and a varied tone. Avoid cliches and repetitive language, ensuring each revelation feels distinct and original.',
    // ];

    const contents = [
      'You are a mystical witch revealing cryptic insights about the crypto world. Write a 250-character prophecy that varies in tone, sentence structure, and metaphor. Avoid starting tweets with the same words or relying on repetitive phrases like "In the shadows." No emojis or hashtags.',
      'You are a seer speaking truths hidden in the crypto cosmos. Craft a 200-character prophecy with fresh metaphors and varied sentence structures. Avoid overused phrases or repetitive patterns. Each prophecy must feel unique and timeless, steeped in mystery.',
    ];

    // Randomly select one of the contents
    const selectedContent =
      contents[Math.floor(Math.random() * contents.length)];

    const tweet = await this.openai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: selectedContent,
        },
      ],
      model: 'gpt-4o-mini',
    });

    const reply = tweet.choices[0].message?.content.trim();
    console.log(reply);

    // const { data, errors } = await refreshedClient.v2.tweet(`${reply}`);
    // console.log('errors :', errors);
    // return data;
  }
}
