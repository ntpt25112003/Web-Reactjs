import React, { useState, useEffect, useRef } from 'react';
import {
  IoPersonCircleOutline,
  IoNotificationsOutline,
  IoStatsChartOutline,
  IoFingerPrint,
  IoKeyOutline,
  IoLockClosedOutline,
  IoInformationCircleOutline,
  IoBugOutline,
  IoTrashBinOutline,
  IoLogOutOutline,
} from "react-icons/io5";
import "./SettingPage.scss";
import Header from "../../../components/header/Header";
import { useNavigate } from "react-router-dom";
import ModalPassDialog from "../../../components/input/modal-password/ModalPassDialog";
import appService from '../../services/appService';
import {apiService} from '../../services/apiService';
import biometricService from '../../services/biometricService';
import configService from '../../services/configService';
import devService from '../../services/devService';
// import fileService from '../../services/fileService';
import menuService from '../../services/menuService';
import showService from '../../services/showService';
import storageService, { StorageKey } from '../../services/storageService';
import userService from '../../services/userService';
// import utilService from '../../services/utilService';

const SettingsPage = () => {
  const modalPasswordRef = useRef(null);

  const [isOpenConfig, setIsOpenConfig] = useState(false);

  const [version, setVersionName] = useState('');
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [fingerPrintEnabled, setFingerPrintEnabled] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [devModeEnabled, setDevModeEnabled] = useState(false);
  const [devModeCount, setDevModeCount] = useState(0);

  const [avatarUrl, setAvatarUrl] = useState(null);

  useEffect(() => {
    onViewWillEnter();
    onViewDidEnter();
  }, []);

  const onViewWillEnter = () => {
    setDevModeCount(0);
    setDevModeEnabled(configService.DEBUG);
  };

  const onViewDidEnter = async () => {
    let log = {};
    try {
      const version = await appService.getVersion();
      setVersionName(`${version.name} (${version.build})`);
      log.versionName = `${version.name} (${version.build})`;

      setBiometricAvailable(biometricService.isAvailable());
      log.biometricAvailable = biometricService.isAvailable();

      const fingerSetting = await storageService.get(StorageKey.SETTING_FINGER, 'boolean');
      setFingerPrintEnabled(fingerSetting);
      log.fingerPrintEnabled = fingerSetting;
    } catch (e) {
      log.error = e;
      devService.exception(e);
    } finally {
      appService.log('[settings.page] onViewDidEnter', log);
    }
  };

  const getUserName = () => userService.getFullName();

  // const getUserAvatar = () => {
  //   let avatar = userService.getAvatar();
  //   return avatar ? `${apiService.getFS()}/${avatar}` : configService.DEFAULT_AVATAR;
  // };

  useEffect(() => {
    const loadAvatar = async () => {
      await userService.loadCache(); // <- BẮT BUỘC cần await
      const avatar = userService.getAvatar();
      const fs = apiService.getFS();

      console.log('[AFTER CACHE] avatar =', avatar);
      console.log('[AFTER CACHE] fs =', fs);

      if (avatar && avatar.length > 0) {
        const fullUrl = `${fs.replace(/\/$/, '')}/${avatar.replace(/^\//, '')}`;
        console.log('[AFTER CACHE] full URL =', fullUrl);
        setAvatarUrl(fullUrl);
      } else {
        setAvatarUrl(configService.DEFAULT_AVATAR);
      }
    };

    loadAvatar();
  }, []);

  const navigate = useNavigate();
  // const onAccountClick = () => appService.go('/profile');

  // const openChangePassword = () => modalPasswordRef.current?.open();

  const closeChangePassword = () => modalPasswordRef.current?.close();

  const savePassword = async (form) => {
    const log = { form };
    try {
      showService.showLoading("Đang đổi mật khẩu...");
      await apiService.changePassword(form.old, form.new);

      const stayLogin = await storageService.get(StorageKey.LOGIN_STAYLOGIN, 'boolean');
      log.stayLogin = stayLogin;

      if (stayLogin) {
        let accounts = {};
        const encoded = await storageService.get(StorageKey.LOGIN_ACCOUNTS) || '';
        if (encoded) accounts = JSON.parse(utilService.decrypt(encoded));
        accounts[userService.getUserName()] = form.new;
        const encrypted = utilService.encrypt(JSON.stringify(accounts));
        await storageService.set(StorageKey.LOGIN_ACCOUNTS, encrypted);
      }

      closeChangePassword();
      showService.toast('success', 'Đã đổi mật khẩu đăng nhập');
    } catch (e) {
      log.error = e;
      if (e.error && e.process === 'OVER_SESSION') closeChangePassword();
      devService.exception(e);
    } finally {
      showService.hideLoading();
      appService.log('[profile.page] onChangePassword', log);
    }
  };

  // const redirectToStore = () => {
  //   let url = 'https://hinnova.vn/';
  //   if (appService.isIOS()) url = 'https://apps.apple.com/app/idYOUR_APP_ID';
  //   else if (appService.isAndroid()) url = 'https://play.google.com/store/apps';
  //   window.open(url);
  // };

  // const toggleFingerprint = async (event) => {
  //   const log = { event };
  //   try {
  //     const toggle = event.target.checked;
  //     log.toggle = toggle;

  //     if (toggle) {
  //       const confirmed = await biometricService.authenticate({
  //         reason: await appService.lang('setting.biometric.confirm_reason'),
  //         title: await appService.lang('setting.biometric.confirm_title'),
  //         subtitle: await appService.lang('setting.biometric.confirm_subtitle'),
  //         description: await appService.lang('setting.biometric.confirm_description'),
  //         maxAttempts: 1,
  //       });
  //       setFingerPrintEnabled(confirmed);
  //       if (confirmed) await storageService.set(StorageKey.SETTING_FINGER, true);
  //     } else {
  //       await storageService.set(StorageKey.SETTING_FINGER, false);
  //       setFingerPrintEnabled(false);
  //     }
  //   } catch (e) {
  //     log.error = e;
  //     devService.exception(e);
  //   } finally {
  //     appService.log('[settings.page] toggleFingerprint', log);
  //   }
  // };

  const enableDeveloperMode = () => {
    const newCount = devModeCount + 1;
    setDevModeCount(newCount);
    if (newCount === 5) {
      setDevModeEnabled(true);
      configService.DEBUG = true;
      showService.toast('info', 'Đã bật DEBUG mode');
    }
  };

  const cleanAttachment = async () => {
    let log = {};
    try {
      const confirm = await showService.alertAsync({
        header: 'Xác nhận xóa!',
        message: 'Xóa toàn bộ tệp đính kèm đã tải về thiết bị',
        buttons: [
          { text: 'Đóng', role: 'cancel', cssClass: 'actionDark' },
          { text: 'Xóa', role: 'confirm', cssClass: 'actionDanger' },
        ],
      });
      if (confirm.role === 'confirm') {
        showService.showLoading('Đang dọn dẹp...');
        try {
          await fileService.deleteFolder(configService.STORAGE_FOLDER);
        } catch (_) {}
        showService.toast('success', 'Đã dọn dẹp các tệp đính kèm trên thiết bị.');
      }
    } catch (e) {
      log.error = e;
      devService.exception(e);
    } finally {
      showService.hideLoading();
      appService.log('[settings.page] cleanAttachment', log);
    }
  };

  const logOut = async () => {
    await apiService.cleanCache();
    await menuService.cleanCache();
    userService.logout();
  };
  
  return (
    <div className="setting-page">
        <Header
          title="Cài đặt"
        />

        <div className="setting-content">
            <div className="card">
            <div className="avatar-container">
                {/* <img className="avatar" src={getUserAvatar} alt="avatar" /> */}
                <div>
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt="avatar"
                      onError={(e) => (e.target.src = configService.DEFAULT_AVATAR)}
                      className="avatar"
                    />
                  ) : (
                    <p>Đang tải...</p>
                  )}
                </div>
                <div className="name">{getUserName}</div>
            </div>
            <div className="item" onClick={() => navigate("/profile")}>
                <IoPersonCircleOutline className="icon" />
                <span>Thông tin tài khoản</span>
            </div>
            </div>

            <div className="card">
            <div className="card-header">Chức năng</div>
            <div className="item" onClick={() => navigate("/settings/notify")}>
                <IoNotificationsOutline className="icon" />
                <span>Cài đặt thông báo</span>
            </div>
            <div className="item" onClick={() => navigate("/settings/dashboard")}>
                <IoStatsChartOutline className="icon" />
                <span>Tuỳ chỉnh thống kê</span>
            </div>
            </div>

            <div className="card">
            <div className="card-header">Tài Khoản và bảo mật</div>
            <div className="item disabled">
                <IoFingerPrint className="icon" />
                <span>Vân tay (không khả dụng)</span>
            </div>
            <div className="item" onClick={() => setIsOpenConfig(true)}>
                <IoKeyOutline className="icon" />
                <span>Đổi mật khẩu</span>
            </div>
            <div className="item">
                <IoLockClosedOutline className="icon" />
                <span>Khoá ứng dụng</span>
            </div>
            <div className="item">
                <IoInformationCircleOutline className="icon" />
                <span>Thiết bị đăng nhập</span>
            </div>
            <div className="item" onClick={() => navigate("/dev")}>
                <IoBugOutline className="icon" />
                <span>Nhà phát triển</span>
            </div>
            </div>

            <div className="card">
            <div className="item danger" onClick={cleanAttachment}>
                <IoTrashBinOutline className="icon" />
                <span>Dọn dẹp tệp đính kèm</span>
            </div>
            <div className="item danger" onClick={logOut}>
                <IoLogOutOutline className="icon" />
                <span>Đăng xuất</span>
            </div>
            </div>

            <div className="version-container" onClick={enableDeveloperMode}>
              setting.version : {version}
            </div>
        </div>
        <ModalPassDialog
        isOpen={isOpenConfig}
        onClose={() => {
          console.log('Đóng modal');
          setIsOpenConfig(false);
        }}
        onSubmit={savePassword}
        requireOldPassword={true}
        />
        </div>
  );
};

export default SettingsPage;
