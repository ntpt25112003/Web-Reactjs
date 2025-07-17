import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  IoPersonOutline,
  IoQrCodeOutline,
  IoArrowBackOutline,
  IoLockClosedOutline,
  IoEyeOffOutline,
  IoEyeOutline,
  IoRefreshOutline,
  IoCallOutline,
  IoShieldCheckmarkOutline,
} from "react-icons/io5";
import "./LoginPage.scss";
import Button from '../../../components/Button';
import { apiService } from '../../services/apiService';
import appService from '../../services/appService';

const LoginPage = () => {
  const [mode, setMode] = useState("intranet");
  const [tab, setTab] = useState("account");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: "tk01",     
    password: "123qwe",
    captcha: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const togglePassword = () => setShowPassword((prev) => !prev);

  const generateCaptcha = () => {
    const canvas = document.getElementById("captchaCanvas");
    if (canvas) {
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const text = Math.random().toString(36).substring(2, 6).toUpperCase();
      ctx.font = "18px Arial";
      ctx.fillStyle = "#000";
      ctx.fillText(text, 10, 25);
    }
  };

  // const handleSubmit = async (e) => {
  //   e.preventDefault?.();
  //   // Test hard-code
  //   localStorage.setItem("accessToken", "abc.test.token");
  //   navigate("/operation/chat");
  // };
  

  useEffect(() => {
    if (mode === "internet" && tab === "account") {
      generateCaptcha();
    }
  }, [mode, tab]);

  return (
    <div className="login-bg">
      <div className="bg-flag"></div>

      <div className="container">
        <div className="main-content">
          <span className="title">
            ĐẢNG BỘ THÀNH PHỐ<br />HỒ CHÍ MINH
          </span>

          <div className="mode-switch">
            <span className={mode === "intranet" ? "active" : ""} onClick={() => setMode("intranet")}>
              Chế độ nội bộ
            </span>
            <span className={mode === "internet" ? "active" : ""} onClick={() => setMode("internet")}>
              Chế độ Internet
            </span>
          </div>

          <div className="tab-switch">
            <button
              className={tab === "account" ? "tab active" : "tab"}
              onClick={() => setTab("account")}
            >
              <IoPersonOutline className="tab-icon" />
              {mode === "internet" ? "SỐ ĐIỆN THOẠI" : "TÀI KHOẢN"}
            </button>
            <button
              className={tab === "qr" ? "tab active" : "tab"}
              onClick={() => setTab("qr")}
            >
              <IoQrCodeOutline className="tab-icon" /> MÃ QR
            </button>
          </div>

          {tab === "account" && (
            <form className="login-form" >
              {mode === "intranet" ? (
                <>
                  {/* Tài khoản nội bộ */}
                  <div className="input-group">
                    <IoPersonOutline className="input-icon" />
                    <input
                      name="username"
                      placeholder="Tên đăng nhập"
                      value={form.username}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="input-group password-group">
                    <IoLockClosedOutline className="input-icon" />
                    <input
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Mật khẩu"
                      value={form.password}
                      onChange={handleChange}
                      required
                    />
                    <div className="eye-icon" onClick={togglePassword}>
                      {showPassword ? <IoEyeOutline /> : <IoEyeOffOutline />}
                    </div>
                  </div>
                  <div type="submit" className="login-btn">
                      <Button 
                        type="secondary"
                        onClick={() => {
                          localStorage.setItem("accessToken", "abc.test.token");
                          navigate("/operation/chat");
                        }} >
                        ĐĂNG NHẬP
                      </Button>
                  </div>
                </>
              ) : (
                <>
                  {/* Số điện thoại & captcha */}
                  <div className="input-group">
                    <IoCallOutline className="input-icon" />
                    <input
                      name="username"
                      placeholder="Số điện thoại"
                      value={form.username}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="captcha-row">
                    <div className="input-group captcha-input-item">
                        <IoShieldCheckmarkOutline className="input-icon" />
                        <input
                            name="captcha"
                            placeholder="Mã xác nhận"
                            value={form.captcha}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="captcha-display-item">
                      <div className="captcha-box">
                        <canvas id="captchaCanvas" width="70" height="25" />
                        <button type="button" className="refresh-button" onClick={generateCaptcha}>
                          <IoRefreshOutline />
                        </button>
                      </div>
                    </div>
                  </div>


                  <div type="submit" className="login-btn">
                      <Button 
                        type="secondary"
                        onClick={() => {
                          if (!form.username || !form.captcha) {
                            alert("Vui lòng nhập số điện thoại và mã xác nhận");
                            return;
                          }
                          navigate("/dev/otp");
                        }}>
                          TIẾP THEO
                      </Button>
                  </div>

                  <div className="center-text forgot-password">
                    Chúng tôi sẽ gửi một SMS chứa mã OTP <br />
                    đến số điện thoại này
                  </div>
                </>
              )}
            </form>
          )}

          {tab === "qr" && (
            <div className="qr-card">
              <div className="qr-header">Quét mã QR</div>
              <div className="qr-content">
                <p className="center-text">Đưa mã QR của bạn vào trong khung để quét.</p>
                <div className="qr-placeholder">
                  <IoQrCodeOutline size={34} />
                </div>
                {/* <button className="scan-button">QUÉT</button> */}
              </div>
            </div>
          )}

          <div className="back-link" onClick={() => navigate("/")}>
            <IoArrowBackOutline /> QUAY LẠI
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
