import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

@Schema({
  strict: true,
  timestamps: true,
  versionKey: false,
})
export class Bot {
  @Prop()
  codeVerifier: string;

  @Prop()
  state: string;

  @Prop()
  accessToken: string;

  @Prop()
  refreshToken: string;
}

export type BotDocument = HydratedDocument<Bot>;
export const BotSchema = SchemaFactory.createForClass(Bot);
