import React, { useEffect, useRef, useState } from 'react';
import { LocalNotifications } from '@capacitor/local-notifications';
import { CameraPreview } from '@capacitor-community/camera-preview';
import appService from '../../../services/appService';
import deviceService from '../../../services/deviceService';
import fileService from '../../../services/fileService';
import showService from '../../../services/showService';
import devService from '../../../services/devService';
import utilService from '../../../services/utilService';
import './NativePage.scss'
import BtnQR from '../../../../components/BtnQR';
import {
    IoNotificationsOutline, IoNotificationsOffOutline, IoRecordingOutline, IoStopCircleOutline, IoQrCodeOutline,
    IoVolumeMediumOutline, IoCaretForwardOutline, IoPauseOutline, IoListOutline, IoCameraOutline,IoMicOutline,
    IoCloseOutline, IoFingerPrintOutline, IoCloudUploadOutline, IoCloudDoneOutline, IoArrowBackOutline,IoPauseCircleOutline,IoPlayCircleOutline,
  } from 'react-icons/io5';
import Header from "../../../../components/header/Header";
import ConfirmDialog from '../../../../components/confirm/ConfirmDialog';

const DevNativePage = () => {
  // Audio Record - Record
  const [audioRun, setAudioRun] = useState(false);
  const [audioPause, setAudioPause] = useState(false);
  const [audioBtnIcon, setAudioBtnIcon] = useState('mic-outline');

  // Audio Record - Play
  const [audioList, setAudioList] = useState([]);
  const [audioFileName, setAudioFileName] = useState('Chọn file ...');
  const [audioReady, setAudioReady] = useState(false);
  const [audioPlay, setAudioPlaying] = useState(false);
  const [audioCurrentTime, setAudioCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0.1);
  const [isSeeking, setIsSeeking] = useState(false);

  const [cameraPreviewOpen, setCameraPreviewOpen] = useState(false);

  const audioContext = useRef(null);
  const audioElement = useRef(null);

  const [biometricMode, setBiometricMode] = useState(null); 

  // Camera
  const [cameraOpen, setCameraOpen] = useState(false);

  // Equivalent to ionViewWillEnter
  useEffect(() => {
    setAudioRun(false);
    setAudioPause(false);
    setAudioBtnIcon('mic-outline');
    setCameraOpen(false);
  }, []);

  // Equivalent to ionViewDidEnter
  useEffect(() => {
    audioContext.current = new AudioContext();
    audioElement.current = new Audio();
  }, []);

  // ======= Local Notification =======
  const localNotification_on = async () => {
    const log = {};
    try {
      const permission = await deviceService.localNotification_permission(false);
      if (!permission) throw { error: true, msg: 'Từ chối cấp quyền thông báo!' };

      const id = await deviceService.localNotification_create(
        'Thông báo nội bộ',
        'Kiểm tra thông báo nội bộ',
        { LichId: 5412 },
        {
          autoCancel: false,
          ongoing: true,
        }
      );
      log.localNotification_id = id;
    } catch (e) {
      log.error = e;
      devService.exception(e);
    } finally {
      appService.log('[dev-native.page] localNotification_on', log);
    }
  };

  const localNotification_off = async () => {
    const log = {};
    try {
      const list = await LocalNotifications.getDeliveredNotifications();
      log.list = list;
      if (list.notifications.length === 0) return;

      const options = {
        notifications: list.notifications.map((n) => ({ id: n.id })),
      };
      log.options = options;

      await LocalNotifications.cancel(options);
    } catch (e) {
      log.error = e;
      devService.exception(e);
    } finally {
      appService.log('[dev-native.page] localNotification_off', log);
    }
  };

  // ======= Audio Record =======
  const audioRecord_run = async () => {
    const log = {};
    try {
      if (!audioRun) {
        await deviceService.runAudioRecord(true, 'voice_meet');
        setAudioRun(true);
        setAudioPause(false);
        setAudioBtnIcon('pause-circle-outline');
      } else {
        if (audioPause) {
          await deviceService.pauseAudioRecord(false); // Resume
          setAudioPause(false);
          setAudioBtnIcon('pause-circle-outline');
        } else {
          await deviceService.pauseAudioRecord(true); // Pause
          setAudioPause(true);
          setAudioBtnIcon('caret-forward-circle-outline');
        }
      }
    } catch (e) {
      log.error = e;
      devService.exception(e);
    } finally {
      appService.log('[dev-native.page] audioRecord_run', log);
    }
  };

  const renderAudioIcon = () => {
    switch (audioBtnIcon) {
      case 'pause-circle-outline': return <IoPauseCircleOutline />;
      case 'caret-forward-circle-outline': return <IoPlayCircleOutline />;
      case 'mic-outline': return <IoMicOutline />;
      default: return <IoMicOutline />;
    }
  };

  const audioRecord_end = async () => {
    const log = {};
    try {
      const record = await deviceService.runAudioRecord(false);
      log.record = record;

      setAudioList([]);
      setAudioRun(false);
      setAudioPause(false);
      setAudioBtnIcon('mic-outline');
    } catch (e) {
      log.error = e;
      devService.exception(e);
    } finally {
      appService.log('[dev-native.page] audioRecord_end', log);
    }
  };

  const audioRecord_list = async () => {
    const log = {};
    try {
      let list = audioList;
      if (list.length === 0) {
        list = await fileService.listFile('voice_meet', true);
        setAudioList(list);
      }
      log.audioList = list;
  
      const options = list.map((record) => ({
        text: record.name,
        role: 'selected',
        icon: 'document-outline',
        cssClass: 'actionDark',
        data: record,
      }));
  
      const record = await showService.actionSheetAsync(options, { header: 'Chọn file' });
      log.record = record;
      if (!record) return;
  
      // Load audio
      setAudioFileName(record.name);
      setAudioReady(false);
      setAudioPlaying(false);
      setAudioCurrentTime(0);
  
      const audio = audioElement.current;
      audio.src = record.base64;
  
      audio.oncanplaythrough = () => setAudioReady(true);
      audio.ontimeupdate = () => {
        if (!isSeeking && audioDuration) {
          const percent = audio.currentTime / audioDuration;
          setAudioCurrentTime(percent);
        }
      };
      audio.onended = () => setAudioPlaying(false);
      audio.load();
  
      const arrayBuffer = await record.blob.arrayBuffer();
      const buffer = await audioContext.current.decodeAudioData(arrayBuffer);
      setAudioDuration(buffer.duration);
      log.duration = buffer.duration;
  
      const durationStr = utilService.formatTimeShort(buffer.duration);
      setAudioFileName((prev) => `${prev} (${durationStr})`);
    } catch (e) {
      log.error = e;
      devService.exception(e);
    } finally {
      appService.log('[dev-native.page] audioRecord_list', log);
    }
  };

  const audioRecord_play = () => {
    const audio = audioElement.current;
    if (!audio) return;
  
    if (audioPlaying) {
      audio.pause();
      setAudioPlaying(false);
    } else {
      audio.play();
      setAudioPlaying(true);
    }
  };

  const audioRecord_seek = (value) => {
    if (!audioReady) return;
  
    const audio = audioElement.current;
    if (!audio) return;
  
    if (audioPlay) audio.pause();
  
    const newTime = value * audioDuration;
    audio.currentTime = newTime;
    setAudioCurrentTime(value);
  
    if (audioPlay) audio.play();
  };

  // Camera Preview
  const cameraPreview_open = async () => {
    const log = {};
    try {
      if (appService.isNavitePlatform()) {
        // Mobile
        document.querySelectorAll('.cameraHidden').forEach((el) => (el.style.display = 'none'));
        document.body.style.background = 'transparent';
  
        await CameraPreview.start({
          position: 'rear',
          toBack: true,
          disableAudio: true,
          storeToFile: false,
          enableHighResolution: true,
        });
  
        setCameraPreviewOpen(true);
      } else {
        // Web
        setCameraPreviewOpen(true);
  
        const divElement = document.getElementById('cameraPreview');
        const rect = divElement?.getBoundingClientRect();
        log.rect = rect;
  
        await CameraPreview.start({
          parent: 'cameraPreview',
          position: 'rear',
          x: rect?.left || 0,
          y: rect?.top || 0,
          width: rect?.width || 0,
          height: rect?.height || 0,
          toBack: true,
          disableAudio: true,
          storeToFile: false,
          enableHighResolution: true,
        });
  
        const video = document.getElementById('video');
        if (video) {
          video.style.height = '100%';
          video.style.width = '100%';
          video.style.objectFit = 'fill';
        }
      }
    } catch (e) {
      log.error = e;
      devService.exception(e);
    } finally {
      appService.log('[dev-native.page] cameraPreview_open', log);
    }
  };

  const cameraPreview_close = async () => {
    const log = {};
    try {
      await CameraPreview.stop();
  
      document.querySelectorAll('.cameraHidden').forEach((el) => (el.style.display = ''));
      if (appService.isNavitePlatform()) document.body.style.background = '';
  
      setCameraPreviewOpen(false);
    } catch (e) {
      log.error = e;
      devService.exception(e);
    } finally {
      appService.log('[dev-native.page] cameraPreview_close', log);
    }
  };

  // Biometric
//   const biometric = async (isRegister) => {
//     const log = { isRegister };
//     try {
//       const roleAlert = await showService.alertAsync({
//         header: isRegister ? 'Đăng ký' : 'Đăng nhập',
//         message: 'Nhập tên tài khoản',
//         buttons: [
//           { text: 'Đóng', role: 'cancel', cssClass: 'actionDark' },
//           { text: 'Duyệt', role: 'confirm', cssClass: 'actionPrimary' },
//         ],
//       });
  
//       if (roleAlert.role === 'confirm') {
//         // #TODO: Thực hiện hành động đăng ký hoặc đăng nhập sinh trắc
//         console.log('Confirm biometric action');
//       }
//     } catch (e) {
//       log.error = e;
//       devService.exception(e);
//     } finally {
//       appService.log('[dev-native.page] biometric', log);
//     }
//   };

  const biometric = (isRegister) => {
    setBiometricMode(isRegister ? 'register' : 'login');
  };
  const handleConfirmBiometric = () => {
    console.log("Confirm biometric:", biometricMode);
    setBiometricMode(null);
  };

  // Scan QR
  const scanQR_onScan = (result) => {
    const log = { result };
    try {
      const lstBarcode = JSON.parse(result);
      log.lstBarcode = lstBarcode;
  
      if (lstBarcode.length > 0) {
        showService.toast('success', lstBarcode[0].rawValue, {
          duration: 5000,
          position: 'top',
        });
      } else {
        showService.toast('warning', 'Không tìm thấy kết quả quét!');
      }
    } catch (e) {
      log.error = e;
      devService.exception(e);
    } finally {
      appService.log('[dev-native.page] result', log);
    }
  };

  return (
    <div className="native-page">
      <Header
        title="Native function"
        showLeftIcon={true}
        showRightIcon={true}
        leftIcon={<IoArrowBackOutline/>}
        rightIcon={<IoQrCodeOutline/>}
        onRightIconClick={<BtnQR onScan={scanQR_onScan} />}
      />

      {/* Content */}
      <div className="native-content">
        <ul className="native-list">

          {/* Local Notification */}
          <li className="list-item">
            <IoNotificationsOutline className="field-icon" />
            <span>Local Notification</span>
            <div className="action-buttons">
              <button onClick={localNotification_on}><IoNotificationsOutline /></button>
              <button onClick={localNotification_off}><IoNotificationsOffOutline /></button>
            </div>
          </li>

          {/* Audio Record */}
          <li className="list-item">
            <IoRecordingOutline className="field-icon" />
            <span>Audio Record</span>
            <div className="action-buttons">
              <button onClick={audioRecord_run}>
                {renderAudioIcon()}
              </button>
              {audioRun && (
                <button onClick={audioRecord_end}>
                  <IoStopCircleOutline />
                </button>
              )}
            </div>
          </li>

          {/* Audio Play + Range */}
            <li className="list-item">
                <IoVolumeMediumOutline className="field-icon" />

                {/* Group title + slider */}
                <div className="audio-range-container">
                    <span className="audio-title">Chọn file ...</span>
                    <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.01}
                        value={audioCurrentTime}
                        onMouseDown={() => setIsSeeking(true)}
                        onMouseUp={() => setIsSeeking(false)}
                        onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            setAudioCurrentTime(val);          // cập nhật UI ngay
                            audioRecord_seek(val);             // cập nhật audio.currentTime
                        }}
                        // style={{
                        //     background: `linear-gradient(to right, #e74c3c 0%, #e74c3c ${audioCurrentTime * 100}%, #ddd ${audioCurrentTime * 100}%, #ddd 100%)`,
                        //     height: '6px',
                        //     borderRadius: '4px',
                        //     appearance: 'none',
                        //   }}
                        />

                </div>

                {/* Action buttons bên phải */}
                <div className="action-buttons">
                    <button onClick={audioRecord_play} disabled={!audioReady}>
                    {audioPlay ? <IoPauseOutline /> : <IoCaretForwardOutline />}
                    </button>
                    <button onClick={audioRecord_list}>
                    <IoListOutline />
                    </button>
                </div>
            </li>


          {/* Camera Preview */}
          <li className="list-item" onClick={cameraPreview_open}>
            <IoCameraOutline className="field-icon" />
            <span>Camera Preview</span>
          </li>

          {/* Camera Modal */}
          {cameraOpen && (
            <div className="modal cameraPreviewModal">
              <div className="modal-header">
                <h2>Camera Preview</h2>
                <button onClick={cameraPreview_close}><IoCloseOutline /></button>
              </div>
              <div className="modal-body">
                <div id="cameraPreview" className="cameraPreview"></div>
              </div>
            </div>
          )}

          {/* Biometric */}
          <li className="list-item">
            <IoFingerPrintOutline className="field-icon" />
            <span>Biometric</span>
            <div className="action-buttons">
              <button onClick={() => biometric(true)}><IoCloudUploadOutline /></button>
              <button onClick={() => biometric(false)}><IoCloudDoneOutline /></button>
            </div>
          </li>
          <ConfirmDialog
            open={biometricMode !== null}
            title={biometricMode === 'register' ? 'Đăng ký' : 'Đăng nhập'}
            message="Nhập tên tài khoản"
            confirmText="DUYỆT"
            cancelText="ĐÓNG"
            onCancel={() => setBiometricMode(null)}
            onConfirm={handleConfirmBiometric}
            />

        </ul>
      </div>
    </div>
  );
};

export default DevNativePage;
