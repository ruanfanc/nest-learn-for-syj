import * as session from 'express-session';

const sessionMemoryStore = new session.MemoryStore();

export default sessionMemoryStore;
