import type { Request, Response } from 'express';
import handler from '../src/main';

export default async function (req: Request, res: Response) {
  return handler(req, res);
}
