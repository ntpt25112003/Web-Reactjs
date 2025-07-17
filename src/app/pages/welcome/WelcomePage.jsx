import React, { useState } from 'react';
import './WelcomePage.scss';
import { useNavigate } from 'react-router-dom';
import { IoHomeOutline } from 'react-icons/io5';
import { IoGlobeOutline } from 'react-icons/io5';
import ConfigDialog from "../welcome/ConfigDialog";


function WelcomePage() {
  const [isOpenConfig, setIsOpenConfig] = useState(false);
  const navigate = useNavigate();

  const login = () => {
    navigate('/dev/login');
  };

  console.log('isOpenConfig:', isOpenConfig);

  return (
    <div className="welcome-bg">
      <div className="bg-flag"></div>

      <div className="container">
        <div className="main-content">
          <span className="title">
            ĐẢNG BỘ THÀNH PHỐ<br />HỒ CHÍ MINH
          </span>

          <div>
            <div className="instruction">
              Quý đại biểu vui lòng chọn địa điểm kết nối
            </div>
            <div className="welcome-cards">
              <div className="welcome-card" onClick={login}>
                <IoHomeOutline className="icon" />
                <div className="card-title">Hội trưởng thành ủy</div>
              </div>
              <div className="welcome-card">
                <IoGlobeOutline className="icon"  />
                <div className="card-title">Ngoài hội trường</div>
              </div>
            </div>
          </div>
        </div>

        <button className="config-btn" 
        onClick={() => setIsOpenConfig(true)}>
          Cấu hình
        </button>
      </div>

      {/* Dùng component modal riêng */}
      <ConfigDialog
        isOpen={isOpenConfig}
        onClose={() => {
          console.log('Đóng modal');
          setIsOpenConfig(false);
        }}
      />
    </div>
  );
}

export default WelcomePage;
