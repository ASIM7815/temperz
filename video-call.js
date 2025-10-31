// Twilio Video Call Implementation
let activeRoom = null;
let localVideoTrack = null;
let localAudioTrack = null;
let isAudioMuted = false;
let isVideoOff = false;
let incomingCallData = null;

// Initiate video call
async function initiateVideoCall() {
    if (!window.socket || !window.currentChat) {
        alert('Please connect to a chat room first!');
        return;
    }

    const roomCode = window.socket.roomCode || window.currentChat;
    
    // Request permission first
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        stream.getTracks().forEach(track => track.stop()); // Stop preview
        
        // Notify other user
        window.socket.emit('videoCallRequest', {
            roomCode: roomCode,
            caller: window.currentUser || 'User'
        });
        
        // Start call immediately for caller
        await joinVideoRoom(roomCode);
        
    } catch (err) {
        alert('Camera/Microphone permission denied. Please allow access to make video calls.');
        console.error('Media permission error:', err);
    }
}

// Setup incoming call listener when DOM is ready
window.addEventListener('DOMContentLoaded', () => {
    if (window.socket) {
        window.socket.on('incomingVideoCall', (data) => {
            incomingCallData = data;
            const callerNameEl = document.getElementById('callerName');
            const modalEl = document.getElementById('videoCallModal');
            if (callerNameEl) callerNameEl.textContent = `${data.caller} is calling...`;
            if (modalEl) modalEl.classList.add('active');
        });
    }
});

// Accept video call
async function acceptVideoCall() {
    if (!incomingCallData) return;
    
    document.getElementById('videoCallModal').classList.remove('active');
    
    try {
        await joinVideoRoom(incomingCallData.roomCode);
        window.socket.emit('videoCallAccepted', { roomCode: incomingCallData.roomCode });
    } catch (err) {
        alert('Failed to join video call: ' + err.message);
    }
}

// Reject video call
function rejectVideoCall() {
    if (!incomingCallData) return;
    
    document.getElementById('videoCallModal').classList.remove('active');
    window.socket.emit('videoCallRejected', { roomCode: incomingCallData.roomCode });
    incomingCallData = null;
}

// Join Twilio video room
async function joinVideoRoom(roomName) {
    try {
        // Check if Twilio is loaded
        if (typeof Twilio === 'undefined' || !Twilio.Video) {
            throw new Error('Twilio Video SDK not loaded');
        }
        
        // Get token from server
        const username = window.currentUser || 'User_' + Math.random().toString(36).substr(2, 5);
        const response = await fetch(`/api/video-token?username=${username}&roomName=${roomName}`);
        
        if (!response.ok) {
            throw new Error('Failed to get video token from server');
        }
        
        const data = await response.json();
        
        if (!data.token) {
            throw new Error('No token received from server');
        }
        
        // Request media permissions
        const localTracks = await Twilio.Video.createLocalTracks({
            audio: true,
            video: { width: 640, height: 480 }
        });
        
        localVideoTrack = localTracks.find(track => track.kind === 'video');
        localAudioTrack = localTracks.find(track => track.kind === 'audio');
        
        // Connect to room
        activeRoom = await Twilio.Video.connect(data.token, {
            name: roomName,
            tracks: localTracks,
            audio: true,
            video: true
        });
        
        console.log('Connected to video room:', activeRoom.name);
        
        // Show video UI
        showVideoCallUI();
        
        // Attach local video
        const localVideoElement = document.getElementById('localVideo');
        if (localVideoTrack) {
            localVideoElement.appendChild(localVideoTrack.attach());
        }
        
        // Handle remote participants
        activeRoom.participants.forEach(participantConnected);
        activeRoom.on('participantConnected', participantConnected);
        activeRoom.on('participantDisconnected', participantDisconnected);
        
        // Handle disconnection
        activeRoom.on('disconnected', () => {
            console.log('Disconnected from room');
            cleanupVideoCall();
        });
        
    } catch (err) {
        console.error('Video call error:', err);
        cleanupVideoCall();
        
        let errorMsg = 'Failed to start video call';
        if (err.name === 'NotAllowedError') {
            errorMsg = 'Camera/microphone permission denied';
        } else if (err.name === 'NotFoundError') {
            errorMsg = 'No camera or microphone found';
        } else if (err.message) {
            errorMsg = err.message;
        }
        alert(errorMsg);
    }
}

// Handle participant connected
function participantConnected(participant) {
    console.log('Participant connected:', participant.identity);
    
    const remoteVideoElement = document.getElementById('remoteVideo');
    
    participant.tracks.forEach(publication => {
        if (publication.isSubscribed) {
            attachTrack(publication.track, remoteVideoElement);
        }
    });
    
    participant.on('trackSubscribed', track => {
        attachTrack(track, remoteVideoElement);
    });
}

// Handle participant disconnected
function participantDisconnected(participant) {
    console.log('Participant disconnected:', participant.identity);
}

// Attach track to element
function attachTrack(track, container) {
    if (track.kind === 'video') {
        container.appendChild(track.attach());
    } else if (track.kind === 'audio') {
        container.appendChild(track.attach());
    }
}

// Show video call UI
function showVideoCallUI() {
    const videoContainer = document.getElementById('videoCallContainer');
    const chatWindow = document.getElementById('chatWindow');
    if (videoContainer) videoContainer.style.display = 'flex';
    if (chatWindow) chatWindow.style.display = 'none';
}

// Toggle mute
function toggleMute() {
    if (!localAudioTrack) return;
    
    if (isAudioMuted) {
        localAudioTrack.enable();
        document.getElementById('muteBtn').textContent = '🎤';
        isAudioMuted = false;
    } else {
        localAudioTrack.disable();
        document.getElementById('muteBtn').textContent = '🔇';
        isAudioMuted = true;
    }
}

// Toggle video
function toggleVideo() {
    if (!localVideoTrack) return;
    
    if (isVideoOff) {
        localVideoTrack.enable();
        document.getElementById('videoBtn').textContent = '📹';
        isVideoOff = false;
    } else {
        localVideoTrack.disable();
        document.getElementById('videoBtn').textContent = '📷';
        isVideoOff = true;
    }
}

// End video call
function endVideoCall() {
    if (activeRoom) {
        activeRoom.disconnect();
    }
    cleanupVideoCall();
}

// Cleanup video call
function cleanupVideoCall() {
    // Stop local tracks
    if (localVideoTrack) {
        localVideoTrack.stop();
        localVideoTrack = null;
    }
    if (localAudioTrack) {
        localAudioTrack.stop();
        localAudioTrack = null;
    }
    
    // Clear video elements
    const localVideo = document.getElementById('localVideo');
    const remoteVideo = document.getElementById('remoteVideo');
    if (localVideo) localVideo.innerHTML = '';
    if (remoteVideo) remoteVideo.innerHTML = '';
    
    // Hide video UI
    const videoContainer = document.getElementById('videoCallContainer');
    const chatWindow = document.getElementById('chatWindow');
    if (videoContainer) videoContainer.style.display = 'none';
    if (chatWindow) chatWindow.style.display = 'flex';
    
    // Reset state
    activeRoom = null;
    isAudioMuted = false;
    isVideoOff = false;
    incomingCallData = null;
}
