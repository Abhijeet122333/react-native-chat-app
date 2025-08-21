import { Schema, model, Types } from 'mongoose';

type Delivery = 'sent' | 'delivered' | 'read';

interface IMessage {
  conversation: Types.ObjectId;
  from: Types.ObjectId;
  to: Types.ObjectId;
  text: string;
  deliveredAt?: Date;
  readAt?: Date;
  status: Delivery; // sent, delivered, read
}

const messageSchema = new Schema<IMessage>({
  conversation: { type: Schema.Types.ObjectId, ref: 'Conversation', required: true },
  from: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  to: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true },
  deliveredAt: Date,
  readAt: Date,
  status: { type: String, default: 'sent' }
}, { timestamps: true });

export const Message = model<IMessage>('Message', messageSchema);
export type { IMessage };
