// types/express.d.ts
import { Request } from 'express';

declare module 'express' {
  interface Request {
    user?: {
      id: string; // Dựa trên payload của jwtService.signAsync({ id: user.id })
    };
  }
}
