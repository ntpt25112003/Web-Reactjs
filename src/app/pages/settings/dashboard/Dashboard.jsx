import React, { useEffect, useState } from "react";
import configService from "../../../services/configService";
import storageService, { StorageKey } from "../../../services/storageService";
import appService from "../../../services/appService";
import devService from "../../../services/devService";
import {
  IoArrowBackOutline,
  IoReorderThreeOutline,
} from "react-icons/io5";
import "./Dashboard.scss";
import ToggleItem from '../../ToggleItem';
import Header from "../../../../components/header/Header";

const Dashboard = () => {
  const [lstFunction, setLstFunction] = useState([]);
  const [lstTodo, setLstTodo] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      const log = {};
      try {
        await loadFunction();
        await loadTodo();
      } catch (e) {
        log.error = e;
        devService.exception(e);
      } finally {
        appService.log("[dashboard-setting.page] useEffect", log);
      }
    };
    loadData();
  }, []);

  const loadFunction = async () => {
    const mapName = {
      TOTAL_DOC: "Tổng hợp văn bản",
      DOC_PROCESS: "Văn bản cần xử lý",
      WEEKLY_MEET: "Lịch họp của phòng trong tuần",
      DOC_RELEASED: "Văn bản đã phát hành",
      IDOC_RESOLVED: "Văn bản đến đã giải quyết",
      STATIC_DOCQM: "Thống kê văn bản qua mạng",
      DOC_INFO: "Thông tin văn bản",
    };

    let strLstSave = await storageService.get(StorageKey.SETTING_DASHBOARD_FUNCTION);
    if (!strLstSave) strLstSave = configService.HOME_WIDGET_CONFIG;
    const lstStrSave = strLstSave.split(",");

    const mapFunc = {};
    Object.entries(mapName).forEach(([code, name]) => {
      mapFunc[code] = {
        code,
        name,
        check: lstStrSave.includes(code),
      };
    });

    const ordered = lstStrSave.filter((code) => mapFunc[code]).map((code) => mapFunc[code]);
    const hidden = Object.values(mapFunc).filter((f) => !ordered.includes(f));

    setLstFunction([...ordered, ...hidden]);
  };

  const onChangeFunction = (index, checked) => {
    const updated = [...lstFunction];
    updated[index].check = checked;
    setLstFunction(updated);
    saveFunction(updated);
  };

  const saveFunction = (data) => {
    const codes = data.filter((f) => f.check).map((f) => f.code);
    storageService.set(StorageKey.SETTING_DASHBOARD_FUNCTION, codes.join(","));
  };

  const loadTodo = async () => {
    let data = await storageService.get(StorageKey.SETTING_DASHBOARD_TODO, "object");
    if (!data) {
      data = [
        { code: "IDOC_CPC", name: "VB đến chờ phân công", check: true },
        { code: "IDOC_DXL", name: "VB đến đang xử lý", check: true },
        { code: "MAIL", name: "Thư mời họp", check: true },
        { code: "ODOC_CD", name: "VB đi chờ duyệt", check: true },
      ];
    }
    setLstTodo(data);
  };

  const onChangeTodo = (index, checked) => {
    const updated = [...lstTodo];
    updated[index].check = checked;
    setLstTodo(updated);
    saveTodo(updated);
  };

  const saveTodo = (data) => {
    storageService.set(StorageKey.SETTING_DASHBOARD_TODO, data);
  };

  return (
    <div className="dashboard-page">
      <Header
        title="Tùy chỉnh thống kê"
        showLeftIcon={true}
        leftIcon={<IoArrowBackOutline/>}
      />

      <div className="dashboard-content">
        <div className="card">
          <div className="card-header">
            Chức năng trang chủ
            <small>
              Chọn chức năng bên dưới để tùy chỉnh trang chủ. Nhấn giữ và kéo để sắp xếp thứ tự hiển thị
            </small>
          </div>
          {lstFunction.map((item, i) => (
            <div className="item" key={item.code}>
              <div className="left">
                <input
                  type="checkbox"
                  checked={item.check}
                  onChange={(e) => onChangeFunction(i, e.target.checked)}
                />
                <span>{item.name}</span>
              </div>
              <IoReorderThreeOutline className="reorder-icon" />
            </div>
          ))}

        </div>

        <div className="card">
          <div className="card-header">
            Công việc cần xử lý
            <small>
              Chọn chức năng bên dưới để tùy chỉnh công việc hiển thị. Nhấn giữ và kéo để sắp xếp thứ tự hiển thị
            </small>
          </div>
          {lstTodo.map((item, i) => (
            <div className="item" key={item.code}>
              <div className="left">
                <input
                  type="checkbox"
                  checked={item.check}
                  onChange={(e) => onChangeTodo(i, e.target.checked)}
                />
                <span>{item.name}</span>
              </div>
              <IoReorderThreeOutline className="reorder-icon" />
            </div>
          ))}
        </div>

        <div className="card">
          <div className="card-header">Ứng dụng</div>
          <ToggleItem
            title="Hệ Thống"
            desc="Nhóm thông báo hệ thống, được dùng khi gửi các thông báo liên quan đến hệ thống / ứng dụng /..."
          />
        </div>

        <div className="note">Lưu ý: bạn cần khởi động lại ứng dụng để thay đổi có hiệu lực.</div>

        <div className="card">
          <div className="card-header">Cá Nhân</div>
          {[ 
            { title: "Đăng Nhập", desc: "Thông báo hoạt động đăng nhập bất thường" },
            { title: "Công Việc", desc: "Thông báo công việc" },
            { title: "Lịch Công Tác", desc: "Thông báo liên quan đến lịch công tác" },
            { title: "Nhắc Việc", desc: "Thông báo của package nhắc việc" },
            { title: "Văn bản", desc: "Thông báo liên quan đến văn bản" },
          ].map((item, idx) => (
            <ToggleItem key={idx} title={item.title} desc={item.desc} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
