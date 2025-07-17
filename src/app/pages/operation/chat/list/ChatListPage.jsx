import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import appService from '../../../../services/appService';
import {apiService} from '../../../../services/apiService';
import userService from '../../../../services/userService';
import utilService from '../../../../services/utilService';
import devService from '../../../../services/devService';
import configService from '../../../../services/configService';
import {IoPersonAddOutline} from 'react-icons/io5';
import './ChatListPage.scss';
import Header from "../../../../../components/header/Header";

const ChatListPage = () => {
  const navigate = useNavigate();
  const [chats, setChats] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const contentRef = useRef(null);

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    const log = {};
    try {
      setIsLoading(true);
      await loadChat(log);
    } catch (e) {
      log.error = e;
      devService.exception(e);
    } finally {
      appService.log('[chat-list.page] init', log);
    }
  };

  const loadChat = async (log = {}) => {
    try {
      setIsLoading(true);
      const userId = userService.getUserId(); // hoặc hardcode như Angular
      log.userId = userId;

      const params = {
        userId: "2F87C534-425A-4B20-5773-08D86AB95156",
        meetingId: "e407a6b2-80cd-4f77-870b-b1dbb7d02d57"
      };
      log.params = params;

      const lstChat = await apiService.callStore('DHD_GetListChat', params);
      log.lstChat = lstChat;

      const processedChats = lstChat.map(chat => {
        const group = chat.chatType === 'groupChats';
        let chatImg = chat.chatImg;
        if (!chatImg || chatImg.length === 0) {
          chatImg = group ? configService.DEFAULT_AVATAR_GROUP : configService.DEFAULT_AVATAR;
        } else {
          chatImg = `${apiService.getFS()}/${chatImg}`;
        }

        return {
          ...chat,
          group,
          chatImg,
          lastTime: getTimeStamp(chat.lastTime),
        };
      });

      setChats(processedChats);
    } catch (e) {
      throw e;
    } finally {
      setIsLoading(false);
    }
  };

  const getTimeStamp = (dateStr) => {
    const sysdate = utilService.sysdate();
    const duration = utilService.compareDate(sysdate, dateStr, true);
    const durationDay = duration / 1000 / 60 / 60 / 24;

    if (durationDay === 0) return utilService.formatDate(dateStr, 'HH:mm');
    if (durationDay === 1) return `Hôm qua ${utilService.formatDate(dateStr, 'HH:mm')}`;
    if (durationDay < 365) return utilService.formatDate(dateStr, 'DD/MM');
    return utilService.formatDate(dateStr);
  };

  const doRefresh = async () => {
    const log = {};
    try {
      await loadChat(log);
    } catch (e) {
      log.error = e;
      devService.exception(e);
    } finally {
      appService.log('[chat-list.page] doRefresh', log);
    }
  };

  const openChat = (chat) => {
    const log = { chat };
    try {
      const params = {
        chatGroupId: chat.chatGroupId,
        chatGroupName: chat.chatGroupName,
        channelChatId: chat.channelChatId,
        group: chat.group,
        chatKey: chat.chatKey,
        img: chat.chatImg,
      };
      if (chat.group) {
        params.participants = chat.participants;
      } else {
        params.receiverKey = chat.fbReceiverKey;
      }
      navigate('/operation/chat/dtl', { state: params });
    } catch (e) {
      log.error = e;
      devService.exception(e);
    } finally {
      appService.log('[chat-list.page] openChat', log);
    }
  };

  // const goChatCreate = () => {
  //   navigate('/operation/chat/create');
  // };

  return (
    <div className="chat-list-page">

      <Header
        title="Tin nhắn"
        showRightIcon={true}
        rightIcon={<IoPersonAddOutline/>}
        onRightIconClick={() => navigate("/operation/chat/create")}
      />

      {isLoading && <div className="loading-bar">Đang tải...</div>}

      <div className="chat-list" ref={contentRef}>
        {chats.map(chat => (
          <div key={chat.chatGroupId} className="chat-item" onClick={() => openChat(chat)}>
            <img src={chat.chatImg} alt="avatar" className="avatar" />
            <div className="chat-info">
              <h3>{chat.chatGroupName}</h3>
              <p>{chat.lastMessage}</p>
            </div>
            <div className="chat-meta">
              <span className="time">{chat.lastTime}</span>
              {chat.num > 0 && <span className="badge">{chat.num}</span>}
            </div>
          </div>
        ))}
      </div>

      <button className="refresh-btn" onClick={doRefresh}>Làm mới</button>
    </div>
  );
};

export default ChatListPage;
