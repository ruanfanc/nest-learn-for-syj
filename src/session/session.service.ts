import { Injectable } from '@nestjs/common';

export interface session {
  sessionId: string;
  chatId?: string;
  isActive: boolean;
  heartbeatInterval?: NodeJS.Timeout;
}

@Injectable()
export class SessionService {
  // 创建一个Map对象存储姓名和socketId
  sessions: Map<string, session>;
  constructor() {
    this.sessions = new Map<string, session>();
  }
  // 返回socketid
  findSession(id: string): session | undefined {
    return this.sessions.get(id);
  }
  // 保存socketid
  saveSession(
    id: string,
    {
      sessionId,
      isActive = true,
      heartbeatInterval,
    }: {
      sessionId: string;
      isActive?: boolean;
      heartbeatInterval?: NodeJS.Timeout;
    },
  ): void {
    this.sessions.set(id, { sessionId, isActive, heartbeatInterval });
  }
  // 删除sessions
  deleteSession(id: string): void {
    this.sessions.delete(id);
  }
  // // 保存chatId
  // saveChatId(userName: string, chatId: string): void {
  //   const session = this.sessions.get(userName)!;
  //   this.sessions.set(userName, { ...session, chatId });
  // }
  // 返回chatId
  // findChatId(userName: string): string | undefined {
  //   return this.sessions.get(userName)?.chatId;
  // }
}
