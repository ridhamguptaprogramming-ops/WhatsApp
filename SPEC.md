# WhatsApp Clone - Real-Time Chat Application Specification

## 1. Project Overview

**Project Name:** WhatsApp Clone (Real-Time Chat Application)
**Type:** Full-stack Web Application (Mobile-first)
**Core Functionality:** Real-time messaging platform similar to WhatsApp allowing 1-to-1 and group chats with media sharing
**Target Users:** General consumers needing seamless real-time communication

---

## 2. Technology Stack Selection

### Frontend: React + TypeScript
- **Why React:** Industry standard, vast ecosystem, excellent performance
- **Additional:** TailwindCSS for styling, Socket.IO client for real-time
- **State Management:** React Query + Zustand

### Backend: Node.js + Express + Socket.IO
- **Why Node.js:** 
  - Native WebSocket support ( Socket.IO )
  - Event-driven architecture perfect for real-time apps
  - Same language (TypeScript) for full-stack consistency
  - Excellent scalability with clustering
- **Database:** MongoDB (NoSQL) - chosen for:
  - Flexible schema for messages with varying types
  - Excellent horizontal scaling
  - Great performance for read-heavy chat apps
  - Easy media metadata storage
  
### Real-Time Communication: Socket.IO
- **Why Socket.IO:**
  - Fallback to polling if WebSocket fails
  - Automatic reconnection handling
  - Room-based broadcasting for group chats
  - Binary support for media

### Cloud Storage: AWS S3 (via Multer)
- **Why AWS S3:**
  - Industry standard for object storage
  - Excellent durability (99.999999999%)
  - Cost-effective for chat media
  - CloudFront CDN integration for fast delivery

### Authentication: JWT + bcrypt
- JWT for stateless authentication
- bcrypt for password hashing
- Refresh token rotation

---

## 3. System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                       负载均衡器 (Nginx)                        │
└─────────────────────────────────────────────────────────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        │                       │                       │
┌───────▼───────┐       ┌───────▼───────┐       ┌─────▼─────┐
│  API Server   │       │  API Server   │       │ API Server│
│   (Node.js)   │       │   (Node.js)   │       │  (Node.js)│
└───────┬───────┘       └───────┬───────┘       └─────┬─────┘
        │                       │                       │
        └───────────────────────┼───────────────────────┘
                                │
              ┌─────────────────┼─────────────────┐
              │                 │                 │
      ┌───────▼──────┐  ┌───────▼──────┐  ┌───────▼──────┐
      │   MongoDB    │  │   Redis      │  │    AWS S3    │
      │   Cluster    │  │   (Cache)    │  │   (Media)    │
      └──────────────┘  └──────────────┘  └──────────────┘
```

### Microservices vs Monolith Decision
**Selected: Modular Monolith** for this implementation
- Start with single deployable unit for simpler development
- Split into microservices when scale demands
- Each module in separate folder structure
- Future-ready for microservices extraction

### Database Schema Design

#### Users Collection
```javascript
{
  _id: ObjectId,
  email: String (unique),
  phone: String (unique, optional),
  password: String (hashed),
  displayName: String,
  avatar: String (URL),
  bio: String,
  authProviders: ['local', 'google', 'facebook'],
  status: 'online' | 'offline' | 'away',
  lastSeen: Date,
  createdAt: Date,
  updatedAt: Date
}
```

#### Chats Collection
```javascript
{
  _id: ObjectId,
  type: 'direct' | 'group',
  name: String (for groups only),
  avatar: String (URL, for groups),
  description: String,
  participants: [ObjectId (ref: Users)],
  createdBy: ObjectId (ref: Users),
  admin: [ObjectId (ref: Users)],
  lastMessage: ObjectId (ref: Messages),
  lastActivity: Date,
  isMuted: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

#### Messages Collection
```javascript
{
  _id: ObjectId,
  chatId: ObjectId (ref: Chats),
  sender: ObjectId (ref: Users),
  type: 'text' | 'image' | 'video' | 'audio' | 'file',
  content: String,
  media: {
    url: String,
    thumbnail: String,
    fileName: String,
    fileSize: Number,
    mimeType: String,
    duration: Number (for audio/video)
  },
  replyTo: ObjectId (ref: Messages, optional),
  status: 'sent' | 'delivered' | 'read',
  readBy: [{
    user: ObjectId,
    readAt: Date
  }],
  reactions: [{
    user: ObjectId,
    emoji: String
  }],
  createdAt: Date,
  updatedAt: Date
}
```

#### Media Files Collection
```javascript
{
  _id: ObjectId,
  owner: ObjectId (ref: Users),
  message: ObjectId (ref: Messages),
  chatId: ObjectId (ref: Chats),
  type: 'image' | 'video' | 'audio' | 'file',
  url: String,
  thumbnail: String,
  fileName: String,
  fileSize: Number,
  mimeType: String,
  width: Number,
  height: Number,
  duration: Number,
  storageType: 's3',
  createdAt: Date
}
```

#### Sessions Collection
```javascript
{
  _id: ObjectId,
  user: ObjectId (ref: Users),
  token: String,
  refreshToken: String,
  device: {
    type: String,
    name: String,
    fcmToken: String (for push notifications)
  },
  expiresAt: Date,
  createdAt: Date
}
```

---

## 4. API Endpoints Design

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh token
- `POST /api/auth/logout` - Logout
- `POST /api/auth/forgot-password` - Password reset request
- `POST /api/auth/reset-password` - Password reset

### Users
- `GET /api/users/me` - Get current user
- `PUT /api/users/me` - Update current user
- `GET /api/users/:id` - Get user by ID
- `GET /api/users/search` - Search users
- `PUT /api/users/me/avatar` - Update avatar
- `PUT /api/users/me/status` - Update online status
- `POST /api/auth/oauth/google` - Google OAuth
- `POST /api/auth/oauth/facebook` - Facebook OAuth

### Chats
- `GET /api/chats` - List user's chats
- `POST /api/chats` - Create chat (direct or group)
- `GET /api/chats/:id` - Get chat details
- `PUT /api/chats/:id` - Update chat (name, avatar)
- `DELETE /api/chats/:id` - Delete/leave chat
- `POST /api/chats/:id/participants` - Add participants (groups)
- `DELETE /api/chats/:id/participants/:userId` - Remove participant
- `PUT /api/chats/:id/admin/:userId` - Make admin
- `DELETE /api/chats/:id/admin/:userId` - Remove admin

### Messages
- `GET /api/chats/:chatId/messages` - Get messages (paginated)
- `POST /api/chats/:chatId/messages` - Send message
- `PUT /api/messages/:id` - Edit message
- `DELETE /api/messages/:id` - Delete message
- `PUT /api/messages/:id/status` - Update message status
- `POST /api/messages/:id/reaction` - Add reaction
- `DELETE /api/messages/:id/reaction` - Remove reaction

### Media
- `POST /api/media/upload` - Upload media file
- `GET /api/media/:id` - Get media info
- `DELETE /api/media/:id` - Delete media

### Notifications
- `GET /api/notifications` - Get notifications
- `PUT /api/notifications/:id/read` - Mark as read

---

## 5. Real-Time Events (Socket.IO)

### Client → Server
- `join-chat` - Join a chat room
- `leave-chat` - Leave a chat room
- `send-message` - Send a message
- `typing-start` - User started typing
- `typing-stop` - User stopped typing
- `mark-read` - Mark messages as read
- `user-online` - User came online
- `user-offline` - User went offline
- `join-group` - Join a group

### Server → Client
- `new-message` - New message received
- `message-updated` - Message edited
- `message-deleted` - Message deleted
- `user-typing` - Someone is typing
- `message-status` - Message status changed
- `user-status` - User online/offline
- `participant-joined` - Someone joined chat
- `participant-left` - Someone left chat
- `chat-updated` - Chat details updated

---

## 6. Security Implementation

### End-to-End Encryption (E2EE) - Basic Implementation
1. Generate key pair on user registration
2. Store public key on server
3. Private key stored locally (in production, use secure enclave)
4. Encrypt message content before sending
5. Recipient decrypts with their private key

### Authentication & Authorization
- JWT access tokens (15 min expiry)
- Refresh tokens (7 days expiry)
- Token rotation on refresh
- HTTP-only cookies
- CSRF protection

### Data Privacy
- HTTPS only
- Input sanitization
- Rate limiting
- Request validation
- SQL injection prevention
- XSS prevention via output encoding

---

## 7. UI/UX Design

### Color Palette
- Primary: `#128C7E` (WhatsApp green)
- Primary Dark: `#075E54`
- Secondary: `#25D366` (Bright green)
- Accent: `#34B7F1`
- Background: `#ECE5DD` (Light beige)
- Surface: `#FFFFFF`
- Text Primary: `#303030`
- Text Secondary: `#667781`
- Error: `#E53935`
- Success: `#43A047`

### Typography
- Font Family: `'Segoe UI', 'Roboto', sans-serif`
- Heading 1: 28px, Bold
- Heading 2: 24px, SemiBold
- Body: 16px, Regular
- Small: 14px, Regular
- Caption: 12px, Regular

### Layout Structure
- Mobile-first approach
- Sidebar (280px) + Main Chat Area
- Responsive breakpoints:
  - Mobile: < 768px
  - Tablet: 768px - 1024px
  - Desktop: > 1024px

### Chat Interface Components
1. **Sidebar**
   - Search bar
   - Chat list with:
     - Avatar (40px circular)
     - Name
     - Last message preview
     - Timestamp
     - Unread badge
     - Mute icon

2. **Chat Header**
   - Avatar
   - Name
   - Status indicator
   - Action buttons (call, video, info)

3. **Message Area**
   - Date separators
   - Message bubbles (sent: right aligned, received: left aligned)
   - Media display
   - Reactions
   - Read receipts

4. **Message Input**
   - Attachment button
   - Text input (multi-line)
   - Emoji picker
   - Send button

5. **Group Info Panel**
   - Group name & avatar
   - Participant list
   - Group settings

---

## 8. Scalability Considerations

### Handling High Concurrency
- **horizontal Scaling:** Multiple Node.js instances behind load balancer
- **Session Affinity:** Sticky sessions for WebSocket connections
- **Redis Pub/Sub:** For cross-instance messaging

### Message Queues (Bonus Implementation)
- RabbitMQ or Redis Streams
- Async message processing
- Offline message delivery
- Push notification queue

### Caching Strategy
- Redis for:
  - User sessions
  - Recent messages cache
  - Online status
  - Typing indicators
- Cache invalidation strategy

### Database Optimization
- Indexes on: chatId + createdAt, sender, status
- Horizontal sharding by chatId
- Read replicas for query operations

### Media Optimization
- Dynamic image resizing (AWS Lambda)
- Video compression
- CDN for global delivery
- Lazy loading

---

## 9. Deployment Configuration

### Backend (Production)
- **Platform:** AWS EC2 / Render / Railway
- **Process Manager:** PM2
- **Reverse Proxy:** Nginx with SSL
- **Environment:** Node.js cluster mode

### Frontend (Production)
- **Platform:** Vercel / Netlify
- **Build:** npm run build
- **SPA:** Configure for history API routing

### CI/CD
- GitHub Actions workflow
- Automated testing
- Linting checks
- Build verification

---

## 10. Project Structure

```
whatsapp-clone/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.ts
│   │   │   ├── redis.ts
│   │   │   └── env.ts
│   │   ├── controllers/
│   │   │   ├── auth.ts
│   │   │   ├── users.ts
│   │   │   ├── chats.ts
│   │   │   ├── messages.ts
│   │   │   └── media.ts
│   │   ├── models/
│   │   │   ├── User.ts
│   │   │   ├── Chat.ts
│   │   │   ├── Message.ts
│   │   │   └── Media.ts
│   │   ├── middleware/
│   │   │   ├── auth.ts
│   │   │   ├── validation.ts
│   │   │   └── errorHandler.ts
│   │   ├── routes/
│   │   │   ├── auth.ts
│   │   │   ├── users.ts
│   │   │   ├── chats.ts
│   │   │   ├── messages.ts
│   │   │   └── media.ts
│   │   ├── services/
│   │   │   ├── auth.ts
│   │   │   ├── socket.ts
│   │   │   ├── media.ts
│   │   │   └── push.ts
│   │   ├── utils/
│   │   │   ├── crypto.ts
│   │   │   └── helpers.ts
│   │   ├── app.ts
│   │   └── server.ts
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Auth/
│   │   │   ├── Chat/
│   │   │   ├── Message/
│   │   │   ├── Layout/
│   │   │   └── UI/
│   │   ├── hooks/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── store/
│   │   ├── types/
│   │   ├── utils/
│   │   ├── styles/
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   └── vite.config.ts
│
└── README.md
