import { Logger } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayInit,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { parse as parseCookie } from 'cookie';
import { Server, Socket } from 'socket.io';
import { SocketEvent } from '../../common/enums/socket-event.enum';
import { ACCESS_COOKIE } from '../auth/auth-cookies.service';
import { AuthTokensService } from '../auth/auth-tokens.service';

@WebSocketGateway({
  namespace: '/events',
  cors: {
    origin: process.env.CORS_ORIGIN
      ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
      : true,
    credentials: true,
  },
})
export class NotificationsGateway
  implements OnGatewayInit, OnGatewayConnection
{
  private readonly logger = new Logger(NotificationsGateway.name);

  constructor(private readonly authTokens: AuthTokensService) {}

  @WebSocketServer()
  server: Server;

  afterInit() {
    this.logger.log('Notification gateway initialized (JWT on connect)');
  }

  async handleConnection(client: Socket) {
    let token = client.handshake.auth?.token as string | undefined;
    const cookieHeader = client.handshake.headers?.cookie;
    if (!token && typeof cookieHeader === 'string') {
      const cookies = parseCookie(cookieHeader);
      token = cookies[ACCESS_COOKIE];
    }
    if (!token) {
      this.logger.warn('Socket rejected: no credentials');
      client.disconnect(true);
      return;
    }
    try {
      await this.authTokens.verifyAccessTokenString(token);
    } catch {
      this.logger.warn('Socket rejected: invalid token');
      client.disconnect(true);
    }
  }

  emit(event: SocketEvent, payload: unknown) {
    this.server.emit(event, payload);
  }
}
