# Campus Link

A real-time collaborative academic platform for university students to communicate, collaborate, and manage academic interactions in one centralized environment.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-green.svg)
![React](https://img.shields.io/badge/react-18-blue.svg)

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Documentation](#api-documentation)
- [Real-Time Events](#real-time-events)
- [Database Schema](#database-schema)
- [Security](#security)
- [Deployment](#deployment)
- [License](#license)

---

## Overview

Campus Link brings together real-time messaging, study group management, academic discussions, and announcements into a single platform built for university environments. It features role-based access control (user, admin, owner), real-time WebSocket communication, and a modern responsive UI.

---

## Features

### Authentication & Accounts
- Email/password registration and login with JWT
- Role-based access control (user, admin, owner)
- Forgot password flow with 6-digit email verification code
- Profile management with photo upload

### Real-Time Chat
- Private messaging between users in shared groups
- Group chat rooms within study groups
- Read receipts (sent, delivered, read) with visual tick indicators
- Typing indicators
- Message editing and deletion (soft delete)
- Emoji reactions
- File attachments (images, PDFs, documents — up to 10MB)
- Online/offline status with last seen timestamps
- Message deduplication and rate limiting

### Study Groups
- Group creation and management (admin/owner)
- Join request system with approval workflow
- Member management (remove, leave)

### Announcements
- Group-scoped and platform-wide announcements
- Read/unread tracking with real-time delivery
- Auto-expiration via TTL indexes (30 days unread, 15 days after read)

### Discussion Board
- Post questions with tags
- Answer and vote (upvote/downvote)
- Mark questions as solved
- Full-text search

### Admin Panel
- Dashboard with platform statistics
- User management (promote, demote, delete)
- Join request management
- Activity logs

---

## Tech Stack

### Backend
| Technology | Purpose |
|---|---|
| Node.js + Express | REST API server |
| MongoDB Atlas + Mongoose | Database and ODM |
| Socket.io | Real-time WebSocket communication |
| Redis (ioredis) | Pub/Sub for horizontal scaling |
| JWT + bcryptjs | Authentication and password hashing |
| Multer | File uploads |
| Nodemailer | Email (Gmail SMTP) |
| Helmet | HTTP security headers |
| express-rate-limit | API rate limiting |
| Joi | Request validation |
| Winston | Structured logging |

### Frontend
| Technology | Purpose |
|---|---|
| React 18 | UI framework |
| React Router v7 | Client-side routing |
| TailwindCSS | Styling |
| Axios | HTTP client |
| Socket.io-client | Real-time events |

---

## Project Structure

```
Campus-Link/
├── client/                     # React frontend
│   └── src/
│       ├── api/                # Axios instance and interceptors
│       ├── components/         # Reusable UI components
│       │   ├── chat/           # ChatList, ChatWindow, MessageBubble
│       │   ├── common/         # ProtectedRoute, AdminRoute, UserAvatar
│       │   ├── discussion/     # QuestionCard, AnswerCard
│       │   ├── home/           # Dashboard widgets
│       │   ├── layout/         # Navbar, Sidebar, AdminSidebar
│       │   └── ui/             # ConfirmModal
│       ├── context/            # Auth, Socket, Notification, Theme
│       ├── pages/              # 18 page components
│       └── App.jsx             # Root with React.lazy routing
│
└── server/                     # Node.js backend
    └── src/
        ├── config/             # Database connection
        ├── controllers/        # 7 controller modules
        ├── middleware/          # Auth, validation, rate limiting
        ├── models/             # 9 Mongoose models
        ├── routes/             # 7 route modules (53 endpoints)
        ├── services/           # Redis publisher/subscriber
        ├── socket/             # Socket.io server
        ├── utils/              # Logger, email utility
        └── workers/            # Message processing worker
```

---

## Getting Started

### Prerequisites

- Node.js >= 18
- MongoDB Atlas account (or local MongoDB)
- Gmail account with App Password (for email features)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/Campus-Link.git
cd Campus-Link

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### Running Locally

```bash
# Start the backend (from /server)
npm start

# Start the frontend (from /client)
npm start
```

The client runs on `http://localhost:3000` and proxies API requests to the backend on port 5000.

---

## Environment Variables

Create a `.env` file in the `server/` directory. See `.env.example` for the template.

| Variable | Description |
|---|---|
| `PORT` | Server port (default: 5000) |
| `MONGODB_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | Secret key for JWT signing |
| `NODE_ENV` | `development` or `production` |
| `CLIENT_URL` | Frontend URL for CORS (e.g., `http://localhost:3000`) |
| `REDIS_URL` | Redis connection string (optional, falls back to single-server mode) |
| `EMAIL_USER` | Gmail address for sending emails |
| `EMAIL_PASS` | Gmail App Password |

---

## API Documentation

### Endpoints Summary

| Module | Base Path | Endpoints | Auth |
|---|---|---|---|
| Auth | `/api/auth` | 8 | Public + Protected |
| Admin | `/api/admin` | 8 | Admin/Owner |
| Groups | `/api/groups` | 11 | Protected |
| Chat | `/api/chats` | 1 | Protected |
| Announcements | `/api/announcements` | 8 | Protected |
| Messages | `/api/messages` | 8 | Protected |
| Discussion | `/api/discussion` | 9 | Public + Protected |

### Key Endpoints

**Authentication**
- `POST /api/auth/register` — Create account
- `POST /api/auth/login` — Login and receive JWT
- `POST /api/auth/forgot-password` — Request password reset code
- `POST /api/auth/reset-password` — Reset password with code

**Messages**
- `GET /api/messages/group/:groupId` — Group chat history (cursor-based pagination)
- `GET /api/messages/private/:userId` — Private chat history
- `POST /api/messages/upload` — Upload file attachments

**Groups**
- `POST /api/groups` — Create a study group
- `POST /api/groups/:id/join` — Request to join
- `PATCH /api/groups/requests/:id/approve` — Approve join request

---

## Real-Time Events

### Client → Server
| Event | Description |
|---|---|
| `sendMessage` | Send a chat message (group or private) |
| `messagesSeen` | Mark messages as read |
| `typing` / `stopTyping` | Typing indicators |
| `addReaction` / `removeReaction` | Emoji reactions |
| `editMessage` / `deleteMessage` | Edit or delete a message |
| `joinGroup` / `joinPrivate` | Join a chat room |

### Server → Client
| Event | Description |
|---|---|
| `newMessage` | New incoming message |
| `messagesRead` | Read receipts |
| `messagesDelivered` | Delivery confirmation |
| `userTyping` / `userStopTyping` | Typing status |
| `reactionUpdated` | Reaction change |
| `messageEdited` / `messageDeleted` | Message updates |
| `userOnline` / `userOffline` | Presence status |
| `newAnnouncement` | Real-time announcement |

---

## Database Schema

9 Mongoose models with optimized indexes:

| Model | Key Fields | Notable Features |
|---|---|---|
| **User** | name, email, password, role, profilePhoto | Password hashing, reset code fields |
| **Message** | sender, group/receiver, content, readBy, deliveredTo | Compound indexes, soft delete, reactions |
| **Group** | name, subject, members, admins | Creator tracking |
| **Announcement** | group, title, content, readBy, visibleTo | TTL auto-expiration |
| **Question** | title, content, author, tags, votes | Full-text search index |
| **Answer** | content, author, question, votes | Voting system |
| **JoinRequest** | user, group, status | Unique constraint, TTL cleanup |
| **ChatMembership** | user, chatType, chatId, lastSeenAt | Read tracking |
| **Activity** | type, name, action, date | TTL auto-cleanup (15 days) |

---

## Security

- **Helmet** — Secure HTTP headers
- **Rate Limiting** — 200 requests per 15 min per IP; socket: 15 msgs per 10s per user
- **JWT Authentication** — Token-based auth with 30-day expiry
- **Password Hashing** — bcryptjs with salt rounds 10
- **Role-Based Access** — user / admin / owner roles with middleware enforcement
- **Input Validation** — Joi schemas on all mutation endpoints
- **File Upload Validation** — MIME whitelist, 10MB size limit
- **XSS Prevention** — HTML entity escaping in all user content
- **CORS** — Configurable allowed origins
- **Environment Secrets** — All credentials in `.env`, excluded from version control
- **Error Handling** — Global handler hides stack traces in production

---

## Deployment

Campus Link is configured for deployment on **Render.com**:

- **Frontend** — Static Site (React build) with `/*` rewrite for client-side routing
- **Backend** — Web Service (Node.js) with environment variables
- **Redis** — Render Key Value store
- **Database** — MongoDB Atlas with `0.0.0.0/0` whitelist for dynamic IPs
- **SSL** — Free automatic HTTPS via Render

See the deployment plan in `.cursor/plans/` for detailed setup instructions.

---

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.

---

Built by **Ahmed Sameh** — 2026
