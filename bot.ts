// import { Injectable } from '@nestjs/common';
// import * as admin from 'firebase-admin';
// import { TwitterApi } from 'twitter-api-v2';
// import { Configuration, OpenAIApi } from 'openai';

// @Injectable()
// export class TwitterService {
//   private dbRef = admin.firestore().doc('tokens/demo');
//   private twitterClient: TwitterApi;
//   private callbackURL = 'http://127.0.0.1:5000/callback';
//   private openai: OpenAIApi;

//   constructor() {
//     // Initialize Firebase Admin SDK
//     admin.initializeApp();

//     // Initialize Twitter API client
//     this.twitterClient = new TwitterApi({
//       clientId: 'YOUR_CLIENT_ID',
//       clientSecret: 'YOUR_CLIENT_SECRET',
//     });

//     // Initialize OpenAI API client
//     const openAIConfig = new Configuration({
//       organization: 'YOUR_OPENAI_ORG',
//       apiKey: 'YOUR_OPENAI_SECRET',
//     });
//     this.openai = new OpenAIApi(openAIConfig);
//   }

//   async generateAuthUrl(): Promise<string> {
//     const { url, codeVerifier, state } =
//       this.twitterClient.generateOAuth2AuthLink(this.callbackURL, {
//         scope: ['tweet.read', 'tweet.write', 'users.read', 'offline.access'],
//       });

//     // Store verifier and state in Firestore
//     await this.dbRef.set({ codeVerifier, state });
//     return url;
//   }

//   async handleCallback(state: string, code: string): Promise<any> {
//     const dbSnapshot = await this.dbRef.get();
//     const { codeVerifier, state: storedState } = dbSnapshot.data();

//     if (state !== storedState) {
//       throw new Error('Stored tokens do not match!');
//     }

//     const {
//       client: loggedClient,
//       accessToken,
//       refreshToken,
//     } = await this.twitterClient.loginWithOAuth2({
//       code,
//       codeVerifier,
//       redirectUri: this.callbackURL,
//     });

//     // Store access and refresh tokens in Firestore
//     await this.dbRef.set({ accessToken, refreshToken });

//     // Fetch authenticated user details
//     const { data } = await loggedClient.v2.me();
//     return data;
//   }

//   async postTweet(): Promise<any> {
//     const dbSnapshot = await this.dbRef.get();
//     const { refreshToken } = dbSnapshot.data();

//     // Refresh the access token
//     const {
//       client: refreshedClient,
//       accessToken,
//       refreshToken: newRefreshToken,
//     } = await this.twitterClient.refreshOAuth2Token(refreshToken);

//     // Update tokens in Firestore
//     await this.dbRef.set({ accessToken, refreshToken: newRefreshToken });

//     // Generate a tweet using OpenAI
//     const nextTweet = await this.openai.createCompletion({
//       model: 'text-davinci-001',
//       prompt: 'tweet something cool for #techtwitter',
//       max_tokens: 64,
//     });

//     const { data } = await refreshedClient.v2.tweet(
//       nextTweet.data.choices[0].text.trim(),
//     );
//     return data;
//   }
// }
