import jwt from 'jsonwebtoken';

export default defineEventHandler(async (event) => {
  const { req } = event.node;
  const prisma = event.context.prisma;

  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, name: true, email: true },
    });
    if (user) {
      event.context.user = user;
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
  }
});
