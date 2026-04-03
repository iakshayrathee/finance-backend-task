import { Request, Response } from 'express';
import { liveService } from './live.service';

export const liveController = {
  /**
   * SSE endpoint — streams backend activity events to connected clients.
   * Client connects with GET /api/live/events?token=<accessToken>
   */
  streamEvents: (req: Request, res: Response): void => {
    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // disable nginx buffering
    res.flushHeaders();

    // Send initial connection confirmation
    const connected = {
      id:        crypto.randomUUID(),
      type:      'system.connected',
      timestamp: new Date().toISOString(),
      actor:     'system' as const,
      payload:   { clientCount: liveService.clientCount + 1, message: 'Connected to live event stream' },
    };
    res.write(`data: ${JSON.stringify(connected)}\n\n`);

    // Register this client
    liveService.subscribe(res);

    // Heartbeat comment every 25 seconds (keeps connection alive through proxies)
    const heartbeat = setInterval(() => {
      try {
        res.write(': heartbeat\n\n');
      } catch {
        clearInterval(heartbeat);
      }
    }, 25_000);

    // Clean up when client disconnects
    req.on('close', () => {
      clearInterval(heartbeat);
      liveService.unsubscribe(res);
    });
  },
};
