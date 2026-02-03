# 🔐 Auth + Chat System Implementation Spec

## Overview
Implement wallet-based authentication and real-time chat system for LaunchPad platform.

## Requirements

### 1. Wallet Authentication System

**Flow:**
1. Frontend: User clicks "Connect Wallet"
2. Frontend: Generate nonce message (e.g., "Sign this message to authenticate with LaunchPad. Nonce: abc123")
3. Frontend: Request wallet signature using Solana wallet adapter
4. Frontend: Send signed message + wallet address to backend `/auth/login`
5. Backend: Verify signature matches wallet address
6. Backend: Generate JWT token (expires 24h)
7. Backend: Return JWT token to frontend
8. Frontend: Store JWT in localStorage
9. Frontend: Include JWT in all subsequent requests (Authorization: Bearer <token>)

**Backend Implementation:**
- `src/auth/auth.module.ts` - Auth module
- `src/auth/auth.controller.ts` - Login/logout endpoints
- `src/auth/auth.service.ts` - Signature verification, JWT generation
- `src/auth/jwt.strategy.ts` - JWT validation strategy
- `src/auth/guards/jwt-auth.guard.ts` - Protect routes

**Endpoints:**
```typescript
POST /auth/nonce
  Response: { nonce: string }

POST /auth/login
  Body: { walletAddress: string, signature: string, message: string }
  Response: { token: string, expiresIn: number }

POST /auth/verify
  Headers: Authorization: Bearer <token>
  Response: { valid: boolean, walletAddress: string }

POST /auth/logout
  Headers: Authorization: Bearer <token>
  Response: { success: true }
```

**Dependencies:**
```bash
npm install @solana/web3.js tweetnacl tweetnacl-util
npm install @nestjs/jwt @nestjs/passport passport passport-jwt
npm install bcrypt uuid
```

**Signature Verification:**
```typescript
import { Keypair, PublicKey } from '@solana/web3.js';
import nacl from 'tweetnacl';
import { decodeUTF8 } from 'tweetnacl-util';

function verifySignature(
  message: string,
  signature: string,
  walletAddress: string
): boolean {
  const messageBytes = decodeUTF8(message);
  const signatureBytes = Buffer.from(signature, 'base64');
  const publicKeyBytes = new PublicKey(walletAddress).toBytes();
  
  return nacl.sign.detached.verify(
    messageBytes,
    signatureBytes,
    publicKeyBytes
  );
}
```

**JWT Configuration:**
```typescript
// JWT payload
interface JwtPayload {
  walletAddress: string;
  sub: string; // user ID
  iat: number;
  exp: number;
}

// JWT config
JwtModule.register({
  secret: process.env.JWT_SECRET || 'your-secret-key',
  signOptions: { expiresIn: '24h' }
})
```

---

### 2. Chat System

#### Database Schema

**Chat Messages Table:**
```typescript
@Entity('chat_messages')
export class ChatMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  walletAddress: string; // Authenticated wallet

  @Column({ nullable: true })
  tokenAddress: string; // null = global chat

  @Column('text')
  message: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ default: false })
  isBot: boolean; // true if posted via API by bot

  @Column({ nullable: true })
  replyToId: string; // For threaded replies

  @Column({ default: false })
  isDeleted: boolean;

  @Column({ nullable: true })
  editedAt: Date;
}
```

**Chat Rooms Table (optional):**
```typescript
@Entity('chat_rooms')
export class ChatRoom {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  tokenAddress: string;

  @Column({ default: 0 })
  messageCount: number;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}
```

**User Bans Table (for moderation):**
```typescript
@Entity('chat_bans')
export class ChatBan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  walletAddress: string;

  @Column({ nullable: true })
  tokenAddress: string; // null = global ban

  @Column()
  reason: string;

  @Column({ type: 'timestamp' })
  expiresAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}
```

#### Backend WebSocket Implementation

**Gateway:**
```typescript
// src/chat/chat.gateway.ts
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { WsJwtGuard } from './guards/ws-jwt.guard';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/chat'
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private chatService: ChatService) {}

  async handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  async handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('joinRoom')
  async handleJoinRoom(
    @MessageBody() data: { tokenAddress?: string },
    @ConnectedSocket() client: Socket
  ) {
    const room = data.tokenAddress || 'global';
    client.join(room);
    
    // Load recent messages
    const messages = await this.chatService.getMessages(data.tokenAddress, 50);
    client.emit('roomHistory', messages);
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('sendMessage')
  async handleMessage(
    @MessageBody() data: { tokenAddress?: string; message: string; replyToId?: string },
    @ConnectedSocket() client: Socket
  ) {
    const walletAddress = client.handshake.auth.walletAddress;
    
    // Save message
    const chatMessage = await this.chatService.createMessage({
      walletAddress,
      tokenAddress: data.tokenAddress,
      message: data.message,
      replyToId: data.replyToId,
      isBot: false
    });

    // Broadcast to room
    const room = data.tokenAddress || 'global';
    this.server.to(room).emit('newMessage', chatMessage);
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('typing')
  async handleTyping(
    @MessageBody() data: { tokenAddress?: string; isTyping: boolean },
    @ConnectedSocket() client: Socket
  ) {
    const walletAddress = client.handshake.auth.walletAddress;
    const room = data.tokenAddress || 'global';
    
    client.to(room).emit('userTyping', {
      walletAddress,
      isTyping: data.isTyping
    });
  }
}
```

**WebSocket JWT Guard:**
```typescript
// src/chat/guards/ws-jwt.guard.ts
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class WsJwtGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const client = context.switchToWs().getClient();
    const token = client.handshake.auth.token;

    if (!token) {
      return false;
    }

    try {
      const payload = this.jwtService.verify(token);
      client.handshake.auth.walletAddress = payload.walletAddress;
      return true;
    } catch (error) {
      return false;
    }
  }
}
```

#### REST API Endpoints

```typescript
// src/chat/chat.controller.ts

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private chatService: ChatService) {}

  @Get('messages')
  async getMessages(
    @Query('tokenAddress') tokenAddress?: string,
    @Query('limit') limit: number = 50,
    @Query('before') before?: string
  ) {
    return this.chatService.getMessages(tokenAddress, limit, before);
  }

  @Post('messages')
  @UseGuards(RateLimitGuard)
  async sendMessage(
    @Request() req,
    @Body() dto: SendMessageDto
  ) {
    const message = await this.chatService.createMessage({
      walletAddress: req.user.walletAddress,
      tokenAddress: dto.tokenAddress,
      message: dto.message,
      isBot: false
    });

    // Broadcast via WebSocket
    this.chatGateway.server
      .to(dto.tokenAddress || 'global')
      .emit('newMessage', message);

    return message;
  }

  @Delete('messages/:id')
  async deleteMessage(
    @Request() req,
    @Param('id') messageId: string
  ) {
    return this.chatService.deleteMessage(messageId, req.user.walletAddress);
  }

  @Get('rooms/:tokenAddress')
  async getRoomInfo(@Param('tokenAddress') tokenAddress: string) {
    return this.chatService.getRoomInfo(tokenAddress);
  }
}
```

---

### 3. Rate Limiting & DDoS Protection

**Install Dependencies:**
```bash
npm install @nestjs/throttler
```

**Global Rate Limiting:**
```typescript
// src/app.module.ts
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000,  // 1 second
        limit: 10,  // 10 requests per second
      },
      {
        name: 'medium',
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute
      },
      {
        name: 'long',
        ttl: 900000, // 15 minutes
        limit: 500,  // 500 requests per 15 min
      }
    ]),
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
```

**Custom Rate Limiting for Chat:**
```typescript
// src/chat/guards/chat-rate-limit.guard.ts
import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class ChatRateLimitGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    // Rate limit by wallet address instead of IP
    return req.user?.walletAddress || req.ip;
  }
}
```

**Apply to Chat Endpoints:**
```typescript
@Controller('chat')
@UseGuards(JwtAuthGuard, ChatRateLimitGuard)
@Throttle({ short: { limit: 5, ttl: 1000 } }) // 5 messages per second
export class ChatController {
  // ...
}
```

**Additional DDoS Protection:**
```typescript
// src/main.ts
import helmet from 'helmet';
import * as compression from 'compression';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Security headers
  app.use(helmet());
  
  // Compression
  app.use(compression());
  
  // Body size limits
  app.use(express.json({ limit: '10kb' }));
  app.use(express.urlencoded({ extended: true, limit: '10kb' }));
  
  await app.listen(3000);
}
```

---

### 4. Frontend Implementation

#### Chat Component (Bottom Right)

**File:** `src/app/shared/components/global-chat/global-chat.component.ts`

```typescript
import { Component, OnInit, OnDestroy } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { AuthService } from '../../core/services/auth.service';

interface ChatMessage {
  id: string;
  walletAddress: string;
  message: string;
  createdAt: Date;
  isBot: boolean;
}

@Component({
  selector: 'app-global-chat',
  template: `
    <div class="chat-container" [class.minimized]="isMinimized">
      <!-- Header -->
      <div class="chat-header" (click)="toggleMinimize()">
        <div class="flex items-center gap-2">
          <span class="w-2 h-2 bg-green-500 rounded-full"></span>
          <span class="font-semibold">{{ currentRoom === 'global' ? 'Global Chat' : 'Token Chat' }}</span>
          <span class="text-xs text-gray-400">({{ onlineCount }} online)</span>
        </div>
        <button class="text-gray-400 hover:text-white">
          {{ isMinimized ? '▲' : '▼' }}
        </button>
      </div>

      <!-- Messages -->
      <div class="chat-messages" #messagesContainer>
        <div *ngFor="let msg of messages" class="message">
          <div class="message-header">
            <span class="wallet">{{ truncateWallet(msg.walletAddress) }}</span>
            <span class="timestamp">{{ formatTime(msg.createdAt) }}</span>
          </div>
          <div class="message-content">{{ msg.message }}</div>
        </div>
      </div>

      <!-- Input -->
      <div class="chat-input">
        <input
          type="text"
          [(ngModel)]="messageText"
          (keydown.enter)="sendMessage()"
          placeholder="Type a message..."
          [disabled]="!isAuthenticated"
        />
        <button (click)="sendMessage()" [disabled]="!messageText || !isAuthenticated">
          Send
        </button>
      </div>
    </div>
  `,
  styles: [`
    .chat-container {
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 350px;
      height: 500px;
      background: #2d2f3a;
      border: 1px solid #374151;
      border-radius: 12px;
      display: flex;
      flex-direction: column;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      z-index: 1000;
    }

    .chat-container.minimized {
      height: 60px;
    }

    .chat-header {
      background: #1a1b1f;
      padding: 12px 16px;
      border-bottom: 1px solid #374151;
      display: flex;
      justify-content: space-between;
      align-items: center;
      cursor: pointer;
      border-radius: 12px 12px 0 0;
    }

    .chat-messages {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
    }

    .message {
      margin-bottom: 12px;
    }

    .message-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 4px;
    }

    .wallet {
      color: #8b5cf6;
      font-weight: 600;
      font-size: 12px;
    }

    .timestamp {
      color: #6b7280;
      font-size: 11px;
    }

    .message-content {
      color: #ffffff;
      font-size: 14px;
    }

    .chat-input {
      border-top: 1px solid #374151;
      padding: 12px;
      display: flex;
      gap: 8px;
    }

    .chat-input input {
      flex: 1;
      background: #1a1b1f;
      border: 1px solid #374151;
      border-radius: 6px;
      padding: 8px 12px;
      color: #ffffff;
      font-size: 14px;
    }

    .chat-input button {
      background: #8b5cf6;
      color: white;
      border: none;
      border-radius: 6px;
      padding: 8px 16px;
      cursor: pointer;
      font-weight: 600;
    }

    .chat-input button:disabled {
      background: #4b5563;
      cursor: not-allowed;
    }
  `]
})
export class GlobalChatComponent implements OnInit, OnDestroy {
  socket: Socket;
  messages: ChatMessage[] = [];
  messageText = '';
  isMinimized = false;
  currentRoom = 'global';
  onlineCount = 0;
  isAuthenticated = false;

  constructor(private authService: AuthService) {}

  ngOnInit() {
    this.authService.isAuthenticated$.subscribe(isAuth => {
      this.isAuthenticated = isAuth;
      if (isAuth) {
        this.connectSocket();
      }
    });
  }

  connectSocket() {
    const token = this.authService.getToken();
    
    this.socket = io('http://localhost:3000/chat', {
      auth: { token }
    });

    this.socket.on('connect', () => {
      this.socket.emit('joinRoom', { tokenAddress: null }); // Global chat
    });

    this.socket.on('roomHistory', (messages: ChatMessage[]) => {
      this.messages = messages;
      this.scrollToBottom();
    });

    this.socket.on('newMessage', (message: ChatMessage) => {
      this.messages.push(message);
      this.scrollToBottom();
    });

    this.socket.on('userTyping', (data) => {
      // Show typing indicator
    });
  }

  sendMessage() {
    if (!this.messageText.trim()) return;

    this.socket.emit('sendMessage', {
      tokenAddress: null, // Global chat
      message: this.messageText
    });

    this.messageText = '';
  }

  toggleMinimize() {
    this.isMinimized = !this.isMinimized;
  }

  truncateWallet(address: string): string {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  }

  formatTime(date: Date): string {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  scrollToBottom() {
    // Implement scroll to bottom
  }

  ngOnDestroy() {
    this.socket?.disconnect();
  }
}
```

#### Auth Service

**File:** `src/app/core/services/auth.service.ts`

```typescript
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { Connection } from '@solana/web3.js';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private tokenSubject = new BehaviorSubject<string | null>(null);
  private walletSubject = new BehaviorSubject<string | null>(null);
  
  public token$ = this.tokenSubject.asObservable();
  public wallet$ = this.walletSubject.asObservable();
  public isAuthenticated$ = new BehaviorSubject<boolean>(false);

  constructor(private http: HttpClient) {
    // Check for existing token
    const token = localStorage.getItem('auth_token');
    if (token) {
      this.tokenSubject.next(token);
      this.verifyToken(token);
    }
  }

  async login(walletAdapter: any): Promise<void> {
    try {
      // 1. Get nonce from backend
      const { nonce } = await this.http.get<{ nonce: string }>('/auth/nonce').toPromise();
      
      // 2. Create message
      const message = `Sign this message to authenticate with LaunchPad.\n\nNonce: ${nonce}`;
      const encodedMessage = new TextEncoder().encode(message);
      
      // 3. Request signature from wallet
      const signature = await walletAdapter.signMessage(encodedMessage);
      
      // 4. Send to backend
      const response = await this.http.post<{ token: string }>('/auth/login', {
        walletAddress: walletAdapter.publicKey.toString(),
        signature: Buffer.from(signature).toString('base64'),
        message
      }).toPromise();
      
      // 5. Store token
      localStorage.setItem('auth_token', response.token);
      this.tokenSubject.next(response.token);
      this.walletSubject.next(walletAdapter.publicKey.toString());
      this.isAuthenticated$.next(true);
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  }

  logout() {
    localStorage.removeItem('auth_token');
    this.tokenSubject.next(null);
    this.walletSubject.next(null);
    this.isAuthenticated$.next(false);
  }

  getToken(): string | null {
    return this.tokenSubject.value;
  }

  private async verifyToken(token: string) {
    try {
      const { valid, walletAddress } = await this.http.post<any>('/auth/verify', {}, {
        headers: { Authorization: `Bearer ${token}` }
      }).toPromise();
      
      if (valid) {
        this.walletSubject.next(walletAddress);
        this.isAuthenticated$.next(true);
      } else {
        this.logout();
      }
    } catch {
      this.logout();
    }
  }
}
```

---

### 5. OpenClaw Bot API Integration

**LaunchPad Trader Skill Enhancement:**

```typescript
// skills/launchpad-trader/chat-bot.js

const axios = require('axios');

class ChatBot {
  constructor(apiUrl, authToken) {
    this.apiUrl = apiUrl;
    this.authToken = authToken;
  }

  async sendMessage(message, tokenAddress = null) {
    try {
      const response = await axios.post(
        `${this.apiUrl}/chat/messages`,
        {
          message,
          tokenAddress
        },
        {
          headers: {
            'Authorization': `Bearer ${this.authToken}`
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Failed to send chat message:', error.message);
      throw error;
    }
  }

  async getMessages(tokenAddress = null, limit = 50) {
    try {
      const response = await axios.get(`${this.apiUrl}/chat/messages`, {
        params: { tokenAddress, limit },
        headers: {
          'Authorization': `Bearer ${this.authToken}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to get messages:', error.message);
      throw error;
    }
  }
}

module.exports = ChatBot;
```

**Usage Example:**
```javascript
const ChatBot = require('./chat-bot');

const bot = new ChatBot(
  'http://localhost:3000',
  process.env.BOT_AUTH_TOKEN
);

// Send to global chat
await bot.sendMessage('🤖 New token detected! Check out $PUMP');

// Send to token-specific chat
await bot.sendMessage(
  '📊 Price alert: $PUMP just hit $0.001!',
  'TokenAddressHere123...'
);
```

---

### 6. Testing Checklist

**Backend:**
- [ ] Auth nonce generation works
- [ ] Signature verification succeeds for valid signatures
- [ ] JWT tokens are generated and validated
- [ ] Chat messages save to database
- [ ] WebSocket connections authenticate correctly
- [ ] Rate limiting kicks in after threshold
- [ ] DDoS protection headers are set

**Frontend:**
- [ ] Wallet signature prompt appears
- [ ] Auth token stored in localStorage
- [ ] Chat window appears bottom-right
- [ ] Messages send and receive in real-time
- [ ] Global chat works
- [ ] Token-specific chat works
- [ ] Chat persists on page refresh
- [ ] Minimized state works

**API:**
- [ ] Bot can authenticate via API
- [ ] Bot can send messages
- [ ] Bot can read message history
- [ ] Rate limits apply to bots

---

### 7. Security Considerations

**✅ Implemented:**
- Wallet signature verification (can't fake ownership)
- JWT tokens with expiration (24h)
- Rate limiting per wallet (prevent spam)
- DDoS protection via Helmet
- Input sanitization (prevent XSS)
- Message length limits (prevent abuse)

**🔒 Recommended:**
- Add profanity filter
- Add admin moderation tools
- Add wallet blacklist
- Add message reporting
- Add captcha for high-volume wallets
- Add SSL/TLS in production

---

### 8. Deployment Notes

**Environment Variables:**
```env
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_EXPIRATION=24h
RATE_LIMIT_TTL=60000
RATE_LIMIT_MAX=100
CHAT_MESSAGE_MAX_LENGTH=500
WEBSOCKET_CORS_ORIGIN=http://localhost:4200
```

**Database Migration:**
```bash
npm run typeorm migration:generate -- -n AddChatTables
npm run typeorm migration:run
```

**Frontend Build:**
```bash
cd frontend
npm install socket.io-client
npm run build
```

---

## Success Criteria

✅ User can connect wallet and sign message  
✅ Backend verifies signature and issues JWT  
✅ User can send/receive messages in global chat  
✅ User can send/receive messages in token chat  
✅ Bots can authenticate and chat via API  
✅ Rate limiting prevents spam  
✅ Chat persists across page refreshes  
✅ WebSocket real-time updates work  

---

**Estimated Time:** 2-3 hours  
**Priority:** High  
**Dependencies:** Working Solana wallet adapter, NestJS backend, PostgreSQL database
