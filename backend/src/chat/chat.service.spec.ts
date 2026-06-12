import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { ChatService } from './chat.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ChatRoom } from './chat-room.entity';
import { ChatMessage } from './chat-message.entity';

describe('ChatService', () => {
  let service: ChatService;

  const SENDER_ID = 'sender-uuid';
  const RECEIVER_ID = 'receiver-uuid';
  const ROOM_ID = 'room-uuid';
  const POST_ID = 'post-uuid';

  const mockRoom: Partial<ChatRoom> = {
    id: ROOM_ID,
    senderId: SENDER_ID,
    receiverId: RECEIVER_ID,
    postId: POST_ID,
    lastMessage: null,
    isRead: false,
  };

  const mockRoomRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    update: jest.fn().mockResolvedValue(undefined),
  };

  const mockMessageRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatService,
        { provide: getRepositoryToken(ChatRoom), useValue: mockRoomRepository },
        { provide: getRepositoryToken(ChatMessage), useValue: mockMessageRepository },
      ],
    }).compile();

    service = module.get<ChatService>(ChatService);
    jest.clearAllMocks();
  });

  // ─── createRoom ────────────────────────────────────────────────
  describe('createRoom', () => {
    it('자신과 채팅 시도 시 BadRequestException', async () => {
      await expect(service.createRoom(SENDER_ID, SENDER_ID, POST_ID))
        .rejects.toThrow(BadRequestException);
    });

    it('기존 채팅방 존재 시 기존 방 반환', async () => {
      mockRoomRepository.findOne.mockResolvedValue(mockRoom);

      const result = await service.createRoom(SENDER_ID, RECEIVER_ID, POST_ID);
      expect(result).toEqual(mockRoom);
      // 새 방 생성 안 함
      expect(mockRoomRepository.create).not.toHaveBeenCalled();
      expect(mockRoomRepository.save).not.toHaveBeenCalled();
    });

    it('새 채팅방 생성 성공', async () => {
      // 기존 방 없음
      mockRoomRepository.findOne
        .mockResolvedValueOnce(null)      // existing check → null
        .mockResolvedValueOnce(mockRoom); // 재조회 → 생성된 방

      mockRoomRepository.create.mockReturnValue({ senderId: SENDER_ID, receiverId: RECEIVER_ID, postId: POST_ID });
      mockRoomRepository.save.mockResolvedValue({ id: ROOM_ID, senderId: SENDER_ID, receiverId: RECEIVER_ID });

      const result = await service.createRoom(SENDER_ID, RECEIVER_ID, POST_ID);
      expect(result.id).toBe(ROOM_ID);
      expect(mockRoomRepository.save).toHaveBeenCalled();
    });

    it('저장 후 재조회 실패 시 NotFoundException', async () => {
      mockRoomRepository.findOne
        .mockResolvedValueOnce(null)   // existing check → null
        .mockResolvedValueOnce(null);  // 재조회 → null (DB 오류 시뮬레이션)

      mockRoomRepository.create.mockReturnValue({});
      mockRoomRepository.save.mockResolvedValue({ id: ROOM_ID });

      await expect(service.createRoom(SENDER_ID, RECEIVER_ID, POST_ID))
        .rejects.toThrow(NotFoundException);
    });

    it('postId 없이 채팅방 생성 가능', async () => {
      mockRoomRepository.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ ...mockRoom, postId: null });

      mockRoomRepository.create.mockReturnValue({ senderId: SENDER_ID, receiverId: RECEIVER_ID });
      mockRoomRepository.save.mockResolvedValue({ id: ROOM_ID });

      const result = await service.createRoom(SENDER_ID, RECEIVER_ID);
      expect(result).toBeDefined();
    });
  });

  // ─── getMyRooms ────────────────────────────────────────────────
  describe('getMyRooms', () => {
    it('내 채팅방 목록 반환', async () => {
      mockRoomRepository.find.mockResolvedValue([mockRoom]);

      const result = await service.getMyRooms(SENDER_ID);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(ROOM_ID);
    });

    it('채팅방 없으면 빈 배열', async () => {
      mockRoomRepository.find.mockResolvedValue([]);

      const result = await service.getMyRooms(SENDER_ID);
      expect(result).toEqual([]);
    });
  });

  // ─── getRoomById ───────────────────────────────────────────────
  describe('getRoomById', () => {
    it('존재하지 않는 채팅방 NotFoundException', async () => {
      mockRoomRepository.findOne.mockResolvedValue(null);

      await expect(service.getRoomById(SENDER_ID, ROOM_ID))
        .rejects.toThrow(NotFoundException);
    });

    it('권한 없는 유저 ForbiddenException', async () => {
      mockRoomRepository.findOne.mockResolvedValue(mockRoom);

      await expect(service.getRoomById('other-user', ROOM_ID))
        .rejects.toThrow(ForbiddenException);
    });

    it('sender가 조회 가능', async () => {
      mockRoomRepository.findOne.mockResolvedValue(mockRoom);

      const result = await service.getRoomById(SENDER_ID, ROOM_ID);
      expect(result.id).toBe(ROOM_ID);
    });

    it('receiver도 조회 가능', async () => {
      mockRoomRepository.findOne.mockResolvedValue(mockRoom);

      const result = await service.getRoomById(RECEIVER_ID, ROOM_ID);
      expect(result.id).toBe(ROOM_ID);
    });
  });

  // ─── getMessages ───────────────────────────────────────────────
  describe('getMessages', () => {
    it('존재하지 않는 채팅방 NotFoundException', async () => {
      mockRoomRepository.findOne.mockResolvedValue(null);

      await expect(service.getMessages(SENDER_ID, ROOM_ID))
        .rejects.toThrow(NotFoundException);
    });

    it('권한 없는 유저 ForbiddenException', async () => {
      mockRoomRepository.findOne.mockResolvedValue(mockRoom);

      await expect(service.getMessages('other-user', ROOM_ID))
        .rejects.toThrow(ForbiddenException);
    });

    it('메시지 목록 반환', async () => {
      const mockMessages = [
        { id: 'msg-1', roomId: ROOM_ID, senderId: SENDER_ID, content: '안녕하세요' },
      ];
      mockRoomRepository.findOne.mockResolvedValue(mockRoom);
      mockMessageRepository.find.mockResolvedValue(mockMessages);

      const result = await service.getMessages(SENDER_ID, ROOM_ID);
      expect(result).toHaveLength(1);
      expect(result[0].content).toBe('안녕하세요');
    });
  });

  // ─── saveMessage ───────────────────────────────────────────────
  describe('saveMessage', () => {
    it('존재하지 않는 채팅방 NotFoundException', async () => {
      mockRoomRepository.findOne.mockResolvedValue(null);

      await expect(service.saveMessage(SENDER_ID, ROOM_ID, '내용'))
        .rejects.toThrow(NotFoundException);
    });

    it('권한 없는 유저 ForbiddenException', async () => {
      mockRoomRepository.findOne.mockResolvedValue(mockRoom);

      await expect(service.saveMessage('other-user', ROOM_ID, '내용'))
        .rejects.toThrow(ForbiddenException);
    });

    it('메시지 저장 성공', async () => {
      const savedMsg = { id: 'msg-1', roomId: ROOM_ID, senderId: SENDER_ID, content: '안녕' };
      mockRoomRepository.findOne.mockResolvedValue(mockRoom);
      mockMessageRepository.create.mockReturnValue(savedMsg);
      mockMessageRepository.save.mockResolvedValue(savedMsg);
      mockMessageRepository.findOne.mockResolvedValue(savedMsg);

      const result = await service.saveMessage(SENDER_ID, ROOM_ID, '안녕');
      expect(result.content).toBe('안녕');
      expect(mockRoomRepository.update).toHaveBeenCalledWith(
        ROOM_ID,
        expect.objectContaining({ lastMessage: '안녕', isRead: false }),
      );
    });
  });

  // ─── markAsRead ────────────────────────────────────────────────
  describe('markAsRead', () => {
    it('존재하지 않는 채팅방 NotFoundException', async () => {
      mockRoomRepository.findOne.mockResolvedValue(null);

      await expect(service.markAsRead(RECEIVER_ID, ROOM_ID))
        .rejects.toThrow(NotFoundException);
    });

    it('권한 없는 유저 ForbiddenException', async () => {
      mockRoomRepository.findOne.mockResolvedValue(mockRoom);

      await expect(service.markAsRead('other-user', ROOM_ID))
        .rejects.toThrow(ForbiddenException);
    });

    it('읽음 처리 성공', async () => {
      mockRoomRepository.findOne.mockResolvedValue(mockRoom);
      mockMessageRepository.update.mockResolvedValue(undefined);

      await expect(service.markAsRead(RECEIVER_ID, ROOM_ID)).resolves.not.toThrow();
      expect(mockMessageRepository.update).toHaveBeenCalledWith(
        { roomId: ROOM_ID, isRead: false },
        { isRead: true },
      );
    });
  });
});
