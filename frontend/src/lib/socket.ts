import { io, Socket } from 'socket.io-client';

const WS_URL =
  (typeof process !== 'undefined' && (process.env.NEXT_PUBLIC_WS_URL || process.env.NEXT_PUBLIC_API_URL)) ||
  'http://localhost:3001';

let _socket: Socket | null = null;
let _currentToken: string | null = null;

/**
 * 싱글톤 소켓 반환.
 * 토큰이 바뀌었거나 연결이 끊겼으면 새로 생성.
 */
export function getSocket(token: string): Socket {
  if (_socket && _currentToken === token && _socket.connected) {
    return _socket;
  }

  // 기존 연결 정리
  if (_socket) {
    _socket.removeAllListeners();
    _socket.disconnect();
    _socket = null;
  }

  _currentToken = token;
  _socket = io(WS_URL, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  _socket.on('connect', () => {
    console.log('[Socket] 연결됨:', _socket?.id);
  });

  _socket.on('disconnect', (reason) => {
    console.log('[Socket] 연결해제:', reason);
  });

  _socket.on('connect_error', (error) => {
    console.error('[Socket] 연결오류:', error.message);
  });

  return _socket;
}

/**
 * 소켓 연결 해제 (로그아웃 등)
 */
export function disconnectSocket(): void {
  if (_socket) {
    _socket.removeAllListeners();
    _socket.disconnect();
    _socket = null;
    _currentToken = null;
  }
}

/**
 * 현재 소켓 인스턴스 반환 (연결 안 되어 있으면 null)
 */
export function currentSocket(): Socket | null {
  return _socket;
}
