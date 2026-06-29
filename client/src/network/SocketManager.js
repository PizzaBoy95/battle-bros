import { io } from 'socket.io-client';
import { SERVER_URL } from '../config.js';

class SocketManager {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
  }

  connect(token) {
    if (this.socket?.connected) return;

    this.socket = io(SERVER_URL, {
      auth: { token },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    this.socket.on('connect', () => {
      console.log('[Socket] Connected:', this.socket.id);
      this._emit('connected', {});
    });

    this.socket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason);
      this._emit('disconnected', { reason });
    });

    this.socket.on('connect_error', (err) => {
      console.error('[Socket] Connection error:', err.message);
      this._emit('error', { message: err.message });
    });

    // Passthrough all game events
    const GAME_EVENTS = [
      'queue_status', 'queue_left', 'match_start', 'match_found',
      'game_state', 'game_event', 'game_over',
      'overtime_start', 'sudden_death_start',
      'unit_deployed',
      'friend_invite', 'invite_sent', 'invite_error', 'invite_declined',
      'chat_message'
    ];
    for (const evt of GAME_EVENTS) {
      this.socket.on(evt, (data) => this._emit(evt, data));
    }
  }

  disconnect() {
    this.socket?.disconnect();
    this.socket = null;
  }

  isConnected() {
    return !!this.socket?.connected;
  }

  // ── Emit to server ─────────────────────────────────────────────────────────
  joinQueue(deck, mode = '1v1') {
    this.socket?.emit('join_queue', { deck, mode });
  }

  playVsCpu(deck) {
    this.socket?.emit('play_vs_cpu', { deck });
  }

  playVsCpu2v2(deck) {
    this.socket?.emit('play_vs_cpu_2v2', { deck });
  }

  leaveQueue() {
    this.socket?.emit('leave_queue', {});
  }

  deployUnit(charId, x, y, level) {
    this.socket?.emit('deploy_unit', { charId, x, y, level });
  }

  inviteFriend(targetUsername, deck) {
    this.socket?.emit('invite_friend', { targetUsername, deck });
  }

  acceptInvite(fromId) {
    this.socket?.emit('accept_invite', { fromId });
  }

  declineInvite(fromId) {
    this.socket?.emit('decline_invite', { fromId });
  }

  sendChat(text) {
    this.socket?.emit('chat_message', { text });
  }

  // ── Event subscription ─────────────────────────────────────────────────────
  on(event, callback) {
    if (!this.listeners.has(event)) this.listeners.set(event, []);
    this.listeners.get(event).push(callback);
    return () => this.off(event, callback);
  }

  off(event, callback) {
    const cbs = this.listeners.get(event) || [];
    this.listeners.set(event, cbs.filter(cb => cb !== callback));
  }

  offAll(event) {
    this.listeners.delete(event);
  }

  _emit(event, data) {
    const cbs = this.listeners.get(event) || [];
    for (const cb of cbs) {
      try { cb(data); } catch (e) { console.error('[SocketManager] handler error:', e); }
    }
  }
}

// Singleton
export const socketManager = new SocketManager();
