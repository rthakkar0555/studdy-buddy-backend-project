# Studdy Buddy Backend

## Overview
Studdy Buddy is a backend system for a collaborative study platform, allowing students to form groups, manage tasks, track progress, and communicate efficiently. This backend handles user authentication, task management, real-time messaging, and scoring.

## Features
- User Registration & Authentication (JWT-based)
- Group Creation & Management
- Task Assignments & To-Do Lists
- Real-time Chat System
- Task Completion Tracking & Scoring System
- Admin Controls

## Tech Stack
- **Backend**: Node.js, Express.js
- **Database**: MongoDB (Mongoose ODM)
- **Authentication**: JWT
- **Real-time Communication**: Socket.io
- **Storage**: Cloudinary (for file uploads)

## Installation
### Prerequisites
Ensure you have the following installed:
- Node.js & npm
- MongoDB (local or Atlas)

### Steps
1. Clone the repository:
   ```sh
   git clone https://github.com/rthakkar0555/studdy-buddy-backend-project.git
   cd studdy-buddy-backend-project
   ```
2. Install dependencies:
   ```sh
   npm install
   ```
3. Create a `.env` file in the root directory with the following variables:
   ```sh
   PORT=5000
   MONGO_URI=your_mongodb_uri
   JWT_SECRET=your_secret_key
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```
4. Start the server:
   ```sh
   npm start
   ```
   or for development:
   ```sh
   npm run dev
   ```

## API Endpoints
https://documenter.getpostman.com/view/42154145/2sB2cPiQmU
