import { Schema, model, Types } from 'mongoose';

interface IConversation {
  participants: Types.ObjectId[];   // [userA, userB]
  lastMessage?: Types.ObjectId;
  lastMessageAt?: Date;
}

const conversationSchema = new Schema<IConversation>({
  participants: [{ type: Schema.Types.ObjectId, ref: 'User', required: true }],
  lastMessage: { type: Schema.Types.ObjectId, ref: 'Message' },
  lastMessageAt: Date
}, { timestamps: true });

conversationSchema.index({ participants: 1 }, { unique: false });

export const Conversation = model<IConversation>('Conversation', conversationSchema);
export type { IConversation };
