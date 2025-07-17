import React, { useEffect, useState } from 'react';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import {
  IoArrowBackOutline,
  IoPeopleOutline,
  IoTextOutline,
  IoImageOutline,
  IoCloseCircle,
  IoSearchOutline,
} from 'react-icons/io5';
import configService from '../../../../services/configService';
import showService from '../../../../services/showService';
import {apiService} from '../../../../services/apiService';
import appService from '../../../../services/appService';
import fileService from '../../../../services/fileService';
import devService from '../../../../services/devService';
import utilService from '../../../../services/utilService';
import chatService from '../../../operation/chat/chatService';
import firebaseService from '../../../../services/firebaseService';
import userService from '../../../../services/userService';
import Header from "../../../../../components/header/Header"
import './ChatCreatePage.scss'

const ChatCreatePage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isCreateGroup, setIsCreateGroup] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupImgLink, setGroupImgLink] = useState(configService.DEFAULT_AVATAR);
  const [groupImg, setGroupImg] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [filteredContacts, setFilteredContacts] = useState([]);
  const [selectedContacts, setSelectedContacts] = useState([]);
  const [chat, setChat] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [dataSourceChat, setDataSourceChat] = useState(-1);

  useEffect(() => {
    const loadContacts = async () => {
      const log = {};
      try {
        setIsLoading(true);
        const userId = userService.getUserId();
        const datasource = apiService.getDataSourceChat();
        setDataSourceChat(datasource);

        const rawContacts = await apiService.executeStore('users_sel', {
          isDeleted: 0,
          siteId: apiService.getSiteId(),
        }, datasource);

        const contactList = rawContacts
          .filter((c) => c.userId !== userId)
          .map((c) => ({
            ...c,
            Text: utilService.unicode2assci(c?.Name || '').toLowerCase(),
            profileImgUrl: c.profileImgUrl
              ? `${apiService.getFS()}/${c.profileImgUrl}`
              : configService.DEFAULT_AVATAR,
          }));

        setContacts(contactList);
        setFilteredContacts(contactList);
      } catch (e) {
        devService.exception(e);
      } finally {
        setIsLoading(false);
        appService.log('[chat-create.page] ionViewDidEnter', log);
      }
    };

    loadContacts();
  }, []);
  
  // Action UI
  const changeGroupImage = async () => {
    const log = {};
    try {
      const image = await Camera.getPhoto({
        resultType: CameraResultType.Base64,
        source: CameraSource.Photos,
      });
      if (!image?.base64String) throw new Error('Không tìm thấy ảnh đã chọn');

      const blob = fileService.base64ToBlob(image.base64String);
      const filename = `${utilService.sysdate('YYYYMMDDHHmmss')}_group_img.${image.format}`;
      const file = new File([blob], filename);

      const uploaded = await apiService.uploadAttachment('avatar_attachments', [file]);
      if (uploaded?.length) {
        setGroupImg(uploaded[0]);
        setGroupImgLink(`${apiService.getFS()}/${uploaded[0].downloadPath}`);
      }
    } catch (e) {
      devService.exception(e);
    } finally {
      appService.log('[chat-create.page] changeGroupImage', log);
    }
  };

  const onContactSearch = (value) => {
    const keyword = utilService.unicode2assci(value.trim()).toLowerCase();
    if (!keyword) {
      setFilteredContacts(contacts);
      return;
    }
    const filtered = contacts.filter((c) => c.Text.includes(keyword));
    setFilteredContacts(filtered);
    appService.log('[chat-create.page] onContactSearch', { keyword });
  };

  const selectContact = async (contact) => {
    const log = { contact, isCreateGroup };
    try {
      if (isCreateGroup) {
        const alreadyExists = selectedContacts.some((c) => c.userId === contact.userId);
        if (!alreadyExists) setSelectedContacts([...selectedContacts, contact]);
      } else {
        if (!chat) {
          await showService.loading('Đang xử lý...');
          const params = await chatService.createOrOpenPersonal(contact);
          log.params = params;
          if (params) appService.go('/chat/dtl', params, { replaceUrl: true });
        }
      }
    } catch (e) {
      devService.exception(e);
    } finally {
      await showService.loading();
      appService.log('[chat-create.page] selectContact', log);
    }
  };

  const removeContactGroup = (contact) => {
    setGroupMembers((prev) => prev.filter((c) => c.userId !== contact.userId));
  };
  
  // Save chat group
  const saveGroup = async () => {
    const log = {};
    try {
      await showService.loading('Đang xử lý...');
  
      // Validate
      if (!groupName.length) throw { error: true, msg: 'Vui lòng nhập tên nhóm' };
      if (!groupMembers.length) throw { error: true, msg: 'Vui lòng thêm thành viên' };
  
      if (!chatInfo) {
        if (!isCreateGroup) throw { error: true, msg: 'Lỗi tạo nhóm' };
  
        const senderKey = firebaseService.getUserKey();
        const sysdate = utilService.sysdate();
        const sysdateTimestamp = utilService.dateStr_to_Timestamp(sysdate);
  
        const newGroupKey = await firebaseService.newKey('messages');
        log.newGroupKey = newGroupKey;
  
        let participants = { [senderKey]: true };
        let warningSkip = false;
  
        for (const contact of groupMembers) {
          if (!contact.userName) {
            warningSkip = true;
            continue;
          }
  
          const lstReceiver = await firebaseService.findProperty('users', 'userName', contact.userName);
          if (!lstReceiver) {
            warningSkip = true;
            continue;
          }
  
          const receiverKey = Object.keys(lstReceiver)[0] || '';
          if (!receiverKey) {
            warningSkip = true;
            continue;
          }
  
          participants[receiverKey] = true;
        }
  
        log.participants = participants;
  
        const dataGroup = {
          groupName,
          profileImgUrl: groupImg?.downloadPath || '',
          createByUser: senderKey,
          createdAt: sysdateTimestamp,
          lastMessage: '👋',
          lastModifiedAt: sysdateTimestamp,
          lastModifiedBy: senderKey,
          participants,
        };
  
        log.dataGroup = dataGroup;
        await firebaseService.write(`groupChats/${newGroupKey}`, dataGroup);
  
        const dataMessage = {
          senderId: senderKey,
          text: '👋',
          timestamp: sysdateTimestamp,
        };
  
        log.dataMessage = dataMessage;
        const fbMsgKey = await firebaseService.push(`messages/${newGroupKey}`, dataMessage);
  
        if (warningSkip) showService.toast('warning', 'Một số thành viên chưa thể tham gia nhóm chat!');
  
        dataGroup.key = newGroupKey;
        dataGroup.siteId = apiService.getSiteId();
        await apiService.executeStore('Create_GroupChat', dataGroup, datasourceChat);
  
        const participantsObject = {
          chatKey: newGroupKey,
          chatType: 'groupChats',
          participantKey: Object.keys(participants).toString(),
          createdAt: sysdateTimestamp,
          siteId: apiService.getSiteId(),
        };
        await apiService.executeStore('Add_Participant', participantsObject, datasourceChat);
  
        const dataMessageDB = {
          chatKey: newGroupKey,
          chatType: 'groupChats',
          messageKey: fbMsgKey,
          messageBody: JSON.stringify(dataMessage),
          siteId: apiService.getSiteId(),
        };
        await apiService.executeStore('Send_Message', dataMessageDB, datasourceChat);
  
        const params = {
          group: true,
          chatKey: newGroupKey,
          name: groupName,
          img: dataGroup.profileImgUrl.length === 0 ? '' : apiService.getFS() + '/' + dataGroup.profileImgUrl,
        };
  
        log.params = params;
        appService.go('/chat/dtl', params, { replaceUrl: true });
      } else {
        // #TODO: update existing group
      }
    } catch (e) {
      log.error = e;
      devService.exception(e);
    } finally {
      await showService.loading();
      appService.log('[chat-create.page] createGroup', log);
    }
  };
  

  return (
    <div className="chat-create-page">
      {/* Header */}
      {/* <div className="header">
        <button className="back-button">
          <IoArrowBackOutline />
        </button>
        <h1>Thêm liên lạc</h1>
        {isLoading && <div className="loading-bar" />}
      </div> */}
      <Header
        title="Thêm liên lạc"
        showLeftIcon={true}
        leftIcon={<IoArrowBackOutline />}
      />
      

      {/* Tạo nhóm toggle */}
      <div className="form-item">
        <IoPeopleOutline className="icon" />
        <label>
          <input type="checkbox" checked={isCreateGroup} onChange={(e) => setIsCreateGroup(e.target.checked)} />
          Tạo nhóm
        </label>
      </div>

      {/* Nếu tạo nhóm */}
      {isCreateGroup && (
        <div className="group-settings">
          <div className="form-item">
            <IoTextOutline className="icon" />
            <input
              type="text"
              placeholder="Nhập tên nhóm chat"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
            />
          </div>

          <div className="form-item image-picker" onClick={() => {/* open image picker */}}>
            <IoImageOutline className="icon" />
            <span>Ảnh nhóm</span>
            <img className="avatar" src={groupImgLink} alt="avatar" />
          </div>

          <div className="selected-members">
            {groupMembers.map((c) => (
              <div className="chip" key={c.userId} onClick={() => removeContactGroup(c)}>
                <img src={c.profileImgUrl} alt="" />
                <span>{c.fullName}</span>
                <IoCloseCircle />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Searchbar */}
      <div className="searchbar">
        <IoSearchOutline />
        <input
          type="search"
          placeholder="Tìm kiếm..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />
      </div>

      {/* List danh bạ */}
      <div className="contact-list">
        {contacts.map((c) => (
          <div className="contact-item" key={c.userId} onClick={() => selectContact(c)}>
            <img className="avatar" src={c.profileImgUrl} alt="" />
            <span>{c.fullName}</span>
          </div>
        ))}
      </div>

      {/* Footer */}
      {isCreateGroup && (
        <div className="footer">
          <button className="save-button" onClick={saveGroup}>Tạo nhóm</button>
        </div>
      )}
    </div>
  );
};

export default ChatCreatePage;
