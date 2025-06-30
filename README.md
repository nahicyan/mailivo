An Email Marketing Platform Built With Next.js and Express, Designed To Integrate Seamlessly With Landivo.

## Features

- 📧 Campaign Management
- 👥 Contact Management & Segmentation
- 📊 Advanced Analytics
- 🤖 Marketing Automation
- 🏠 Landivo Integration
- 📱 Responsive Design

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, ShadCN UI, TailwindCSS
- **Backend**: Express.js, TypeScript, MongoDB, Redis
- **Email**: SendGrid, Custom SMTP, React Email
- **Queue**: Bull, Redis
- **Authentication**: NextAuth.js, JWT

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB
- Redis
- SendGrid Account (optional)

### Installation

1. Clone the repository
2. Install dependencies: `npm install`
3. Configure environment variables in `app/.env.local` and `api/.env`
4. Start development servers: `npm run dev`

### Development

- Frontend: http://localhost:3000
- Backend: http://localhost:8000

## Project Structure

- `/app` - Next.js frontend application
- `/api` - Express.js backend API
- `/packages` - Shared packages and utilities

## License

MIT