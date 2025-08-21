import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from './config';
import { User } from './models/User';
import { Conversation } from './models/Conversation';
import { Message } from './models/Message';
import { Types } from 'mongoose';

type AuthedSocket = Socket & { userId?: string };

const onlineMap = new Map<string, string>(); // userId -> socketId

export function setupSockets(io: Server) {
  io.use((socket: AuthedSocket, next) => {
    const token = socket.handshake.auth?.token;
    try {
      const p: any = jwt.verify(token, config.jwtSecret);
      socket.userId = p.id;
      next();
    } catch {
      next(new Error('Unauthorized'));
    }
  });

  io.on('connection', async (socket: AuthedSocket) => {
    const userId = socket.userId!;
    onlineMap.set(userId, socket.id);
    await User.findByIdAndUpdate(userId, { online: true, lastSeen: new Date() });
    io.emit('presence:update', { userId, online: true });

    // message:send {to, text}
    socket.on('message:send', async ({ to, text }, ack) => {
      const from = userId;
      let convo = await Conversation.findOne({ participants: { $all: [from, to] } });
      if (!convo) {
        convo = await Conversation.create({ participants: [from, to] });
      }
      const msg = await Message.create({
        conversation: convo._id,
        from, to, text, status: 'sent'
      });
      convo.lastMessage = msg._id;
      convo.lastMessageAt = new Date();
      await convo.save();

      // deliver to recipient if online
      const toSocket = onlineMap.get(to);
      if (toSocket) {
        io.to(toSocket).emit('message:new', msg);
        // mark delivered
        msg.status = 'delivered';
        msg.deliveredAt = new Date();
        await msg.save();
        // notify sender that delivery status changed
        socket.emit('message:status', { _id: msg._id, status: 'delivered', deliveredAt: msg.deliveredAt });
      }
      ack?.(msg);
    });

    // typing:start|stop {to}
    socket.on('typing:start', ({ to }) => {
      const toSocket = onlineMap.get(to);
      if (toSocket) io.to(toSocket).emit('typing', { from: userId, state: 'start' });
    });
    socket.on('typing:stop', ({ to }) => {
      const toSocket = onlineMap.get(to);
      if (toSocket) io.to(toSocket).emit('typing', { from: userId, state: 'stop' });
    });

    // message:read {messageIds}
    socket.on('message:read', async ({ messageIds }) => {
      const now = new Date();
      const updated = await Message.updateMany(
        { _id: { $in: messageIds.map((id: string) => new Types.ObjectId(id)) }, to: userId, status: { $ne: 'read' } },
        { $set: { status: 'read', readAt: now } }
      );
      // notify senders
      // (simple version: broadcast to all; clients filter)
      io.emit('message:status:bulk', { ids: messageIds, status: 'read', readAt: now });
    });

    socket.on('disconnect', async () => {
      onlineMap.delete(userId);
      await User.findByIdAndUpdate(userId, { online: false, lastSeen: new Date() });
      io.emit('presence:update', { userId, online: false });
    });
  });
}
