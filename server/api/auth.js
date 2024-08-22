import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { OAuth2Client } from 'google-auth-library';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const userSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const registerSchema = userSchema.extend({
  name: z.string().min(2),
});

export default defineEventHandler(async (event) => {
  const prisma = new PrismaClient();

  // Register
  if (event.node.req.method === 'POST' && event.path === '/api/auth') {
    try {
      const body = await readBody(event);
      // Google OAuth
      if (body.token) {
        const ticket = await client.verifyIdToken({
          idToken: body.token,
          audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();

        if (!payload) {
          throw createError({
            statusCode: 401,
            statusMessage: 'Invalid Google token',
          });
        }

        const { sub: googleId, email, name } = payload;

        let user = await prisma.user.findUnique({
          where: { googleId },
        });

        if (!user) {
          user = await prisma.user.create({
            data: { name, email, googleId },
            select: { id: true, name: true, email: true },
          });
        }

        const token = jwt.sign(
          { userId: user.id },
          process.env.JWT_SECRET,
          { expiresIn: '1d' },
        );

        return { user, token };
      }

      // Check if it's a registration request
      else if (body.name) {
        const { name, email, password } = registerSchema.parse(body);

        const existingUser = await prisma.user.findUnique({
          where: { email },
        });
        if (existingUser) {
          throw createError({
            statusCode: 400,
            statusMessage: 'Email already in use',
          });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await prisma.user.create({
          data: { name, email, password: hashedPassword },
          select: { id: true, name: true, email: true },
        });

        const token = jwt.sign(
          { userId: user.id },
          process.env.JWT_SECRET,
          { expiresIn: '1d' },
        );
        return { token, user };
      }
      // Login
      else {
        const { email, password } = userSchema.parse(body);

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
          throw createError({
            statusCode: 401,
            statusMessage: 'Invalid credentials',
          });
        }

        const isValidPassword = await bcrypt.compare(
          password,
          user.password,
        );
        if (!isValidPassword) {
          throw createError({
            statusCode: 401,
            statusMessage: 'Invalid credentials',
          });
        }

        const token = jwt.sign(
          { userId: user.id },
          process.env.JWT_SECRET,
          { expiresIn: '1d' },
        );
        return {
          token,
          user: { id: user.id, name: user.name, email: user.email },
        };
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Invalid input',
          data: error.errors,
        });
      }
      console.error('Auth error:', error);
      throw createError({
        statusCode: 500,
        statusMessage: 'Authentication failed',
      });
    }
  }

  // Get user profile
  if (event.node.req.method === 'GET' && event.path === '/api/auth') {
    try {
      const token = getRequestHeader(event, 'authorization')?.split(
        ' ',
      )[1];
      if (!token) {
        throw createError({
          statusCode: 401,
          statusMessage: 'Unauthorized',
        });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, name: true, email: true },
      });

      if (!user) {
        throw createError({
          statusCode: 401,
          statusMessage: 'User not found',
        });
      }

      return user;
    } catch (error) {
      console.error('Profile error:', error);
      throw createError({
        statusCode: 401,
        statusMessage: 'Invalid or expired token',
      });
    }
  }

  throw createError({
    statusCode: 404,
    statusMessage: 'Not Found',
  });
});
