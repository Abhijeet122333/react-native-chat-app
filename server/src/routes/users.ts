import { Router } from 'express';
import { auth, AuthedRequest } from '../middleware/auth';
import { User } from '../models/User';
import { Message } from '../models/Message';
import { Conversation } from '../models/Conversation';
import { Types } from 'mongoose';

const r = Router();

// GET /users -> all except me, with last message preview
r.get('/users', auth, async (req: AuthedRequest, res) => {
  const me = new Types.ObjectId(req.user!.id);

  const users = await User.find({ _id: { $ne: me } })
    .select('_id username online lastSeen')
    .lean();

  // last message with each user (simplified)
  const previews = await Promise.all(users.map(async (u) => {
    const convo = await Conversation.findOne({
      participants: { $all: [me, u._id] }
    }).populate('lastMessage');
    return {
      user: u,
      lastMessage: convo?.lastMessage ? {
        text: (convo as any).lastMessage.text,
        at: (convo as any).lastMessage.createdAt
      } : null
    };
  }));

  res.json(previews);
});

// GET /conversations/:otherId/messages
r.get('/conversations/:otherId/messages', auth, async (req: AuthedRequest, res) => {
  const me = req.user!.id;
  const other = req.params.otherId;

  const convo = await Conversation.findOne({
    participants: { $all: [me, other] }
  });

  if (!convo) return res.json([]);

  const msgs = await Message.find({ conversation: convo._id })
    .sort({ createdAt: 1 })
    .lean();

  res.json(msgs);
});

export default r;
