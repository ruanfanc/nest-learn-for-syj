import { Injectable } from '@nestjs/common';

export interface session {
  id: string;
  chatId?: string;
}

@Injectable()
export class SessionService {
  // 创建一个Map对象存储姓名和socketId
  sessions: Map<string, session>;
  constructor() {
    this.sessions = new Map<string, session>();
  }
  // 返回socketid
  findSession(id: string): string | undefined {
    return this.sessions.get(id)?.id;
  }
  // 保存socketid
  saveSession(id: string, sessionId: string): void {
    this.sessions.set(id, { id: sessionId });
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
