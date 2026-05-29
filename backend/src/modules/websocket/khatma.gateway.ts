import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { OnEvent } from '@nestjs/event-emitter';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: { origin: '*', credentials: true },
  transports: ['websocket'],
})
export class KhatmaGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(KhatmaGateway.name);

  constructor(
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token || client.handshake.headers?.authorization?.replace('Bearer ', '');
      if (!token) { client.disconnect(); return; }

      const payload = this.jwt.verify(token, {
        secret: this.config.get<string>('JWT_SECRET', 'dev-secret'),
      });

      client.data.userId = payload.sub;
      this.logger.log(`Client connected: ${client.id} (user: ${payload.sub})`);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join_khatma')
  handleJoinKhatma(@ConnectedSocket() client: Socket, @MessageBody() data: { khatmaId: string }) {
    client.join(`khatma:${data.khatmaId}`);
    client.emit('joined_khatma', { khatmaId: data.khatmaId });
  }

  @SubscribeMessage('leave_khatma')
  handleLeaveKhatma(@ConnectedSocket() client: Socket, @MessageBody() data: { khatmaId: string }) {
    client.leave(`khatma:${data.khatmaId}`);
  }

  // Listen to internal events and broadcast to room
  @OnEvent('part.reserved')
  handlePartReserved(payload: { khatmaId: string; partId: string; partNumber: number; userId: string }) {
    this.server.to(`khatma:${payload.khatmaId}`).emit('part_reserved', {
      partId: payload.partId,
      partNumber: payload.partNumber,
      reservedBy: { id: payload.userId },
    });
  }

  @OnEvent('part.completed')
  handlePartCompleted(payload: { khatmaId: string; partId: string; partNumber: number; userId: string; khatmaCompletionPercentage: number }) {
    this.server.to(`khatma:${payload.khatmaId}`).emit('part_completed', {
      partId: payload.partId,
      partNumber: payload.partNumber,
      completedBy: { id: payload.userId },
      khatmaCompletionPercentage: payload.khatmaCompletionPercentage,
    });
  }

  @OnEvent('khatma.completed')
  handleKhatmaCompleted(payload: { khatmaId: string; completedAt: Date }) {
    this.server.to(`khatma:${payload.khatmaId}`).emit('khatma_completed', {
      khatmaId: payload.khatmaId,
      completedAt: payload.completedAt,
    });
  }

  @OnEvent('khatma.restarted')
  handleKhatmaRestarted(payload: { khatmaId: string; iteration: number }) {
    this.server.to(`khatma:${payload.khatmaId}`).emit('khatma_restarted', payload);
  }
}
