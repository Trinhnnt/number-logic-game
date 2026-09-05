/* ==========================================================================
   MULTIPLAYER ONLINE 1v1 SYSTEM (WebRTC via PeerJS)
   ========================================================================== */

class MultiplayerManager {
    constructor() {
        this.peer = null;
        this.conn = null;
        this.roomCode = null;
        this.isHost = false;
        this.isOpponentConnected = false;
        this.opponentProgress = { filled: 0, satisfied: 0 };

        this.initDOM();
        this.bindEvents();
        this.checkURLRoom();
    }

    initDOM() {
        this.dom = {
            btnMultiplayer: document.getElementById('btn-multiplayer'),
            multiplayerModal: document.getElementById('multiplayer-modal'),
            opponentBar: document.getElementById('opponent-bar'),
            opponentStatus: document.getElementById('opponent-status'),
            opponentFilled: document.getElementById('opponent-filled'),
            opponentSatisfied: document.getElementById('opponent-satisfied'),
            
            // Modal views
            mpViewSelect: document.getElementById('mp-view-select'),
            mpViewLobby: document.getElementById('mp-view-lobby'),
            
            btnCreateRoom: document.getElementById('btn-create-room'),
            btnJoinRoom: document.getElementById('btn-join-room'),
            inputRoomCode: document.getElementById('input-room-code'),
            displayRoomCode: document.getElementById('display-room-code'),
            btnCopyLink: document.getElementById('btn-copy-link'),
            lobbyStatusText: document.getElementById('lobby-status-text')
        };
    }

    bindEvents() {
        if (this.dom.btnMultiplayer) {
            this.dom.btnMultiplayer.addEventListener('click', () => {
                window.game.showModal(this.dom.multiplayerModal);
            });
        }

        if (this.dom.btnCreateRoom) {
            this.dom.btnCreateRoom.addEventListener('click', () => this.createRoom());
        }

        if (this.dom.btnJoinRoom) {
            this.dom.btnJoinRoom.addEventListener('click', () => {
                const code = this.dom.inputRoomCode.value.trim();
                if (code.length >= 4) {
                    this.joinRoom(code);
                } else {
                    alert("Vui lòng nhập mã phòng hợp lệ (4 số)!");
                }
            });
        }

        if (this.dom.btnCopyLink) {
            this.dom.btnCopyLink.addEventListener('click', () => {
                const url = `${window.location.origin}${window.location.pathname}?room=${this.roomCode}`;
                navigator.clipboard.writeText(url).then(() => {
                    alert(`Đã sao chép link mời thi đấu!\n${url}`);
                });
            });
        }
    }

    checkURLRoom() {
        const params = new URLSearchParams(window.location.search);
        const room = params.get('room');
        if (room) {
            setTimeout(() => {
                window.game.showModal(this.dom.multiplayerModal);
                this.joinRoom(room);
            }, 500);
        }
    }

    createRoom() {
        this.isHost = true;
        this.roomCode = Math.floor(1000 + Math.random() * 9000).toString();
        const peerId = `sologic_room_${this.roomCode}`;

        this.dom.displayRoomCode.textContent = this.roomCode;
        this.showLobbyView();
        this.dom.lobbyStatusText.textContent = "⏳ Đang kết nối tới máy chủ phòng...";

        try {
            this.peer = new Peer(peerId);

            this.peer.on('open', (id) => {
                this.dom.lobbyStatusText.textContent = "🟢 Phòng đã sẵn sàng! Hãy gửi mã phòng hoặc link cho đối thủ.";
            });

            this.peer.on('connection', (conn) => {
                this.conn = conn;
                this.setupConnection();
            });

            this.peer.on('error', (err) => {
                console.error(err);
                if (err.type === 'unavailable-id') {
                    // Retry with new code
                    this.createRoom();
                } else {
                    this.dom.lobbyStatusText.textContent = "❌ Tự động tạo lại phòng...";
                }
            });
        } catch (e) {
            console.error(e);
        }
    }

    joinRoom(roomCode) {
        this.isHost = false;
        this.roomCode = roomCode;
        const hostPeerId = `sologic_room_${this.roomCode}`;

        this.showLobbyView();
        this.dom.displayRoomCode.textContent = this.roomCode;
        this.dom.lobbyStatusText.textContent = "⏳ Đang kết nối vào phòng đối thủ...";

        try {
            this.peer = new Peer();

            this.peer.on('open', () => {
                this.conn = this.peer.connect(hostPeerId);
                this.setupConnection();
            });

            this.peer.on('error', (err) => {
                console.error(err);
                alert("Không tìm thấy phòng thi đấu! Vui lòng kiểm tra lại mã phòng.");
                this.showSelectView();
            });
        } catch (e) {
            console.error(e);
        }
    }

    setupConnection() {
        if (!this.conn) return;

        this.conn.on('open', () => {
            this.isOpponentConnected = true;
            window.game.hideModal(this.dom.multiplayerModal);

            // Show opponent bar
            if (this.dom.opponentBar) {
                this.dom.opponentBar.style.display = 'flex';
                this.dom.opponentStatus.textContent = "🟢 Đối thủ đã tham gia";
            }

            // Start game with deterministic room seed!
            const seed = parseInt(this.roomCode, 10) || 1234;
            window.game.startMultiplayerGame(seed);
        });

        this.conn.on('data', (data) => {
            this.handleData(data);
        });

        this.conn.on('close', () => {
            this.isOpponentConnected = false;
            if (this.dom.opponentStatus) {
                this.dom.opponentStatus.textContent = "🔴 Đối thủ đã thoát";
            }
            alert("Đối thủ đã rời khỏi phòng thi đấu.");
        });
    }

    sendProgress(filled, satisfied) {
        if (this.conn && this.isOpponentConnected) {
            this.conn.send({
                type: 'PROGRESS',
                filled,
                satisfied
            });
        }
    }

    sendWin() {
        if (this.conn && this.isOpponentConnected) {
            this.conn.send({
                type: 'WIN'
            });
        }
    }

    handleData(data) {
        if (data.type === 'PROGRESS') {
            this.opponentProgress = { filled: data.filled, satisfied: data.satisfied };
            if (this.dom.opponentFilled) this.dom.opponentFilled.textContent = data.filled;
            if (this.dom.opponentSatisfied) this.dom.opponentSatisfied.textContent = data.satisfied;
        } else if (data.type === 'WIN') {
            window.game.onOpponentWon();
        }
    }

    showSelectView() {
        if (this.dom.mpViewSelect) this.dom.mpViewSelect.style.display = 'block';
        if (this.dom.mpViewLobby) this.dom.mpViewLobby.style.display = 'none';
    }

    showLobbyView() {
        if (this.dom.mpViewSelect) this.dom.mpViewSelect.style.display = 'none';
        if (this.dom.mpViewLobby) this.dom.mpViewLobby.style.display = 'block';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.multiplayer = new MultiplayerManager();
});
