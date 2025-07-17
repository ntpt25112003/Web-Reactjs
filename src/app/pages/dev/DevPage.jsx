import React, { useEffect, useState, useRef } from "react";
import './DevPage.scss';
import {
    IoArrowBackOutline, IoChevronForward, IoNotificationsOutline, IoBugOutline, IoLibraryOutline, IoListOutline,
    IoLinkOutline, IoApertureOutline, IoCodeWorkingOutline, IoGlobeOutline, IoTimerOutline, IoAnalyticsOutline,
    IoStorefrontOutline, IoDocumentAttachOutline, IoAttachOutline, IoRefreshOutline, IoLogInOutline, IoCameraOutline,
    IoPhonePortraitOutline, IoImageOutline, IoAlertCircleOutline, IoChevronDownOutline, } from 'react-icons/io5';
import configService from "../../services/configService";
import storageService, { StorageKey } from "../../services/storageService";
import appService from "../../services/appService";
import {apiService} from "../../services/apiService";
import deviceService from "../../services/deviceService";
import menuService from "../../services/menuService";
import showService from "../../services/showService";
import devService from "../../services/devService";
import ToggleItem from '../ToggleItem';
import { useNavigate } from "react-router-dom";
import { CameraPreview } from '@capacitor-community/camera-preview';
import Header from "../../../components/header/Header";

const DevPage = () => {
  const navigate = useNavigate();
  const [storageKeys, setStorageKeys] = useState([]);
  const [server, setServer] = useState("");
  const [showCamera, setShowCamera] = useState(false);
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [imageUrl] = useState(
    "http://192.168.1.232:4553/QLVD/QLVDMatSauCCCD/20240813/20240813161752_24165522-94c1-43e9-a800-2e4a56b0c409.jpeg"
  );
  const [debugMode, setDebugMode] = useState(configService.DEBUG);
  const [traceMode, setTraceMode] = useState(configService.TRACE);

  const fileFieldRef = useRef();

  useEffect(() => {
    setServer(apiService.getBE());

    // OPTIONAL: load all keys if needed
    // const keys = Object.entries(StorageKey)
    //   .filter(([key]) => isNaN(+key))
    //   .map(([key, val]) => ({ Id: val, Name: key }));
    // setStorageKeys(keys);
  }, []);

  const selectServer = async () => {
    const log = {};
    try {
      const cssClassRel = configService.SITE_REL ? "actionPrimary" : "actionDark";
      const cssClassTest = !configService.SITE_REL && configService.SITE_TEST ? "actionPrimary" : "actionDark";
      const cssClassDev = !configService.SITE_REL && !configService.SITE_TEST ? "actionPrimary" : "actionDark";

      const lstAction = [
        { text: "Site REL", icon: "diamond-outline", cssClass: cssClassRel, data: "rel" },
        { text: "Site TEST", icon: "star-outline", cssClass: cssClassTest, data: "test" },
        { text: "Site DEV", icon: "bug-outline", cssClass: cssClassDev, data: "dev" },
      ];

      const result = await showService.actionSheetAsync(lstAction, { header: "Chọn máy chủ" });
      log.action = result;

      switch (result) {
        case "rel":
          configService.SITE_REL = true;
          break;
        case "test":
          configService.SITE_REL = false;
          configService.SITE_TEST = true;
          break;
        case "dev":
          configService.SITE_REL = false;
          configService.SITE_TEST = false;
          break;
        default:
          break;
      }

      setServer(apiService.getBE());
    } catch (e) {
      log.error = e;
      devService.exception(e);
    } finally {
      appService.log("[dev.page] selectServer", log);
    }
  };

  const debugmodeChange = (checked) => {
    const log = { checked };
    try {
      configService.DEBUG = checked;
      setDebugMode(checked);
    } catch (e) {
      log.error = e;
      devService.exception(e);
    } finally {
      appService.log("[dev.page] debugmodeChange", log);
    }
  };

  const tracemodeChange = (checked) => {
    const log = { checked };
    try {
      configService.TRACE = checked;
      setTraceMode(checked);
    } catch (e) {
      log.error = e;
      devService.exception(e);
    } finally {
      appService.log("[dev.page] tracemodeChange", log);
    }
  };

  const showLocalStorage = async (key) => {
    if (!key) return;

    const log = { key };
    try {
      const data = await storageService.get(key);
      if (!data) {
        showService.toast("warning", "Giá trị: rỗng");
        return;
      }

      const compact = typeof data === "string" && data.length > 100
        ? `${data.substring(0, 100)}...`
        : data;

      showService.toast("success", `Giá trị: ${compact}`, {
        duration: 5000,
        buttons: [
          {
            icon: "copy-outline",
            side: "end",
            handler: () => deviceService.clipboardWrite(data),
          },
        ],
      });
    } catch (e) {
      log.error = e;
      devService.exception(e);
    } finally {
      appService.log("[dev.page] showLocalStorage", log);
    }
  };

  const btnTest = async () => {
    const log = {};
    try {
      // test your devService methods here
    } catch (e) {
      log.error = e;
      devService.exception(e);
    } finally {
      appService.log("[dev.page] btnTest", log);
    }
  };

  // OAuth Zoom
  const btnOAuthZoom = async () => {
    const log = {};
    try {
      const clientId = "vsFw01dhQhWkb7OjmDiqNw";
      const redirectUri = "https://company.zoom.us";
  
      let authUrl = "https://zoom.us/oauth/authorize";
      authUrl += "?client_id=" + clientId;
      authUrl += "&response_type=code";
      authUrl += "&redirect_uri=" + encodeURIComponent(redirectUri);
  
      log.authUrl = authUrl;
  
      // Mở WebView để đăng nhập Zoom
      await InAppBrowser.openWebView({
        url: authUrl,
        title: "Ủy quyền Zoom",
      });
  
      // Clear listener cũ (nếu có)
      await InAppBrowser.removeAllListeners();
  
      // Lắng nghe URL redirect về
      await InAppBrowser.addListener("urlChangeEvent", (event) => {
        const url = event?.url || "";
        console.log("[dev.page] OAuth Zoom - urlChangeEvent", url);
  
        // Ví dụ: https://company.zoom.us/?code=abcd123
        const codeMatch = url.match(/[?&]code=([^&]+)/);
        if (codeMatch) {
          const authCode = codeMatch[1];
          console.log("✅ Zoom OAuth Code:", authCode);
          // TODO: gửi authCode về server để lấy access_token
        }
      });
    } catch (e) {
      log.error = e;
      devService.exception(e);
    } finally {
      appService.log("[dev.page] btnOAuthZoom", log);
    }
  };

  // Reload Menu
  const btnReloadMenu = async () => {
    const log = {};
    try {
      await showService.loading("Đang tải lại menu");
  
      await menuService.setMenusFromAPI(true); // gọi API lấy lại menu
      log.menu = menuService.getMenu(); // log menu hiện tại
  
      menuService.open(true); // mở lại menu (nếu có logic tương ứng)
    } catch (e) {
      log.error = e;
      devService.exception(e);
    } finally {
      await showService.loading(); // ẩn loading
      appService.log("[dev.page] btnReloadMenu", log);
    }
  };  

  // Camera
  const openCamera = async () => {
    const log = {};
    try {
      // Hide content
      if (contentRef.current) {
        contentRef.current.style.display = "none";
      }
      document.body.style.background = "transparent";
      setShowCamera(true);

      // Start camera preview
      await CameraPreview.start({
        parent: "camera-preview", // must match div id
        position: "rear",
        className: "cameraPreview",
        toBack: false,
        height: window.innerHeight,
        width: window.innerWidth,
      });

      log.i_showCamera = true;
    } catch (e) {
      log.error = e;
      devService.exception(e);
    } finally {
      appService.log("[dev.page] openCamera", log);
    }
  };

  const closeCamera = async () => {
    const log = {};
    try {
      if (contentRef.current) {
        contentRef.current.style.display = "";
      }
      document.body.style.background = "";
      setShowCamera(false);

      await CameraPreview.stop();
      log.i_showCamera = false;
    } catch (e) {
      log.error = e;
      devService.exception(e);
    } finally {
      appService.log("[dev.page] closeCamera", log);
    }
  };

  const btnTakePhoto = async () => {
    const log = {};
    try {
      const photo = await CameraPreview.capture({ quality: 90 });
      log.capturedImage = photo;

      const image = "data:image/png;base64," + photo.value;
      const cropped = await cropImage(image);
      log.imageCrop = cropped;
      setCapturedImage(cropped);
    } catch (e) {
      log.error = e;
      devService.exception(e);
    } finally {
      appService.log("[dev.page] btnTakePhoto", log);
    }
  };

  const cropImage = (dataBase64) => {
    return new Promise((resolve, reject) => {
      try {
        const canvas = document.createElement("canvas");
        const img = new Image();

        img.onload = () => {
          const width = img.width * 0.94;
          const height = width * (2 / 3);
          const x = (img.width - width) / 2;
          const y = (img.height - height) / 2;

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext("2d");
          if (!ctx) return reject("Canvas context not found");

          ctx.drawImage(img, x, y, width, height, 0, 0, width, height);
          const newimgUri = canvas.toDataURL("image/png");
          appService.log("[dev.page] cropImage", { width, height });

          resolve(newimgUri);
        };

        img.src = dataBase64;
      } catch (e) {
        appService.log("[dev.page] cropImage", { error: e });
        reject(e);
      }
    });
  };

  const btnFlashlight = async () => {
    const log = {};
    try {
      const capturedImage = await CameraPreview.capture({
        quality: 90,
      });
  
      log.capturedImage = capturedImage;
      console.log("📸 Captured Image (Base64):", capturedImage.value);
  
      // Optional: hiển thị hoặc lưu ảnh
      const imageUri = "data:image/png;base64," + capturedImage.value;
      // setCapturedImage(imageUri); // nếu muốn hiển thị ảnh
    } catch (e) {
      log.error = e;
      devService.exception(e);
    } finally {
      appService.log("[dev.page] btnFlashlight (capture)", log);
    }
  };

  //Device
  const btnDevice = () => {
    const device = appService.getDevice();
    console.log("[dev.page] btnDevice:", device);
  };

  const btnViewImage = () => {
    const url =
      "http://192.168.1.232:4553/QLVD/QLVDMatSauCCCD/20240813/20240813161752_24165522-94c1-43e9-a800-2e4a56b0c409.jpeg";
    setImageUrl(url);
    setOpenImgViewer(true);
  
    appService.log("[dev.page] btnViewImage", {
      i_openImgViewer: true,
      f_imageUrl: url,
    });
  };
  
  //Call API
  const btnCallAPI = async () => {
    const log = {};
    try {
      showService.showLoading(await appService.lang("common.loading"));
  
      const response = await apiService.request(
        "POST",
        "create_user",
        {
          id: null,
          username: "hintest08",
          password: "P@ssw0rd",
          firstname: "08",
          lastname: "Hin Test",
          email: "hintest08@hinnova.com.vn",
          phone: "0123654789",
          roles: "CUS",
        },
        false
      );
  
      log.response = response;
      console.log("API response:", response);
    } catch (e) {
      log.error = e;
      devService.exception(e);
    } finally {
      appService.log("[dev.page] btnCallAPI", log);
      await showService.loading(); // Hide loading
    }
  };
  
  const btnErrorPage = async () => {
    this.app.go('/dev/logerror', {
      a: 1,
      b: "string",
      c: false,
      d: [1,2,3,4,5],
      e: { mm:1, cc:'asdasd' }
    });
  }

  return (
    <div className="dev-page">
      <Header
        title="Development"
        showLeftIcon={true}
        showRightIcon={true}
        leftIcon={<IoArrowBackOutline/>}
        rightIcon={<IoNotificationsOutline/>}
        onRightIconClick={() => navigate("/notifications")}
      />

      <div className="setting-content">
        <div className="card">
          <div className="item" onClick={btnTest}>
            <IoBugOutline className="icon" />
            <span>Test</span>
          </div>
        
          <div className="item" onClick={() => navigate("/dev/form")}>
            <IoLibraryOutline className="icon" />
            <strong>Form Field</strong>
            <IoChevronForward className="icon-right" />
          </div>

          <div className="item" onClick={() => navigate("/dev/report")}>
            <IoListOutline className="icon" />
            <strong>Report Page</strong>
            <IoChevronForward className="icon-right" />
          </div>

          <div className="item" onClick={() => navigate("/dev/native")}>
            <IoApertureOutline className="icon" />
            <strong>Native Function</strong>
            <IoChevronForward className="icon-right" />
          </div>

          <div className="item" onClick={() => navigate("/dev/api")}>
            <IoCodeWorkingOutline className="icon" />
            <strong>API Function</strong>
            <IoChevronForward className="icon-right" />
          </div>

          <div className="item" onClick={selectServer}>
            <IoGlobeOutline className="icon" />
            <span>Server: http://localhost:5000</span>
          </div>

          <div className="item">
            <IoTimerOutline className="icon" />
            <span>Debug Mode</span>
            <div className="toggle-wrapper">
                <ToggleItem />
            </div>
          </div>

          <div className="item">
            <IoAnalyticsOutline className="icon" />
            <span>Trace Mode</span>
            <div className="toggle-wrapper">
                <ToggleItem />
            </div>
          </div>

          <div className="item">
            <IoStorefrontOutline className="icon" />
            <strong>Local Storage</strong>
            <IoChevronDownOutline className="icon-right" />
          </div>

          <div className="item">
            <IoDocumentAttachOutline className="icon" />
            <strong>Tệp đính kèm</strong>
            <IoLinkOutline className="icon-right" />
          </div>

          <div className="item">
            <IoAttachOutline className="icon" />
            <strong>File Ghi Âm</strong>
            <IoLinkOutline className="icon-right" />
          </div>

          <div className="item" onClick={btnReloadMenu}>
            <IoRefreshOutline className="icon" />
            <span>Reload Menu</span>
          </div>

          <div className="item" onClick={btnOAuthZoom}>
            <IoLogInOutline className="icon" />
            <span>OAuth Zoom</span>
          </div>

          <div className="item" onClick={openCamera}>
            <IoCameraOutline className="icon" />
            <span>Camera</span>
          </div>

          {showCamera && (
            <div className="modal-overlay">
              <div className="modal-content">
                <div className="modal-header">
                  <h3>Camera Preview</h3>
                  <button onClick={closeCamera}>✖</button>
                </div>

                {/* ✅ CHÍNH XÁC: vùng camera preview gắn ID */}
                <div id="camera-preview" style={{ width: "100%", height: "100%" }}>
                  <div className="frame-camera" />
                </div>

                <div className="cameraPreviewBtn">
                  <button onClick={btnFlashlight}>light</button>
                  <button onClick={btnTakePhoto}>cam</button>
                </div>
              </div>
            </div>
          )}

          <div className="item" onClick={btnDevice}>
            <IoPhonePortraitOutline className="icon" />
            <span>Device</span>
          </div>

          <div className="item" onClick={btnViewImage}>
            <IoImageOutline className="icon" />
            <span>View Image</span>
          </div>

          <div className="item" onClick={btnCallAPI}>
            <IoCodeWorkingOutline className="icon" />
            <span>Call API</span>
          </div>

          <div className="item" onClick={btnErrorPage}>
            <IoAlertCircleOutline className="icon" />
            <span>Error Page</span>
            <IoChevronForward className="icon-right" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DevPage;
