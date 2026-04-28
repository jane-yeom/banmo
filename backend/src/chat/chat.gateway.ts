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
import { ChatService } from './chat.service';
import { NotificationsService } from '../notifications/notifications.service';

interface AuthSocket extends Socket {
  userId?: string;
}

@WebSocketGateway(3002, {
  cors: { origin: '*', credentials: true },
  transports: ['websocket', 'polling'],
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly chatService: ChatService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly notificationsService: NotificationsService,
  ) {}

  afterInit(server: Server) {
    this.notificationsService.setSocketServer(server);
  }

  async handleConnection(client: AuthSocket) {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        console.log('[Chat] 토큰 없음, 연결 거부:', client.id);
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      client.userId = payload.sub;
      client.join(`user:${payload.sub}`);
      console.log('[Chat] 연결됨:', payload.sub, '소켓:', client.id);
    } catch (e: any) {
      console.log('[Chat] 토큰 오류:', e.message, '소켓:', client.id);
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthSocket) {
    console.log('[Chat] 연결해제:', client.id, 'userId:', client.userId);
  }

  @SubscribeMessage('joinRoom')
  async handleJoinRoom(
    @ConnectedSocket() client: AuthSocket,
    @MessageBody() roomId: string,
  ) {
    if (!client.userId) return client.disconnect();
    client.join(`room:${roomId}`);
    console.log('[Chat] 룸 입장:', roomId, 'user:', client.userId);
    return { event: 'joinedRoom', data: { roomId } };
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @ConnectedSocket() client: AuthSocket,
    @MessageBody() body: { roomId: string; content: string },
  ) {
    if (!client.userId) return client.disconnect();
    const { roomId, content } = body;
    console.log('[Chat] 메시지 전송:', roomId, content, 'from:', client.userId);

    const message = await this.chatService.saveMessage(client.userId, roomId, content);
    const receiverId = await this.chatService.getReceiverId(roomId, client.userId);

    // 채팅방 전체에 브로드캐스트
    this.server.to(`room:${roomId}`).emit('newMessage', message);
    // 상대방이 채팅방 밖에 있을 때 알림
    this.server.to(`user:${receiverId}`).emit('roomUpdated', { roomId, lastMessage: content });

    // 채팅 알림 전송 (비동기, 실패해도 무시)
    this.notificationsService
      .sendChatNotification(client.userId, receiverId, roomId, content)
      .catch(() => {});

    return { event: 'messageSent', data: message };
  }

  @SubscribeMessage('markAsRead')
  async handleMarkAsRead(
    @ConnectedSocket() client: AuthSocket,
    @MessageBody() roomId: string,
  ) {
    if (!client.userId) return client.disconnect();
    await this.chatService.markAsRead(client.userId, roomId);
    this.server.to(`room:${roomId}`).emit('messagesRead', { roomId, userId: client.userId });
    console.log('[Chat] 읽음 처리:', roomId, 'user:', client.userId);
    return { event: 'markedAsRead', data: { roomId } };
  }
}
