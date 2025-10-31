// No Firebase - using custom backend

// Fix mobile viewport height
(function() {
    function setVH() {
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
    }
    setVH();
    window.addEventListener('resize', setVH);
    window.addEventListener('orientationchange', setVH);
})();

// UI Functions
const resizer = document.getElementById('resizer');
const sidebar = document.getElementById('sidebar');
let isResizing = false;

resizer.addEventListener('mousedown', () => { isResizing = true; document.body.style.cursor = 'col-resize'; });
document.addEventListener('mousemove', (e) => { if (isResizing && e.clientX >= 300 && e.clientX <= 600) sidebar.style.width = e.clientX + 'px'; });
document.addEventListener('mouseup', () => { isResizing = false; document.body.style.cursor = 'default'; });

function openChat(userName) {
    document.getElementById('welcomeScreen').style.display = 'none';
    document.getElementById('chatWindow').style.display = 'flex';
    document.getElementById('chatUserName').textContent = userName;
    document.getElementById('mobileChatUserName').textContent = userName;
    window.currentChat = userName.replace(/\s+/g, '_').toLowerCase();
    
    // Mobile specific behavior
    if (window.innerWidth <= 768) {
        document.querySelector('.main-chat').classList.add('chat-active');
        document.getElementById('mobileMessageInput').style.display = 'flex';
        document.querySelector('.sidebar').classList.add('hidden');
        
        // Hide the plus button when chat is open
        const fabButton = document.querySelector('.new-chat-fab');
        if (fabButton) {
            fabButton.classList.add('hidden');
        }
    }
    
    // Update active chat item
    document.querySelectorAll('.chat-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.user === userName) {
            item.classList.add('active');
        }
    });
    
    // Load chat history
    if (window.loadMessages) {
        window.loadMessages(window.currentChat);
    }
}

document.getElementById('messageInput')?.addEventListener('keypress', (e) => { if (e.key === 'Enter') sendMessage(); });

function closeProfile() { document.getElementById('profilePanel').classList.remove('active'); }
function showStatus() { alert('Status feature - Coming soon!'); }
document.querySelectorAll('.tab').forEach(tab => tab.addEventListener('click', function() { document.querySelectorAll('.tab').forEach(t => t.classList.remove('active')); this.classList.add('active'); }));

// Room management
let currentRoomCode = null;

function toggleFabMenu() { document.getElementById('roomModal').classList.add('active'); }
function closeRoomModal() { document.getElementById('roomModal').classList.remove('active'); document.getElementById('createView').style.display = 'none'; document.getElementById('joinView').style.display = 'none'; document.querySelector('.modal-options').style.display = 'grid'; }
function generateRoomCode() { return Math.random().toString(36).substring(2, 8).toUpperCase(); }
function showJoinRoom() { document.querySelector('.modal-options').style.display = 'none'; document.getElementById('joinView').style.display = 'block'; }
function backToOptions() { document.getElementById('joinView').style.display = 'none'; document.getElementById('createView').style.display = 'none'; document.querySelector('.modal-options').style.display = 'grid'; }
function copyRoomCode() { navigator.clipboard.writeText(currentRoomCode); alert('Room code copied!'); }
function shareLink() { navigator.clipboard.writeText(`${window.location.origin}${window.location.pathname}?room=${currentRoomCode}`); alert('Link copied!'); }

async function createRoom() {
    currentRoomCode = generateRoomCode();
    document.querySelector('.modal-options').style.display = 'none';
    document.getElementById('createView').style.display = 'block';
    document.getElementById('roomCodeDisplay').textContent = currentRoomCode;
    document.getElementById('waitingText').textContent = 'Share code to connect...';
    
    window.socket.emit('createRoom', currentRoomCode);
    window.socket.roomCode = currentRoomCode;
}

async function joinRoom() {
    const code = document.getElementById('joinCodeInput').value.toUpperCase().trim();
    if (code.length !== 6) {
        alert('Please enter a valid 6-character room code');
        return;
    }
    
    currentRoomCode = code;
    window.socket.emit('joinRoom', { roomCode: code, username: window.currentUser });
    window.socket.roomCode = code;
}

function sendMessage() {
    const input = document.getElementById('messageInput');
    const message = input.value.trim();
    if (message) {
        addMessageToChat(message);
        input.value = '';
        
        // Send via Socket.io if connected
        if (window.socket && window.currentChat) {
            window.socket.emit('sendMessage', {
                chatId: window.currentChat,
                sender: window.currentUser || 'You',
                text: message
            });
        }
    }
}

function sendMobileMessage() {
    const input = document.getElementById('mobileMessageInputField');
    const message = input.value.trim();
    if (message) {
        addMessageToChat(message);
        input.value = '';
        
        // Send via Socket.io if connected
        if (window.socket && window.currentChat) {
            window.socket.emit('sendMessage', {
                chatId: window.currentChat,
                sender: window.currentUser || 'You',
                text: message
            });
        }
    }
}

function addMessageToChat(message) {
    const messagesArea = document.querySelector('.messages-area');
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message sent';
    const time = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    messageDiv.innerHTML = `<div class="message-content"><p>${message}</p><span class="message-time">${time}</span></div>`;
    messagesArea.appendChild(messageDiv);
    messagesArea.scrollTop = messagesArea.scrollHeight;
}

// Mobile Navigation Functions
function toggleMobileSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('mobileOverlay');
    
    sidebar.classList.toggle('mobile-open');
    overlay.classList.toggle('active');
}

function closeMobileSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('mobileOverlay');
    
    sidebar.classList.remove('mobile-open');
    overlay.classList.remove('active');
}

function closeMobileChat() {
    if (window.innerWidth <= 768) {
        document.querySelector('.main-chat').classList.remove('chat-active');
        document.getElementById('welcomeScreen').style.display = 'flex';
        document.getElementById('chatWindow').style.display = 'none';
        document.getElementById('mobileMessageInput').style.display = 'none';
        document.querySelector('.sidebar').classList.remove('hidden');
        
        // Show the plus button when chat is closed
        const fabButton = document.querySelector('.new-chat-fab');
        if (fabButton) {
            fabButton.classList.remove('hidden');
        }
    }
}

function showChatsView() {
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    event.target.closest('.nav-item').classList.add('active');
    document.querySelector('.sidebar').classList.remove('hidden');
    document.querySelector('.main-chat').classList.remove('chat-active');
    document.getElementById('mobileMessageInput').style.display = 'none';
    
    // Show the plus button when returning to chats view
    const fabButton = document.querySelector('.new-chat-fab');
    if (fabButton) {
        fabButton.classList.remove('hidden');
    }
}

function showStatusView() {
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    event.target.closest('.nav-item').classList.add('active');
    alert('Status feature - Coming soon!');
}

function showCallsView() {
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    event.target.closest('.nav-item').classList.add('active');
    alert('Calls feature - Coming soon!');
}

function showProfileView() {
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    event.target.closest('.nav-item').classList.add('active');
    document.getElementById('profilePanel').classList.add('active');
}

function openProfile() {
    document.getElementById('profilePanel').classList.add('active');
}

// Handle window resize
function handleResize() {
    if (window.innerWidth > 768) {
        // Desktop mode
        document.getElementById('sidebar').classList.remove('mobile-open');
        document.getElementById('mobileOverlay').classList.remove('active');
        document.getElementById('mobileMessageInput').style.display = 'none';
        document.getElementById('mobileSidebarToggle').style.display = 'none';
        document.querySelector('.main-chat').classList.remove('chat-active');
    } else {
        // Mobile mode
        document.getElementById('mobileSidebarToggle').style.display = 'flex';
        if (document.getElementById('chatWindow').style.display === 'flex') {
            document.getElementById('mobileMessageInput').style.display = 'flex';
            document.querySelector('.main-chat').classList.add('chat-active');
            document.getElementById('mobileSidebarToggle').style.display = 'none';
        }
    }
}

// Add event listeners
window.addEventListener('resize', handleResize);

// Mobile input event listeners
document.getElementById('mobileMessageInputField')?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        sendMobileMessage();
    }
});

// Prevent zoom on input focus (iOS)
document.addEventListener('touchstart', function() {}, {passive: true});

// Handle viewport changes on mobile
function handleViewportChange() {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
}

window.addEventListener('resize', handleViewportChange);
window.addEventListener('orientationchange', handleViewportChange);
handleViewportChange();



window.addEventListener('load', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const roomCode = urlParams.get('room');
    if (roomCode) {
        document.getElementById('joinCodeInput').value = roomCode;
        toggleFabMenu();
        showJoinRoom();
    }
    
    // Initialize mobile layout
    handleResize();
    
    // Add touch event listeners for better mobile experience
    document.querySelectorAll('.chat-item').forEach(item => {
        item.addEventListener('touchstart', function() {
            this.style.backgroundColor = 'rgba(0, 71, 171, 0.1)';
        }, {passive: true});
        
        item.addEventListener('touchend', function() {
            setTimeout(() => {
                this.style.backgroundColor = '';
            }, 150);
        }, {passive: true});
    });
});
