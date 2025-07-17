import { HubConnection, HubConnectionBuilder, LogLevel  } from '@microsoft/signalr';
import { BehaviorSubject } from 'rxjs';
import {apiService} from '../../../services/apiService';
import userService from '../../../services/userService';

class ChatService {
    h_debug = false; // <-- Thêm dòng này
    hubConnection: HubConnection;
    connectionStatus$ = new BehaviorSubject(false);
  
    constructor() {
      this.hubConnection = new HubConnectionBuilder()
        .withUrl(`${apiService.getBE()}/chatHub`)
        .configureLogging(this.h_debug ? LogLevel.Information : LogLevel.None)
        .withAutomaticReconnect()
        .build();
  
      this.registerOnServerEvents();
      this.startConnection();
    }

  registerOnServerEvents() {
    this.hubConnection.on('ReceiveMessage', (user: string, message: string) => {
        console.log(`Message from ${user}: ${message}`);
      });

    this.hubConnection.on('UserConnected', (connectionId: string) => {
        console.log(`User connected: ${connectionId}`);
      });

    this.hubConnection.on('UserDisconnected', (connectionId: string) => {
      console.log(`User disconnected: ${connectionId}`);
    });
  }

  async startConnection() {
    try {
      await this.hubConnection.start();
      this.h_debug && console.log('SignalR Connected');
      this.connectionStatus$.next(true);
    } catch (error) {
      console.error('Error starting connection:', error);
      this.connectionStatus$.next(false);
      setTimeout(() => this.startConnection(), 5000);
    }
  }

  async stopConnection() {
    try {
      await this.hubConnection.stop();
      this.connectionStatus$.next(false);
      console.log('SignalR Disconnected');
    } catch (error) {
      console.error('Error stopping connection:', error);
    }
  }

  async sendMessage(
    userId: string,
    connectionId: string,
    channelChatId: string,
    chatGroupId: string,
    message: string
  ) {
    try {
      await this.hubConnection.invoke('SendMessage', {
        UserId: userId,
        ConnectionId: connectionId,
        Data: {
          ChannelChatId: channelChatId,
          ChatGroupId: chatGroupId,
          Message: message,
        }
      });
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }

  async sendMessageToGroup(groupName: string, user: string, message: string) {
    try {
      await this.hubConnection.invoke('SendMessageToGroup', groupName, user, message);
    } catch (error) {
      console.error('Error sending group message:', error);
    }
  }

  async joinGroup(groupName: string) {
    try {
      await this.hubConnection.invoke('JoinGroup', groupName);
    } catch (error) {
      console.error('Error joining group:', error);
    }
  }

  async leaveGroup(groupName: string) {
    try {
      await this.hubConnection.invoke('LeaveGroup', groupName);
    } catch (error) {
      console.error('Error leaving group:', error);
    }
  }

  on(eventName: string, callback: (...args: any[]) => void) {
    this.hubConnection.on(eventName, callback);
  }

  off(eventName:string) {
    this.hubConnection.off(eventName);
  }

  isConnected() {
    return this.hubConnection.state === 'Connected';
  }

  getConnectionId() {
    return this.hubConnection.connectionId || null;
  }
}

const chatService = new ChatService();
export default chatService;
