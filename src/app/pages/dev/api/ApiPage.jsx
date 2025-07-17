import React from 'react';
import { IoArrowBackOutline, IoVideocamOutline, IoMicOutline } from 'react-icons/io5';
import { useNavigate } from 'react-router-dom';

import appService from '../../../services/appService';
import {apiService} from '../../../services//apiService';
import showService from '../../../services/showService';
import devService from '../../../services/devService';
import Header from "../../../../components/header/Header";
import './ApiPage.scss'

function DevApiPage() {
  const navigate = useNavigate();

  const omocall_SpeechToText = async () => {
    const log = {};
    try {
      // TODO: Call Omicall API
      // POST https://public-v1-stg.omicrm.com/api/ai/register_webhook_ai
    } catch (e) {
      log.error = e;
      devService.exception(e);
    } finally {
      appService.log('[dev-api.page] omocall_SpeechToText', log);
    }
  };

  const zoomMeet = async () => {
    const log = {};
    try {
      showService.showLoading('Đang tạo...');

      const res = await apiService.zoom_CreateMeet(
        'hinnova1509@gmail.com',
        'My Meeting',
        'P@ssw0rd',
        1440,
        'My Meeting'
      );
      log.res = res;

      showService.toast('success', 'Đã tạo cuộc họp');
    } catch (e) {
      log.error = e;
      devService.exception(e);
    } finally {
      showService.hideLoading();
      appService.log('[dev-api.page] zoomMeet', log);
    }
  };

  return (
    <div className="api-page">
      <Header
        title="API Function"
        showLeftIcon={true}
        leftIcon={<IoArrowBackOutline/>}
      />

      <div className="api-content">
        <div className="api-list">
          <div onClick={omocall_SpeechToText} className="api-item">
            <IoMicOutline className="field-icon" />
            <span>Speech to Text</span>
          </div>
          <div onClick={zoomMeet} className="api-item">
            <IoVideocamOutline className="field-icon" />
            <span>  Zoom Meet</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DevApiPage;
