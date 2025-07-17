import React, { useEffect, useState, useRef } from "react";
import notifyService from '../../services/notifyService';
import showService from '../../services/showService';
import storageService from '../../services/storageService';
import appService from '../../services/appService';
import userService from '../../services/userService';
import devService from '../../services/devService';
import {
    IoArrowBackOutline,
    IoSearchOutline,
    IoEllipsisVertical,
    IoClose,
  } from "react-icons/io5";
  import Header from "../../../components/header/Header"; 
  import './NotificationsPage.scss'

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [filteredNotifications, setFilteredNotifications] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [groupedNotifications, setGroupedNotifications] = useState([]);
  const [showSearchBar, setShowSearchBar] = useState(false);
  const [userId, setUserId] = useState('');
  

  const [selectedNotification, setSelectedNotification] = useState(null);
  const modalRef = useRef(null); // nếu dùng modal custom
  

  // Load ban đầu
  useEffect(() => {
    const init = async () => {
      try {
        const id = userService.getUserId();
        setUserId(id);

        await notifyService.updateNotificationCount(id);
        await showService.loading(await appService.lang('common.loading'));
        await loadNotifications(id);
        await showService.loading(); // Hide loading
      } catch (e) {
        devService.exception(e);
      }
    };
    init();
  }, []);

  const toggleSearch = () => {
    setShowSearchBar((prev) => {
      const next = !prev;
  
      if (!next) {
        setSearchText('');
        setFilteredNotifications(notifications);
      } else {
        filterNotifications(searchText);
      }
  
      return next;
    });
  };
  
  

  const loadNotifications = async (id) => {
    const rawData = await notifyService.getNotifications(id);
    const mapped = rawData.map(n => ({
      ...n,
      notificationDetailId: n.notificationDetailId
    }));
    setNotifications(mapped);
    groupNotifications(mapped);
  };

  const groupNotifications = (list) => {
    // Logic giống Angular — gom theo ngày
    const grouped = {}; // nhóm lại
    list.forEach(item => {
      const date = item.sendDateString.split(' ')[0];
      if (!grouped[date]) grouped[date] = [];
      grouped[date].push(item);
    });
    const result = Object.entries(grouped).map(([date, items]) => ({
      date,
      displayDate: date, // hoặc format lại
      notifications: items
    }));
    setGroupedNotifications(result);
  };

  const filterNotifications = async () => {
    const term = searchText.toLowerCase().trim();
    if (!term) {
      setFilteredNotifications([...notifications]);
      return groupNotifications(notifications);
    }

    const todayText = await appService.lang('Hôm nay');
    const result = notifications.filter(notification => {
      const titleMatch = notification.title.toLowerCase().includes(term);
      const [day, month, year] = notification.sendDateString.split(' ')[0].split('/');
      const dateVariants = [
        `${day}/${month}`,
        `${day}-${month}`,
        `${day}.${month}`,
        `${day}/${month}/${year}`,
        `${day}-${month}-${year}`,
        `${day}.${month}.${year}`
      ];
      const dateMatch = dateVariants.some(p => term.includes(p) || p.includes(term));
      const todayString = new Date().toLocaleDateString('en-GB');
      const isToday = term === todayText && notification.sendDateString.includes(todayString);
      return titleMatch || dateMatch || isToday;
    });

    setFilteredNotifications(result);
    groupNotifications(result);
  };

  useEffect(() => {
    if (searchText !== '') filterNotifications();
  }, [searchText]);

  const groupNotificationsByDate = async (list) => {
    const groups = list.reduce((acc, notification) => {
      const date = notification.sendDateString.split(' ')[0];
      if (!acc[date]) acc[date] = [];
      acc[date].push(notification);
      return acc;
    }, {});
  
    const today = new Date();
    const todayString = today.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  
    const todayText = await appService.lang('Hôm nay');
  
    const result = Object.keys(groups).map(date => ({
      date,
      displayDate: date === todayString ? todayText : date,
      notifications: groups[date],
    })).sort((a, b) => {
      const dateA = convertDateStringToDate(a.date);
      const dateB = convertDateStringToDate(b.date);
      return dateB - dateA;
    });
  
    setGroupedNotifications(result);
  };

  const convertDateStringToDate = (dateString) => {
    const [day, month, year] = dateString.split('/');
    return new Date(Number(year), Number(month) - 1, Number(day));
  };

  const loadSeenState = async () => {
    const seen = await storageService.get(NOTIFICATIONS_SEEN_STATE_KEY, 'object') || {};
    const updated = notifications.map(n => ({
      ...n,
      isSeen: seen[n.id] || false
    }));
    setNotifications(updated);
  };
  
  const saveSeenState = async () => {
    const seenState = notifications.reduce((acc, n) => {
      if (n.isSeen) acc[n.id] = true;
      return acc;
    }, {});
    await storageService.set(NOTIFICATIONS_SEEN_STATE_KEY, seenState);
  };

const viewNotification = async (noti) => {
  setSelectedNotification(noti);
  if (!noti.isSeen) {
    await markNotificationAsSeen(noti.id);
  }
  // modalRef.current?.open(); // nếu là custom modal
};

const markNotificationAsSeen = async (notificationId) => {
    const index = notifications.findIndex(n => n.id === notificationId);
    if (index !== -1 && !notifications[index].isSeen) {
      const updated = [...notifications];
      updated[index].isSeen = true;
      setNotifications(updated);
      await notifyService.markNotificationAsSeen(userId, notificationId);
    }
  };


  return (
    <div className="notify-page">
      <Header
        title="Thông báo"
        showLeftIcon={true}
        showRightIcon={true}
        leftIcon={<IoArrowBackOutline/>}
        rightIcon={<IoSearchOutline/>}
        onRightIconClick={toggleSearch}
      />

      {/* Searchbar */}
      {showSearchBar && (
        <div className="searchbar">
            <IoSearchOutline size={20}/>
          <input
            type="search"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Tìm kiếm thông báo"
            />
        </div>
      )}

      {/* Notifications List */}
      {/* <ul className="notification-list">
        {groupedNotifications.map((group) => (
          <li key={group.date}>
            <div className="divider">{group.displayDate}</div>
            {group.notifications.map((noti) => (
              <div
                key={noti.id}
                className={`notification-item ${
                  !noti.isSeen ? "unread" : ""
                }`}
                onClick={() => handleViewNotification(noti)}
              >
                <div className="content">
                  <h2 className={!noti.isSeen ? "bold" : ""}>{noti.title}</h2>
                  <p>{noti.sendDateString.split(" ")[1]}</p>
                </div>
                <button
                  className="action"
                  onClick={(e) => {
                    e.stopPropagation();
                    openActionSheet(noti);
                  }}
                >
                  <IoEllipsisVertical />
                </button>
              </div>
            ))}
          </li>
        ))}
      </ul> */}

      {/* Modal Chi tiết thông báo */}
      {/* <Modal ref={modalRef}>
        <div className="toolbar">
          <h1>Chi tiết thông báo</h1>
          <button onClick={handleCloseModal}>
            <IoClose />
          </button>
        </div>
        {selectedNotification && (
          <div className="modal-content">
            <h2>{selectedNotification.title}</h2>
            <div
              dangerouslySetInnerHTML={{
                __html: selectedNotification.content,
              }}
            />
            <p>{selectedNotification.sendDateString}</p>
          </div>
        )}
      </Modal> */}
    </div>
  );
};

export default NotificationsPage;
