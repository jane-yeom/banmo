import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatRoom } from './chat-room.entity';
import { ChatMessage } from './chat-message.entity';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatRoom)
    private readonly roomsRepository: Repository<ChatRoom>,
    @InjectRepository(ChatMessage)
    private readonly messagesRepository: Repository<ChatMessage>,
  ) {}

  async createRoom(senderId: string, receiverId: string, postId?: string): Promise<ChatRoom> {
    if (senderId === receiverId) throw new BadRequestException('자신과 채팅할 수 없습니다.');

    // 이미 존재하는 채팅방 반환
    const where1: Record<string, unknown> = { senderId, receiverId };
    const where2: Record<string, unknown> = { senderId: receiverId, receiverId: senderId };
    if (postId) { where1.postId = postId; where2.postId = postId; }

    const existing = await this.roomsRepository.findOne({ where: [where1 as any, where2 as any] });
    if (existing) return existing;

    const room = this.roomsRepository.create({ senderId, receiverId, postId });
    return this.roomsRepository.save(room);
  }

  async getMyRooms(userId: string): Promise<ChatRoom[]> {
    return this.roomsRepository.find({
      where: [{ senderId: userId }, { receiverId: userId }],
      relations: ['post'],
      order: { lastMessageAt: 'DESC' },
    });
  }

  async getRoomById(userId: string, roomId: string): Promise<ChatRoom> {
    const room = await this.roomsRepository.findOne({
      where: { id: roomId },
      relations: ['post'],
    });
    if (!room) throw new NotFoundException('채팅방을 찾을 수 없습니다.');
    if (room.senderId !== userId && room.receiverId !== userId) {
      throw new ForbiddenException('접근 권한이 없습니다.');
    }
    return room;
  }

  async getMessages(userId: string, roomId: string): Promise<ChatMessage[]> {
    const room = await this.roomsRepository.findOne({ where: { id: roomId } });
    if (!room) throw new NotFoundException('채팅방을 찾을 수 없습니다.');
    if (room.senderId !== userId && room.receiverId !== userId) {
      throw new ForbiddenException('접근 권한이 없습니다.');
    }
    return this.messagesRepository.find({
      where: { roomId },
      order: { createdAt: 'ASC' },
    });
  }

  async saveMessage(senderId: string, roomId: string, content: string): Promise<ChatMessage> {
    const room = await this.roomsRepository.findOne({ where: { id: roomId } });
    if (!room) throw new NotFoundException('채팅방을 찾을 수 없습니다.');
    if (room.senderId !== senderId && room.receiverId !== senderId) {
      throw new ForbiddenException('접근 권한이 없습니다.');
    }

    const message = await this.messagesRepository.save(
      this.messagesRepository.create({ roomId, senderId, content }),
    );

    await this.roomsRepository.update(roomId, {
      lastMessage: content,
      lastMessageAt: new Date(),
      isRead: false,
    });

    return message;
  }

  async markAsRead(userId: string, roomId: string): Promise<void> {
    const room = await this.roomsRepository.findOne({ where: { id: roomId } });
    if (!room) throw new NotFoundException('채팅방을 찾을 수 없습니다.');
    if (room.receiverId !== userId && room.senderId !== userId) {
      throw new ForbiddenException('접근 권한이 없습니다.');
    }

    await this.messagesRepository.update(
      { roomId, isRead: false },
      { isRead: true },
    );
    if (room.receiverId === userId) {
      await this.roomsRepository.update(roomId, { isRead: true });
    }
  }

  async getReceiverId(roomId: string, senderId: string): Promise<string> {
    const room = await this.roomsRepository.findOne({ where: { id: roomId } });
    if (!room) throw new NotFoundException('채팅방을 찾을 수 없습니다.');
    return room.senderId === senderId ? room.receiverId : room.senderId;
  }
}
