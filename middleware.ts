import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { MonitoringService } from '@/lib/monitoring';
import logger from '@/lib/logger';

export function middleware(request: NextRequest) {
  const start = Date.now();
  const { pathname, search } = request.nextUrl;
  const userAgent = request.headers.get('user-agent') || '';
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
  
  // Log request
  logger.info('Request received', {
    method: request.method,
    url: pathname + search,
    userAgent,
    ip,
  });
  
  const response = NextResponse.next();
  
  // Add correlation ID
  const correlationId = crypto.randomUUID();
  response.headers.set('x-correlation-id', correlationId);
  
  // Log response time
  const duration = Date.now() - start;
  MonitoringService.timing('http.request.duration', duration, [
    `method:${request.method}`,
    `path:${pathname}`,
  ]);
  
  return response;
}

export const config = {
  matcher: [
    '/((?!api/health|_next/static|_next/image|favicon.ico).*)',
  ],
};