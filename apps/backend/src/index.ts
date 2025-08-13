import 'dotenv/config';
import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import { Server as SocketIOServer } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import Redis from 'ioredis';

const prisma = new PrismaClient();
const redisUrl = process.env.REDIS_URL;
const redis = redisUrl ? new Redis(redisUrl) : null;

const app = express();
app.use(cors({ origin: '*'}));
app.use(helmet());
app.use(express.json());

const server = http.createServer(app);
const io = new SocketIOServer(server, { cors: { origin: '*' } });

const jwtSecret = process.env.JWT_SECRET || 'dev_secret_change_me';

function signToken(userId: string) {
  return jwt.sign({ sub: userId }, jwtSecret, { expiresIn: '7d' });
}

async function authMiddleware(req: express.Request, res: express.Response, next: express.NextFunction) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'Unauthorized' });
  const token = auth.replace('Bearer ', '');
  try {
    const payload = jwt.verify(token, jwtSecret) as { sub: string };
    (req as any).userId = payload.sub;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

app.get('/health', (_req, res) => res.json({ ok: true }));

app.post('/api/auth/register', async (req, res) => {
  const Schema = z.object({ email: z.string().email(), password: z.string().min(6), displayName: z.string().min(1) });
  const body = Schema.safeParse(req.body);
  if (!body.success) return res.status(400).json({ error: body.error.flatten() });
  const { email, password, displayName } = body.data;
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return res.status(409).json({ error: 'Email in use' });
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({ data: { email, passwordHash, displayName } });
  const token = signToken(user.id);
  return res.json({ token, user: { id: user.id, email: user.email, displayName: user.displayName } });
});

app.post('/api/auth/login', async (req, res) => {
  const Schema = z.object({ email: z.string().email(), password: z.string().min(6) });
  const body = Schema.safeParse(req.body);
  if (!body.success) return res.status(400).json({ error: body.error.flatten() });
  const { email, password } = body.data;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
  const token = signToken(user.id);
  return res.json({ token, user: { id: user.id, email: user.email, displayName: user.displayName } });
});

app.get('/api/conversations', authMiddleware, async (req, res) => {
  const userId = (req as any).userId as string;
  const convos = await prisma.conversation.findMany({
    where: { participants: { some: { userId } } },
    include: { participants: { include: { user: { select: { id: true, displayName: true, avatarUrl: true } } } }, messages: { take: 1, orderBy: { createdAt: 'desc' } } }
  });
  res.json({ conversations: convos });
});

app.post('/api/conversations', authMiddleware, async (req, res) => {
  const Schema = z.object({ participantIds: z.array(z.string()).optional().default([]), title: z.string().optional() });
  const body = Schema.safeParse(req.body);
  if (!body.success) return res.status(400).json({ error: body.error.flatten() });
  const userId = (req as any).userId as string;
  const participantIds = Array.from(new Set([userId, ...body.data.participantIds]));
  const convo = await prisma.conversation.create({
    data: {
      isGroup: participantIds.length > 2,
      title: body.data.title,
      participants: { create: participantIds.map(id => ({ userId: id })) }
    },
    include: { participants: true }
  });
  res.json({ conversation: convo });
});

app.get('/api/conversations/:id/messages', authMiddleware, async (req, res) => {
  const userId = (req as any).userId as string;
  const convoId = req.params.id;
  const member = await prisma.conversationParticipant.findFirst({ where: { conversationId: convoId, userId } });
  if (!member) return res.status(403).json({ error: 'Forbidden' });
  const messages = await prisma.message.findMany({ where: { conversationId: convoId }, orderBy: { createdAt: 'asc' } });
  res.json({ messages });
});

io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error('unauthorized'));
  try {
    const payload = jwt.verify(token, jwtSecret) as { sub: string };
    (socket as any).userId = payload.sub;
    next();
  } catch (e) {
    next(new Error('unauthorized'));
  }
});

io.on('connection', (socket) => {
  const userId = (socket as any).userId as string;
  socket.join(`user:${userId}`);

  socket.on('joinConversation', async (conversationId: string) => {
    const membership = await prisma.conversationParticipant.findFirst({ where: { conversationId, userId } });
    if (!membership) return;
    socket.join(`conversation:${conversationId}`);
  });

  socket.on('sendMessage', async (payload: { conversationId: string; content: string }) => {
    const { conversationId, content } = payload;
    const membership = await prisma.conversationParticipant.findFirst({ where: { conversationId, userId } });
    if (!membership) return;
    const message = await prisma.message.create({ data: { conversationId, senderId: userId, content } });
    io.to(`conversation:${conversationId}`).emit('message', message);
  });

  socket.on('disconnect', () => {
    // No-op for now
  });
});

const PORT = Number(process.env.PORT || 4000);
server.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`);
});