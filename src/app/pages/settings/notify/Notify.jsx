import React, { useState, useEffect } from "react";
import { IoArrowBackOutline } from "react-icons/io5";
import "./Notify.scss";
import ToggleItem from '../../ToggleItem';
import storageService, { StorageKey } from '../../../services/storageService';
import appService from '../../../services/appService';
import deviceService from '../../../services/deviceService';
import notifyService from '../../../services/notifyService';
import devService from '../../../services/devService';
import launcherService from '../../../services/launcherService';
import Header from "../../../../components/header/Header";

const Notify = () => {
  const [notifyAvailable, setNotifyAvailable] = useState(false);
  const [allNotifications, setAllNotifications] = useState(false);
  const [systemNotifications, setSystemNotifications] = useState(false);
  const [loginNotifications, setLoginNotifications] = useState(false);
  const [workNotifications, setWorkNotifications] = useState(false);
  const [scheduleNotifications, setScheduleNotifications] = useState(false);
  const [reminderNotifications, setReminderNotifications] = useState(false);
  const [documentNotifications, setDocumentNotifications] = useState(false);

  // On mount
  useEffect(() => {
    const loadData = async () => {
      const log = {};
      try {
        const isAvailable = await deviceService.pushNotification_available();
        setNotifyAvailable(isAvailable);
        log.notifyAvailable = isAvailable;

        if (!isAvailable) {
          setAllNotifications(false);
          return;
        }

        const f_all = await storageService.get(StorageKey.SETTING_NOTIFY, 'boolean') || false;
        setAllNotifications(f_all);
        log.allNotifications = f_all;
      } catch (e) {
        log.error = e;
        devService.exception(e);
      } finally {
        appService.log('[notify-setting.page] useEffect', log);
      }
    };

    loadData();
  }, []);

  // Toggle event
  const toggleAllNotifications = async (e) => {
    const log = { event: e };
    try {
      const toggle = e.target.checked;
      log.toogle = toggle;

      if (toggle) {
        const granted = await deviceService.pushNotification_permission(true);
        setAllNotifications(granted);
        log.allNotifications = granted;

        if (granted) {
          await storageService.set(StorageKey.SETTING_NOTIFY, true);
          await notifyService.register(launcherService);
        }
      } else {
        await storageService.set(StorageKey.SETTING_NOTIFY, false);
        await notifyService.unregister();
        setAllNotifications(false);
      }
    } catch (e) {
      log.error = e;
      if (log.toogle) setAllNotifications(false);
      devService.exception(e);
    } finally {
      appService.log('[notify-setting.page] toggleAllNotifications', log);
    }
  };

  const personalToggles = [
    {
      title: "Đăng Nhập",
      desc: "Thông báo hoạt động đăng nhập bất thường",
      value: loginNotifications,
      setter: setLoginNotifications,
    },
    {
      title: "Công Việc",
      desc: "Thông báo công việc",
      value: workNotifications,
      setter:  setWorkNotifications,
    },
    {
      title: "Lịch Công Tác",
      desc: "Thông báo liên quan đến lịch công tác",
      value: scheduleNotifications,
      setter: setScheduleNotifications,
    },
    {
      title: "Nhắc Việc",
      desc: "Thông báo của package nhắc việc",
      value: reminderNotifications,
      setter: setReminderNotifications,
    },
    {
      title: "Văn bản",
      desc: "Thông báo liên quan đến văn bản",
      value: documentNotifications,
      setter: setDocumentNotifications,
    },
  ];
  return (
    <div className="notify-page">   
      <Header
        title="Cài đặt thông báo"
        showLeftIcon={true}
        leftIcon={<IoArrowBackOutline/>}
      />

      <div className="notify-content">
        <div className="card">
          <div className="card-header">Thông báo</div>
          <ToggleItem
            title="Bật / Tắt tất cả thông báo"
            checked={allNotifications}
            onChange={toggleAllNotifications}
            disabled={!notifyAvailable}
          />
        </div>

        <div className="card">
            <div className="card-header">Ứng dụng</div>
            <ToggleItem
            title="Hệ Thống"
            desc="Nhóm thông báo hệ thống, được dùng khi gửi các thông báo liên quan đến hệ thống / ứng dụng /..."
            checked={systemNotifications}
            onChange={(e) => setSystemNotifications(e.target.checked)}
            disabled={!allNotifications}
            />
        </div>

        <div className="note">
          Lưu ý: đối với các thông báo ứng dụng, bạn cần khởi động lại ứng dụng để thay đổi có hiệu lực.
        </div>

        <div className="card">
          <div className="card-header">Cá Nhân</div>
          {personalToggles.map((item, idx) => (
            <ToggleItem
              key={idx}
              title={item.title}
              desc={item.desc}
              checked={item.value}
              onChange={(e) => item.setter(e.target.checked)}
              disabled={!allNotifications}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Notify;
