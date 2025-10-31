# Video Calling Setup Guide

## Installation Steps

### 1. Install Twilio Package
```bash
cd server
npm install twilio
```

### 2. Verify Environment Variables
Check `server/.env` file contains:
```
TWILIO_ACCOUNT_SID=AC030c73cbfe59f90e538074bd5ddc1a8f
TWILIO_API_KEY=SK1e1493ea3efaf92b1c1ba7fb784fd58b
TWILIO_API_SECRET=F3ejhA0HjbJw1uNWgWy0cp2FwFl1qJRn
```

### 3. Restart Server
```bash
cd server
npm start
```

## How to Use Video Calling

### Step 1: Connect Users
1. User A creates a room (click FAB button → Create Room)
2. User A shares the room code with User B
3. User B joins using the code (click FAB button → Join Room)

### Step 2: Start Video Call
1. Once both users are in the chat
2. Click the **Video Call Button** (📹) in the chat header
3. Browser will ask for camera/microphone permission
4. Click **Allow** to grant access
5. Video call starts automatically!

### Step 3: During Call
- 🎤 Toggle microphone on/off
- 📹 Toggle camera on/off
- 📞 End call button

## Features
✅ Real-time video calling with Twilio
✅ Permission request before accessing camera
✅ Both users can see each other
✅ Mute/unmute audio
✅ Turn camera on/off
✅ End call anytime

## Troubleshooting

**Camera not working?**
- Check browser permissions (Settings → Privacy → Camera)
- Make sure no other app is using the camera

**No video showing?**
- Ensure both users clicked "Allow" for camera access
- Check internet connection
- Try refreshing the page

**Call not connecting?**
- Verify Twilio credentials in `.env` file
- Check server is running on port 3000
- Make sure both users are in the same room

## Security Note
⚠️ Never commit `.env` file to GitHub
⚠️ Keep your Twilio credentials private
