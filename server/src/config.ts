import 'dotenv/config';
export const config = {
  port: Number(process.env.PORT) || 4000,
  mongo: process.env.MONGO_URI!,
  jwtSecret: process.env.JWT_SECRET!,
  clientOrigin: process.env.CLIENT_ORIGIN || '*'
};
