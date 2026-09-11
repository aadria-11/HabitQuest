This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.


## WebSocket Messages

### subscribe

Direction: Client → Server

Purpose:
Subscribes the user to real-time milestone notifications.

Payload:

{
  "userId": "abc123"
}

Server Behavior:
- Adds the socket to room user:abc123
- Evaluates the user's habits for milestone achievements
- Enables future milestone notifications to be sent to the user

Example:

socket.emit('subscribe', {
  userId: session.user.id
});

### milestone

Direction: Server → Client

Purpose:
Notifies the user when a habit reaches a milestone streak.

Payload:

{
  "notificationId": "notif123",
  "habitId": "habit456",
  "habitName": "Exercise",
  "milestone": 7
}

Server Behavior:
- Sends a milestone notification to the connected user

Example:

socket.on('milestone', (data) => {
  console.log(`${data.habitName} reached ${data.milestone} days`);
});

### milestone:ack

Direction: Client → Server

Purpose:
Acknowledges that a milestone notification has been received and viewed.

Payload:

{
  "notificationId": "notif123"
}

Server Behavior:
- Marks the notification as acknowledged in the database

Example:

socket.emit('milestone:ack', {
  notificationId: data.notificationId
});

### Real-Time Notification Flow

1. Client connects to Socket.IO.
2. Client sends a subscribe message containing its userId.
3. Server joins the user-specific room.
4. Server evaluates user milestones.
5. Server sends a milestone notification when a milestone is reached.
6. Client displays the notification.
7. Client sends milestone:ack.
8. Server updates the notification as acknowledged in the database.