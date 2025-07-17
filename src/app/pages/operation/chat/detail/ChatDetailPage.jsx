import React, { useEffect, useRef, useState } from 'react';
import { Keyboard } from '@capacitor/keyboard';
// import { Camera } from '@capacitor/camera';
import { useParams, useNavigate } from 'react-router-dom';
import {
    IoEllipsisVerticalOutline, IoAdd , IoRemoveCircleOutline, IoHappyOutline, IoCameraOutline, IoImageOutline, IoDocumentOutline, 
    IoSendOutline, IoArrowBackOutline, IoCloseOutline, IoLogInOutline, IoPeopleOutline, IoInformationCircleOutline, } from 'react-icons/io5';
import configService from '../../../../services/configService';
import appService from '../../../../services/appService';
import {apiService} from '../../../../services/apiService';
import fileService from '../../../../services/fileService';
import deviceService from '../../../../services/deviceService';
import firebaseService from '../../../../services/firebaseService';
import userService from '../../../../services/userService';
import showService from '../../../../services/showService';
import utilService from '../../../../services/utilService';
import devService from '../../../../services/devService';
import chatService from '../chatService';
import { useActionSheet } from '../../../../services/ActionSheetContext';
import EmojiPicker from 'emoji-picker-react';
import './ChatDetailPage.scss';


const ChatDetailPage = () => {
  // Refs
    const content = useRef(null);
    const imageViewer = useRef(null);

    // Const
    const pagingNumber = 20;

    // Router
    const navigate = useNavigate();

    // State
    const [messages, setMessages] = useState([]);
    const [isGroup, setIsGroup] = useState(true);
    const [receiverName, setReceiverName] = useState('Người nhận');
    const [receiverImg, setReceiverImg] = useState(configService.DEFAULT_AVATAR);
    const [isLoading, setIsLoading] = useState(false);
    const [showSendIcon, setShowSendIcon] = useState(false);
    const [fabOpen, setFabOpen] = useState(false);
    const [openKeyboardEmoj, setOpenKeyboardEmoj] = useState(false);
    const [newMessage, setNewMessage] = useState('');

    const [groupName, setGroupName] = useState('');
    const [groupImg, setGroupImg] = useState(null);
    const [groupImgLink, setGroupImgLink] = useState('');
    const [groupMembers, setGroupMembers] = useState([]);
    const [groupChatId, setGroupChatId] = useState(-1);
    const [contacts, setContacts] = useState([]);

    const [isGroupAddModalOpen, setIsGroupAddModalOpen] = useState(false);
    const [contactList, setContactList] = useState([]);
    const [memberList, setMemberList] = useState([]);
    const [searchKeyword, setSearchKeyword] = useState('');

    const [lastHistory, setLastHistory] = useState(true);
    const [openGroupMember, setOpenGroupMember] = useState(false);
    
    const [showFabButton, setShowFabButton] = useState(true);

    const { showActionSheet } = useActionSheet();
    

    // Internal
    const connectionSubscription = useRef(null);
    const currentGroup = useRef('general');
    const channelChatId = useRef('');
    const userId = useRef('');
    const connectionId = useRef('');
    const chatKeyRef = useRef('');
    const dataSourceChat = useRef(-1);
    const isConnectedRef = useRef(false); // dùng nếu không muốn trigger lại render
    const messagesRef = useRef([]);

  useEffect(() => {
    const sub = chatService.connectionStatus$.subscribe((status) => {
      if (status) {
        joinCurrentGroup();
      }
    });
    connectionSubscription.current = sub;

    // Event listeners
    chatService.on('ReceiveMessage', handleReceiveMessage);
    chatService.on('ReceiveGroupMessage', handleReceiveGroupMessage);
    chatService.on('UserConnected', (cid) => addSystemMessage(`Người dùng đã kết nối: ${cid}`));
    chatService.on('UserDisconnected', (cid) => addSystemMessage(`Người dùng đã ngắt kết nối: ${cid}`));

    return () => {
      sub.unsubscribe();
      chatService.off('ReceiveMessage');
      chatService.off('ReceiveGroupMessage');
      chatService.off('UserConnected');
      chatService.off('UserDisconnected');
    };
  }, []);

  useEffect(() => {
    ViewDidEnter();
  }, []);

  const ViewDidEnter = async () => {
    let log = {};
    try {
      setIsLoading(true);
      let params = appService.getParams();

      if (!params) {
        if (configService.DEBUG) {
          params = {
            chatGroupId: '6adf4cee-7333-494b-98da-33e1ac9e8040',
            chatGroupName: 'Nhóm điểm danh',
            channelChatId: 'a2d0395c-7bca-46ae-45bc-08d86f5e4705',
            group: true,
            img: '/icon/avatar.svg',
          };
        } else {
          navigate('/operation/chat');
          return;
        }
      }

      setIsGroup(params.group ?? true);
      setReceiverName(params.chatGroupName || 'Người nhận');
      setReceiverImg(params.img || configService.DEFAULT_AVATAR);

      groupChatId.current = params.chatGroupId || '';
      channelChatId.current = params.channelChatId || '';
      userId.current = userService.getUserUUID();

      await loadMessageFirst(log);
    } catch (e) {
      log.error = e;
      devService.exception(e);
    } finally {
      appService.log('[chat-detail.page] ViewDidEnter', log);
      setIsLoading(false);
    }
  };

  //Method
  const addMessage = (user, content) => {
    const newMsg = {
      me: true,
      type: 1,
      time: utilService.sysdate(),
      user,
      text: content,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, newMsg]);
    messagesRef.current.push(newMsg);
  };
  
  const addSystemMessage = (content) => {
    const sysMsg = {
      user: 'System',
      content,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, sysMsg]);
    messagesRef.current.push(sysMsg);
  };

  const joinCurrentGroup = async () => {
    if (isConnectedRef.current) {
      await chatService.joinGroup(currentGroup.current);
    }
  };
  
  const switchGroup = async (groupName) => {
    if (isConnectedRef.current && groupName !== currentGroup.current) {
      await chatService.leaveGroup(currentGroup.current);
      currentGroup.current = groupName;
      await chatService.joinGroup(groupName);
      setMessages([]);
      messagesRef.current = [];
      addSystemMessage(`Đã chuyển sang nhóm: ${groupName}`);
    }
  };

  const reconnect = async () => {
    await chatService.startConnection();
  };
  
  const disconnect = async () => {
    await chatService.stopConnection();
  };

  // Load Message
  const loadMessageFirst = async (log = {}) => {
    try {
      setIsLoading(true);
      setMessages([]);
      messagesRef.current = [];
  
      const listMessage = await apiService.callStore('DHD_GetChatLog', {
        chatGroupId: groupChatIdRef.current,
      });
  
      log.listMessage = listMessage;
  
      for (let msg of listMessage) {
        await processMessage(msg); // bạn phải định nghĩa riêng hàm này
      }
  
      setMessages(listMessage);
      messagesRef.current = listMessage;
  
      if (listMessage.length === pagingNumber) {
        setLastHistory(false);
      }
  
      // scroll to bottom
      setTimeout(() => {
        if (content.current) {
          content.current.scrollTop = content.current.scrollHeight;
        }
      }, 100);
    } catch (e) {
      throw e;
    } finally {
      setIsLoading(false);
    }
  };

  const loadMessageHistory = async (event) => {
    const log = { event };
  
    try {
      if (messagesRef.current.length === 0) return;
  
      const params = {
        chatId: chatKeyRef.current,
        lastMessageKey: messagesRef.current[0]?.key,
        size: pagingNumber,
      };
  
      const lstMsgHistoryDB = await apiService.executeStore('Get_Messages_Pagination', params, datasourceChatRef.current);
      log.lstMsgHistoryDB = lstMsgHistoryDB;
  
      if (!lstMsgHistoryDB || lstMsgHistoryDB.length === 0) {
        setLastHistory(true);
      } else {
        let lstMsgHistory = [];
        for (let msgDB of lstMsgHistoryDB) {
          const msg = JSON.parse(msgDB.messageBody);
          await processMessage(msg); // bạn phải định nghĩa riêng
          lstMsgHistory.push(msg);
        }
  
        lstMsgHistory.reverse(); // đảo chiều
        setMessages(prev => [...lstMsgHistory, ...prev]);
        messagesRef.current = [...lstMsgHistory, ...messagesRef.current];
      }
    } catch (e) {
      log.error = e;
      devService.exception(e);
    } finally {
      await event.target.complete?.();
      appService.log('[chat-detail.page] loadMessageHistory', log);
    }
  };

  const processMessage = async (msg) => {
    msg.me = msg.SenderId === userId;
    msg.type = 1;
    msg.text = msg.Content;
    msg.time = utilService.formatDate(msg.CreatedAt);
    if (msg.files && msg.files.length > 0) {
      let file = msg.files[0];
      msg.type = file.type.startsWith('image') ? 2 : 3;
      msg.text = file.name;
      msg.link = file.type.startsWith('image') ? `${apiService.getFS()}/${file.downloadPath}` : undefined;
      msg.path = file.type.startsWith('image') ? undefined : file.downloadPath;
    }
    delete msg.timestamp;
    delete msg.files;
  };

  const sendMessage = async (dataMessage) => {
    const log = {};
    try {
      const msgKey = await firebaseService.push(chatPath, dataMessage);
      await firebaseService.update((isGroup ? 'groupChats' : 'userChats') + '/' + chatKey, {
        lastMessage: dataMessage.Content,
        lastModifiedAt: dataMessage.timestamp,
        lastModifiedBy: dataMessage.senderId,
      });
      const dataDb = {
        chatKey,
        chatType: isGroup ? 'groupChats' : 'userChats',
        messageKey: msgKey,
        messageBody: JSON.stringify(dataMessage),
        siteId: apiService.getSiteId(),
      };
      await apiService.executeStore('Send_Message', dataDb, datasourceChat);
    } catch (e) {
      devService.exception(e);
    } finally {
      appService.log('[chat-detail.page] sendMessage', log);
    }
  };

  // Action UI
  const sendText = async () => {
    const msg = {
      Content: newMessage,
      CreatedAt: new Date(),
      SenderId: userId,
    };
    addMessage('Tôi', newMessage);
    await chatService.sendMessage(userId, connectionId, channelChatId, chatGroupId, newMessage);
    setNewMessage('');
  };

  const onInputChange = (e) => {
    const val = e.target.value;
    setNewMessage(val);
    setShowSendIcon(val.trim().length > 0);
  };

  // const toggleFab = () => {
  //   setFabOpen(!fabOpen);
  // };

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'auto' });
    }
  };

  // Chat Option
  const openChatOption = () => {
    const options = [
      ...(isGroup ? [
        { text: 'Thông tin', onClick: openChatInfo, icon: <IoInformationCircleOutline />,},
        { text: 'Thành viên', onClick: openChatMember, icon: <IoPeopleOutline />, }
      ] : []),
      { text: 'Đóng', onClick: () => console.log('Đóng'),icon: <IoCloseOutline />,  }
    ];
  
    showActionSheet(options); 
  };

  // Load once
  useEffect(() => {
    loadMessageFirst();
    chatService.on('ReceiveMessage', (user, msg) => addMessage(user, msg));
    return () => {
      chatService.off('ReceiveMessage');
    };
  }, []);

  // Modal Chat Info
  const openChatInfo = async () => {
    try {
      setGroupName(receiverName);
      setGroupImgLink(receiverImg);
  
      setOpenGroupInfo(true);
  
      if (groupChatId === -1) {
        const res = await apiService.executeStore('groupChats_sel', {
          key: chatKey,
          siteId: apiService.getSiteId(),
        }, dataSourceChat);
  
        if (res && res.length > 0) {
          setGroupChatId(res[0].id);
        }
      }
    } catch (e) {
      devService.exception(e);
    }
  };

  const changeGroupImage = async () => {
    try {
      const image = await Camera.getPhoto({
        resultType: CameraResultType.Base64,
        source: CameraSource.Photos,
      }).catch(() => null);
  
      if (!image || !image.base64String) return;
  
      const blob = fileService.base64ToBlob(image.base64String);
      const filename = utilService.sysdate(utilService.H_FM_DATETIME_NAME) + '_group_img.' + image.format;
      const file = new File([blob], filename);
  
      const uploads = await apiService.uploadAttachment('avatar_attachments', [file]);
  
      if (uploads && uploads.length > 0) {
        setGroupImg(uploads[0]);
        setGroupImgLink(apiService.getFS() + '/' + uploads[0].downloadPath);
      }
    } catch (e) {
      devService.exception(e);
    }
  };

  const btnSaveGroupInfo = async () => {
    try {
      if (groupName === receiverName && !groupImg) return;
      if (groupName.length === 0) throw { msg: 'Vui lòng nhập tên nhóm' };
  
      await showService.loading("Đang cập nhật...");
  
      const updateData = {};
      if (groupName !== receiverName) updateData.groupName = groupName;
      if (groupImg) updateData.profileImgUrl = groupImg.downloadPath;
  
      await firebaseService.update(`groupChats/${chatKey}`, updateData);
  
      const updateDb = { ...updateData, Id: groupChatId };
      await apiService.executeStore('groupChats_ups', updateDb, dataSourceChat);
  
      showService.toast('success', "Cập nhật nhóm thành công");
  
      if (updateData.groupName) setReceiverName(groupName);
      if (updateData.profileImgUrl) setReceiverImg(groupImgLink);
  
      setOpenGroupInfo(false);
    } catch (e) {
      devService.exception(e);
    } finally {
      await showService.loading();
    }
  };

  // Modal Chat Member 
  const openChatMember = async () => {
    try {
      setGroupName(receiverName);
      setGroupImgLink(receiverImg);
      setOpenGroupMember(true);
  
      const res = await apiService.executeStore('participants_sel', {
        chatKey,
        chatType: 'groupChats',
        type: 'MEMBER',
        isDeleted: 0,
      }, dataSourceChat);
  
      if (res) {
        const updated = res.map(mem => ({
          ...mem,
          profileImgUrl: mem.profileImgUrl?.length > 0 ? mem.profileImgUrl : configService.DEFAULT_AVATAR,
        }));
        setMembers(updated);
      }
    } catch (e) {
      devService.exception(e);
    }
  };
  const removeMember = (member, index) => {
    const confirm = async () => {
      try {
        const update = { [member.participantKey]: false };
        await firebaseService.update(`groupChats/${chatKey}/participants`, update);
  
        await apiService.executeStore('participants_ups', {
          id: member.id,
          isDeleted: 1,
        }, dataSourceChat);
  
        setMembers(prev => {
          const updated = [...prev];
          updated.splice(index, 1);
          return updated;
        });
      } catch (e) {
        devService.exception(e);
      }
    };
  
    showService.alert("Xác nhận", `Bạn có muốn loại ${member.fullName} ra khỏi nhóm?`, [
      { text: "Đóng", cssClass: 'actionDark', role: 'cancel' },
      { text: "Xác nhận", cssClass: 'actionDanger', handler: confirm }
    ]);
  };

  //Modal Chat Add Member
  const openChatAddMember = async () => {
    try {
      setIsGroupAddModalOpen(true);
      
      const lstMemberUserId = memberList.map(mem => mem.userId);
      const lstContact = await apiService.executeStore('users_sel', { isDeleted: 0 }, dataSourceChat);
  
      const processedContacts = lstContact
        .filter(contact => contact.userId !== userService.getUserId() && !lstMemberUserId.includes(contact.userId))
        .map(contact => ({
          ...contact,
          hide: false,
          state: 1,
          Text: utilService.unicode2assci(contact.fullName || '').toLowerCase(),
          profileImgUrl: contact.profileImgUrl ? apiService.getFS() + '/' + contact.profileImgUrl : configService.DEFAULT_AVATAR,
        }));
  
      setContactList(processedContacts);
    } catch (e) {
      devService.exception(e);
    }
  };

  const searchNewMember = (value) => {
    try {
      const keyword = utilService.unicode2assci(value.trim()).toLowerCase();
      const updatedContacts = contactList.map(c => ({
        ...c,
        hide: keyword ? !c.Text.includes(keyword) : false
      }));
      setContactList(updatedContacts);
    } catch (e) {
      devService.exception(e);
    }
  };

  const addMember = async (contact) => {
    try {
      contact.state = 2;
      setContactList([...contactList]);
  
      await firebaseService.update(`groupChats/${chatKey}/participants`, {
        [contact.participantKey]: false
      });
  
      const resFind = await apiService.executeStore('participants_sel', {
        chatKey,
        chatType: 'groupChats',
        participantKey: contact.key,
        siteId: apiService.getSiteId()
      }, dataSourceChat);
  
      let participantId;
  
      if (resFind.length === 0) {
        const resUps = await apiService.executeStore('participants_ups', {
          chatKey,
          chatType: 'groupChats',
          participantKey: contact.key,
          createdAt: utilService.dateStr_to_Timestamp(utilService.sysdate()),
          isDeleted: 0,
          siteId: apiService.getSiteId()
        }, dataSourceChat);
        participantId = resUps[0]?.id;
      } else {
        const resUps = await apiService.executeStore('participants_ups', {
          id: resFind[0].id,
          isDeleted: 0
        }, dataSourceChat);
        participantId = resUps[0]?.id;
      }
  
      contact.state = 3;
      contact.participantsId = participantId;
      setContactList([...contactList]);
    } catch (e) {
      devService.exception(e);
    }
  };

  const removeMember2 = async (contact) => {
    try {
      contact.state = 2;
      setContactList([...contactList]);
  
      await firebaseService.update(`groupChats/${chatKey}/participants`, {
        [contact.participantKey]: false
      });
  
      await apiService.executeStore('participants_ups', {
        id: contact.participantsId,
        isDeleted: 1
      }, dataSourceChat);
  
      contact.state = 1;
      setContactList([...contactList]);
    } catch (e) {
      devService.exception(e);
    }
  };

  const closeGroupAddMember = async () => {
    try {
      await openChatMember(); // reload danh sách thành viên
      setIsGroupAddModalOpen(false);
    } catch (e) {
      devService.exception(e);
    }
  };

  // Camera / Image / Attachment
  const openTakePhoto = async () => {
    const image = await deviceService.camera();
    if (image) await sendAttachment([image], true);
  };
  
  const openImagePicker = async () => {
    const photos = await deviceService.gallery({ limit: 5 });
    if (photos.length > 0) await sendAttachment(photos, true);
  };

  const openFilePicker = async () => {
    const resPicker = await fileService.browseFile({ limit: 1, readData: true });
  
    const files = resPicker.map(f => {
      const blob = f.blob || fileService.base64ToBlob(f.data, f.mimeType);
      return new File([blob], f.name, { type: f.mimeType });
    });
  
    if (files.length > 0)
      await sendAttachment(files, false);
  };

  const sendAttachment = async (files, isImg) => {
    const res = await apiService.uploadAttachment('message_attachments', files);
  
    const attachments = res.map(r => {
      const origin = files.find(f => f.name === r.fileName);
      return {
        downloadPath: r.downloadPath,
        name: r.fileName,
        type: r.fileType,
        size: origin.size,
      };
    });
  
    if (attachments.length === 0)
      throw new Error('Tệp đính kèm không hợp lệ');
  
    const sysdate = utilService.sysdate();
    const timestamp = utilService.dateStr_to_Timestamp(sysdate);
    const senderKey = firebaseService.getUserKey();
  
    const dataMessage = {
      senderId: senderKey,
      text: `Đã gửi ${attachments.length} ${isImg ? 'Hình ảnh' : 'Tệp đính kèm'}`,
      timestamp,
      files: attachments,
    };
  
    await sendMessage(dataMessage);
  };

  // Emoj Keyboard
  const toggleEmojiKeyboard = async () => {
    const next = !openKeyboardEmoj;
    setOpenKeyboardEmoj(next);
  
    if (!appService.isWeb()) {
      if (next) {
        await Keyboard.hide();
      } else {
        await Keyboard.show();
      }
    }
  };
  
  const closeEmojKeyboard = async () => {
    setShowFabButton(true);
    setOpenKeyboardEmoj(false);
  
    if (!appService.isWeb()) {
      await Keyboard.show();
    }
  };

  const onEmojiSelected = (emoj) => {
    if (emoj?.emoji?.length > 0) {
      setNewMessage(prev => prev + emoj.emoji);
      setShowSendIcon(true);
    }
  };

  // Handler
  const handlescrollToBottom = () => {
    setTimeout(() => {
      content.current?.scrollToBottom(300);
    }, 100);
  };
  
  const formatTimestamp = (date) => {
    if (!date) return '';
  
    const sysdate = utilService.sysdate();
    const duration = utilService.compareDate(sysdate, date, true);
    const durationDay = duration / 1000 / 60 / 60 / 24;
  
    if (durationDay === 0)
      return utilService.formatDate(date, 'HH:mm');
    else if (durationDay === 1)
      return "Hôm qua " + utilService.formatDate(date, 'HH:mm');
    else if (durationDay < 365)
      return utilService.formatDate(date, 'DD/MM HH:mm');
    else
      return utilService.formatDate(date, 'DD/MM/YYYY HH:mm');
  };

  const compactMessage = (msg) => {
    return msg.length > 40 ? msg.substring(0, 47) + '...' : msg;
  };

  const handleReceiveMessage = (user, message) => {
    setMessages((prev) => [...prev, { user, message }]);
  };

  const handleReceiveGroupMessage = (group, user, message) => {
    if (group === currentGroup.current) {
      setMessages((prev) => [...prev, { user, message }]);
    }
  };

  return (
    <div className="chat-detail-page">
    {/* Header */}
    <header className="header">
      <button className="back-button" onClick={() => window.history.back()}>
        <IoArrowBackOutline size={20}/>
      </button>
      <div className="title">
        <img src={receiverImg} alt="Avatar" className="avatar" />
        <h1>{receiverName}</h1>
      </div>
      {isGroup && (
        <button className="right-button" onClick={openChatOption}>
          <IoEllipsisVerticalOutline />
        </button>
      )}
    </header>

    {/* Loading bar */}
    {isLoading && <div className="progress-bar" />}

    {/* Message list */}
    <div className="message-list">
      {messages.map((msg, idx) => (
        <div
          key={idx}
          className={`message ${msg.me ? 'sent' : 'received'}`}
        >
          {isGroup && !msg.me && (
            <img src={msg.img} className="avatar" alt="sender" />
          )}
          <div className="message-wrap">
            {msg.type === 1 && (
              <div className="message-content">
                {isGroup && !msg.me && (
                  <span className="sender-name">{msg.senderName}</span>
                )}
                <p>{msg.text}</p>
              </div>
            )}
            {msg.type === 2 && (
              <div className="message-image">
                <img src={msg.link} onClick={() => viewImage(msg.link)} />
              </div>
            )}
            {msg.type === 3 && (
              <div className="message-file">
                <Attachment name={msg.text} path={msg.path} />
              </div>
            )}
            <span className="timestamp">{msg.time}</span>
          </div>
        </div>
      ))}
    </div>

    {/* Footer Input */}
    <footer className="chat-footer">
      <div className="input-container">
        {/* Nút FAB + xổ nút chức năng */}
        <div className="fab-container">
          <button onClick={() => setFabOpen(!fabOpen)} className="fab-main" >
            {fabOpen ? <IoCloseOutline /> : <IoAdd />}
          </button>
          {fabOpen && (
            <div className="fab-list">
              <button onClick={toggleEmojiKeyboard}><IoHappyOutline /></button>
              <button onClick={openTakePhoto}><IoCameraOutline /></button>
              <button onClick={openImagePicker}><IoImageOutline /></button>
              <button onClick={openFilePicker}><IoDocumentOutline /></button>
            </div>
          )}
        </div>

        {/* Ô nhập tin nhắn */}
        <input
          value={newMessage}
          onChange={onInputChange}
          onKeyUp={(e) => e.key === 'Enter' && sendText()}
          placeholder="Nhập tin nhắn"
          className="message-input"
        />

        {/* Nút gửi */}
        <IoSendOutline
          className={`send-icon ${showSendIcon ? 'visible' : ''}`}
          onClick={sendText}
        />
      </div>

      {/* Emoji Keyboard */}
      {openKeyboardEmoj && (
        <EmojiPicker onSelect={onEmojiSelected} />
      )}
    </footer>

    {/* Modal and components placeholder */}
    {/* You can convert modals like GroupInfoModal, GroupMemberModal, AddMemberModal separately as React components */}
  </div>
  );
};

export default ChatDetailPage;
