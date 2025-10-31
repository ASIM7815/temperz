// Initialize Socket.io connection
const SERVER_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:3000' 
  : window.location.origin;

window.socket = io(SERVER_URL);
window.currentUser = 'User_' + Math.random().toString(36).substr(2, 5);
window.currentChat = null;

const socket = window.socket;
const currentUser = window.currentUser;

// Connect to server
socket.emit('join', currentUser);

// Receive messages
socket.on('newMessage', (message) => {
  displayMessage(message);
});

// User status updates
socket.on('userStatus', (data) => {
  console.log(`${data.username} is ${data.online ? 'online' : 'offline'}`);
});

// Room events
socket.on('userJoinedRoom', (data) => {
  document.getElementById('waitingText').textContent = 'Connected! 🎉';
  setTimeout(() => {
    const modal = document.getElementById('roomModal');
    if (modal) {
      modal.classList.remove('active');
      document.getElementById('createView').style.display = 'none';
      document.getElementById('joinView').style.display = 'none';
      document.querySelector('.modal-options').style.display = 'grid';
    }
    if (window.openChat) window.openChat(data.username);
  }, 1000);
});

socket.on('roomJoined', (data) => {
  const modal = document.getElementById('roomModal');
  if (modal) {
    modal.classList.remove('active');
    document.getElementById('createView').style.display = 'none';
    document.getElementById('joinView').style.display = 'none';
    document.querySelector('.modal-options').style.display = 'grid';
  }
  if (window.openChat) window.openChat('Room: ' + data.roomCode);
});

socket.on('roomNotFound', () => {
  alert('Room not found. Please check the code.');
});

// Load chat history
async function loadMessages(chatId) {
  try {
    const response = await fetch(`${SERVER_URL}/api/messages/${chatId}`);
    const messages = await response.json();
    const messagesArea = document.querySelector('.messages-area');
    if (messagesArea) {
      messagesArea.innerHTML = '<div class="date-divider"><span>Today</span></div>';
    }
    messages.forEach(displayMessage);
  } catch (err) {
    console.log('Server not connected');
  }
}

function displayMessage(message) {
  const messagesArea = document.querySelector('.messages-area');
  if (!messagesArea) return;
  
  const messageDiv = document.createElement('div');
  messageDiv.className = message.sender === currentUser ? 'message sent' : 'message received';
  const time = new Date(message.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  messageDiv.innerHTML = `<div class="message-content"><p>${message.text}</p><span class="message-time">${time}</span></div>`;
  messagesArea.appendChild(messageDiv);
  messagesArea.scrollTop = messagesArea.scrollHeight;
}

window.loadMessages = loadMessages;
window.openChat = openChat;
