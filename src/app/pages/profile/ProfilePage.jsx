import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from 'react-router-dom';
import {
  IoCameraOutline,
  IoPersonOutline,
  IoArrowBackOutline,
  IoTextOutline,
  IoCallOutline,
  IoTodayOutline,
  IoMailOutline,
  IoKeyOutline,
  IoLogOutOutline,
  IoTrashOutline
} from 'react-icons/io5';
import ModalPassDialog from '../../../components/input/modal-password/ModalPassDialog';
import ConfirmDialog from '../../../components/confirm/ConfirmDialog';
import './ProfilePage.scss';
import configService from "../../services/configService";
import storageService, { StorageKey } from "../../services/storageService";
import appService from "../../services/appService";
import {apiService} from "../../services/apiService";
import deviceService from "../../services/deviceService";
import userService from "../../services/userService";
import showService from "../../services/showService";
import devService from "../../services/devService";
import Header from "../../../components/header/Header";

const ProfilePage = () => {
  const AVATAR_CODE = "USER_AVATAR";

  const fileInputRef = useRef();

  const [loading, setLoading] = useState(false);
  const [title] = useState("Thông tin tài khoản");

  const [showPassModal, setShowPassModal] = useState(false);

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [avatar, setAvatar] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState(configService.DEFAULT_AVATAR);

  const [user, setUser] = useState(null);

  const [username, setUsername] = useState("");
  const [firstname, setFirstname] = useState("");
  const [lastname, setLastname] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [birthday, setBirthday] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const log = {};
      try {
        const u = userService.getUser();
        setUser(u);
        log.user = u;

        const userId = u.id;

        const avatars = await apiService.getAttachment(AVATAR_CODE, userId);
        log.avatars = avatars;

        if (avatars?.length > 0) {
          const file = avatars[0];
          setAvatar(file);
          setAvatarUrl(`${apiService.getFS()}/${file.downloadPath}`);
        } else {
          setAvatar(null);
          setAvatarUrl(configService.DEFAULT_AVATAR);
        }

        setForm(u);
      } catch (e) {
        log.error = e;
        devService.exception(e);
      } finally {
        setLoading(false);
        appService.log("[profile.page] useEffect", log);
      }
    };
    load();
  }, []);

  const setForm = (user) => {
    setUsername(user.username || "");
    setFirstname(user.firstname || "");
    setLastname(user.lastname || "");
    setEmail(user.email || "");
    setPhone(user.phone || "");
    setBirthday(user.birthday || "");
  };

  // const changeAvatar = async () => {
  //   const log = {};
  //   try {
  //     log.f_avatar = avatar;

  //     const options = [];
  //     if (!appService.isWeb()) {
  //       options.push({
  //         text: "Chụp ảnh",
  //         icon: "camera-outline",
  //         data: "camera",
  //       });
  //     }
  //     options.push({
  //       text: "Chọn từ thư viện",
  //       icon: "images-outline",
  //       data: "gallery",
  //     });

  //     const action = await showService.actionSheetAsync(options, { header: "Đổi ảnh đại diện" });
  //     log.action = action;

  //     let file = null;
  //     if (action === "camera") {
  //       file = await deviceService.camera();
  //       log.camera_file = file;
  //       if (!file) return;
  //     } else if (action === "gallery") {
  //       const files = await deviceService.gallery({ limit: 1 });
  //       log.gallery_files = files;
  //       if (!files || files.length === 0) return;
  //       file = files[0];
  //     } else {
  //       return; // Người dùng hủy action sheet
  //     }

  //     log.file = file;

  //     await showService.loading("Đang đổi ảnh đại diện...");

  //     const resUpload = await apiService.uploadAttachment(AVATAR_CODE, [file]);
  //     log.resUpload = resUpload;

  //     if (!resUpload || resUpload.length === 0) {
  //       throw { error: true, msg: "Tải lên ảnh không thành công!", detail: log };
  //     }

  //     const uploaded = resUpload[0];
  //     setAvatarUrl(`${apiService.getFS()}/${uploaded.downloadPath}`);
  //     userService.setAvatar(uploaded.downloadPath, true);

  //     // Xóa avatar cũ nếu có
  //     if (avatar) {
  //       log.deleteOld = avatar.id;
  //       await apiService.deleteAttachment([avatar.id]);
  //     }

  //     // Gán avatar mới
  //     setAvatar(uploaded);
  //     await apiService.updateAttachment([uploaded.id], userService.getUserId());

  //     // Hiển thị toast
  //     showService.toast("success", "Đã đổi ảnh đại diện");
  //   } catch (e) {
  //     log.error = e;
  //     devService.exception(e);
  //   } finally {
  //     await showService.loading(); // Ẩn loading
  //     appService.log("[profile.page] changeAvatar", log);
  //   }
  // };

  const changeAvatar = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);
    setAvatarUrl(previewUrl);
  };

  // Form Handler
  const getForm = () => {
    const checkStr = (v) => (v?.length === 0 ? null : v);
    const checkDate = (v) => (v?.length === 0 ? null : v);
  
    return {
      FirstName: checkStr(firstname),
      LastName: checkStr(lastname),
      Phone: checkStr(phone),
      Birthday: checkDate(birthday),
      UserEmail: checkStr(email),
    };
  };

  const validateForm = async (form) => {
    const errFunc = (message) => {
      throw { error: true, msg: message };
    };
  
    const assertRequire = async (field) => {
      if (!form[field] || form[field] === "") {
        const fieldName = await appService.lang("profile.field_" + field);
        throw await appService.lang("common.err_require", { field: fieldName });
      }
    };
  
    await assertRequire("FirstName");
    await assertRequire("LastName");
    await assertRequire("UserEmail");
  };

  const saveForm = async () => {
    const log = {};
    try {
      await showService.loading(await appService.lang("common.msg_saving"));
  
      const formData = getForm();
      log.formData = formData;
  
      const formToSave = { ...formData }; // hoặc merge với backend-form nếu cần
      log.form = formToSave;
  
      await validateForm(formToSave);
  
      const formCode = isCustomer ? formCodeCustomer : formCodeEmployee;
      log.formCode = formCode;
  
      const response = await apiService.formUpdate(formId, formCode, recordId, formToSave);
      log.response = response;
  
      showService.toast("success", await appService.lang("profile.success_update_account"));
    } catch (e) {
      log.error = e;
      const errMsg = await appService.lang("profile.error_update_account");
      devService.exception(log, errMsg);
    } finally {
      await showService.loading(); // Hide loading
      appService.log("[profile.page] saveForm", log);
    }
  };

  const onChangePassword = async (form) => {
    const log = { form };
    try {
      await showService.loading("Đang đổi mật khẩu...");
  
      await apiService.changePassword(form.old, form.new);
  
      const stayLogin = (await storageService.get(StorageKey.LOGIN_STAYLOGIN, "boolean")) || false;
      log.stayLogin = stayLogin;
  
      if (stayLogin) {
        let accounts = {};
        const accountsEncode = await storageService.get(StorageKey.LOGIN_ACCOUNTS) || "";
  
        if (accountsEncode.length > 0) {
          accounts = JSON.parse(utilService.decrypt(accountsEncode));
        }
  
        const username = userService.getUserName();
        accounts[username] = form.new;
        log.mapAccounts = accounts;
  
        const encrypted = utilService.encrypt(JSON.stringify(accounts));
        await storageService.set(StorageKey.LOGIN_ACCOUNTS, encrypted);
      }
  
      setPasswordModalOpen(false); // đóng modal
      showService.toast("success", "Đã đổi mật khẩu đăng nhập");
    } catch (e) {
      log.error = e;
      if (e.error && e.process === "OVER_SESSION") {
        setPasswordModalOpen(false);
      }
      devService.exception(e);
    } finally {
      await showService.loading();
      appService.log("[profile.page] onChangePassword", log);
    }
  };

  // Delete Account
  const btnDeleteAccount = async () => {
    setShowDeleteConfirm(false);
    await showService.loading("Đang xử lý...");
    await apiService.sendEmailDeleteAccount(email);
    modalOtpRef.current?.open(email);
    await showService.loading();
  };

  const onVerifyOtp = async (code) => {
    const log = { verifyCode: code };
    try {
      await showService.loading(await appService.lang("common.msg_process"));
  
      await apiService.DeleteAccount(email, code);
  
      modalOtpRef.current?.close();
  
      showService.toast("success", await appService.lang("profile.success_delete_account"));
  
      await apiService.cleanCache();
      await menuService.cleanCache();
      await userService.logout();
    } catch (e) {
      log.error = e;
      devService.exception(e);
    } finally {
      await showService.loading();
      appService.log("[profile.page] onVerifyOtp", log);
    }
  };

  const resendDeleteOTP = async () => {
    const log = { email };
    try {
      await showService.loading(await appService.lang("common.msg_process"));
  
      await apiService.sendEmailDeleteAccount(email);
  
      modalOtpRef.current?.startCountdown();
  
      showService.toast("success", await appService.lang("forgot_password.success_resend"));
    } catch (e) {
      log.error = e;
      devService.exception(e);
    } finally {
      await showService.loading();
      appService.log("[profile.page] resendDeleteOTP", log);
    }
  };

  //Logout
  const Logout = async () => {
    setShowLogoutConfirm(false);
    await apiService.cleanCache();
    await menuService.cleanCache();
    await userService.logout();
  };

  return (
    <div className="profile-page">
      <Header
        title="Thông tin tài khoản"
        showLeftIcon={true}
        leftIcon={<IoArrowBackOutline/>}
      />

      <div className="avatar-section">
        <label>Ảnh đại diện</label>
        <div className="avatar-wrapper">
          <img src={avatarUrl} alt="avatar" className="avatar" />
          <IoCameraOutline className="camera-icon" onClick={changeAvatar} />
          <input
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          ref={fileInputRef}
          onChange={handleFileChange}
        />
        </div>
      </div>

      <div className="form-section">
        <label><IoPersonOutline /> Tên đăng nhập <span style={{ color: "red" }}>*</span></label>
        <input value={username} disabled />

        <label><IoTextOutline /> Họ <span style={{ color: "red" }}>*</span> </label>
        <input value={firstname} onChange={e => setForm({ ...form, firstname: e.target.value })} />

        <label><IoTextOutline /> Tên <span style={{ color: "red" }}>*</span></label>
        <input value={lastname} onChange={e => setForm({ ...form, lastname: e.target.value })} />

        <label><IoCallOutline /> Điện thoại </label>
        <input value={phone} onChange={e => setForm({ ...form, phone: e.target.value })} />

        <label><IoTodayOutline /> Ngày sinh </label>
        <input type="date" value={birthday} onChange={e => setForm({ ...form, birthday: e.target.value })} />

        <label><IoMailOutline /> Email <span style={{ color: "red" }}>*</span></label>
        <input value={email} disabled />

        {/* <button onClick={handleSave} className="save-button">Lưu</button> */}
      </div>

      <div className="action-section">
        <button onClick={() => setShowPassModal(true)}><IoKeyOutline /> Đổi mật khẩu</button>
        <button onClick={() => setShowLogoutConfirm(true)} className="danger" ><IoLogOutOutline />Đăng xuất</button>
        <button onClick={() => setShowDeleteConfirm(true)} className="danger"><IoTrashOutline />Xoá tài khoản</button>
      </div>

      <ConfirmDialog
        open={showLogoutConfirm}
        title="Xác nhận"
        message="Bạn có muốn đăng xuất khỏi tài khoản?"
        confirmText="ĐĂNG XUẤT"
        cancelText="ĐÓNG"
        onCancel={() => setShowLogoutConfirm(false)}
        onConfirm={Logout}
      />

      <ConfirmDialog
        open={showDeleteConfirm}
        title="Xác nhận"
        message="Bạn có chắc chắn muốn xoá tài khoản của mình không?"
        confirmText="XÓA"
        cancelText="ĐÓNG"
        onCancel={() => setShowDeleteConfirm(false)}
        onConfirm={btnDeleteAccount}
      />
      
      <ModalPassDialog isOpen={showPassModal} onClose={() => setShowPassModal(false)} requireOldPassword={true} />
      {/* <ModalOtpDialog isOpen={showOtpModal} onVerify={(code) => console.log('OTP verified:', code)} onClose={() => setShowOtpModal(false)} /> */}
    </div>
  );
}

export default ProfilePage;
