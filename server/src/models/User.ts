import { Schema, model } from 'mongoose';
import bcrypt from 'bcrypt';

interface IUser {
  username: string;
  password: string;
  online: boolean;
  lastSeen?: Date;
}

const userSchema = new Schema<IUser>({
  username: { type: String, unique: true, required: true, index: true },
  password: { type: String, required: true },
  online: { type: Boolean, default: false },
  lastSeen: Date
}, { timestamps: true });

userSchema.pre('save', async function(next) {
  const user: any = this;
  if (!user.isModified('password')) return next();
  user.password = await bcrypt.hash(user.password, 10);
  next();
});

userSchema.methods.compare = function(pw: string) {
  return bcrypt.compare(pw, (this as any).password);
};

export const User = model<IUser>('User', userSchema);
export type { IUser };
