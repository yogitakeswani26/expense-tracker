import { Request, Response, NextFunction } from 'express';

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  const requestId = req.get('x-request-id') || Math.random().toString(36).substr(2, 9);

  // Log request
  console.log(`[${requestId}] ${req.method} ${req.path} - Started`);

  // Intercept res.send to log response
  const originalSend = res.send;

  res.send = function (data: any) {
    const duration = Date.now() - start;
    console.log(
      `[${requestId}] ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`
    );

    return originalSend.call(this, data);
  };

  next();
};

export const requestIdMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const requestId = req.get('x-request-id') || Math.random().toString(36).substr(2, 9);
  res.setHeader('x-request-id', requestId);
  (req as any).requestId = requestId;
  next();
};
