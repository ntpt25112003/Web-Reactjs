import React, { useEffect, useRef, useState } from "react";
import appService from "../../../services/appService";
import utilService from "../../../services/utilService";
import devService from "../../../services/devService";
import './OtpPage.scss'
import {
    IoArrowBackOutline,
  } from "react-icons/io5";
import Button from '../../../../components/Button';
import { useNavigate } from "react-router-dom";

const OtpPage = ({ email, onVerify, onResend }) => {
  const OTP_LENGTH = 6;
  const OTP_TIME = 60;
  const DEBUG = false;

  const [open, setOpen] = useState(false);
  const [countdown, setCountdown] = useState(OTP_TIME);
  const [otpValues, setOtpValues] = useState(Array(OTP_LENGTH).fill(""));
  const [emailCover, setEmailCover] = useState("");
  const inputsRef = useRef([]);

  const [otp, setOtp] = useState("");
  const navigate = useNavigate();

  const inputRef = useRef(null);

  // Countdown timer
  useEffect(() => {
    let timer;
    if (open) {
      setCountdown(OTP_TIME);
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [open]);

  // Open modal
  const handleOpen = async (email) => {
    try {
      setEmailCover(utilService.coverEmail(email));
      setOpen(true);
      setOtpValues(Array(OTP_LENGTH).fill(""));
      await appService.updateDOM(); // optional
      inputsRef.current[0]?.focus();
    } catch (e) {
      devService.exception(e);
    } finally {
      appService.log("[otp-modal] open", { email }, DEBUG);
    }
  };

  // Close modal
  const handleClose = async () => {
    try {
      setOpen(false);
      setOtpValues(Array(OTP_LENGTH).fill(""));
    } catch (e) {
      devService.exception(e);
    } finally {
      appService.log("[otp-modal] close", {}, DEBUG);
    }
  };

  // Submit OTP
  const handleVerify = async () => {
    try {
      if (countdown <= 0)
        throw { warning: true, msgCode: "login.recover.err_expire" };

      const code = otpValues.join("");
      if (code.length !== OTP_LENGTH)
        throw { warning: true, msgCode: "login.recover.err_miss_number" };

      onVerify?.(code);
    } catch (e) {
      devService.exception(e);
    } finally {
      appService.log("[otp-modal] verify", { code: otpValues.join("") }, DEBUG);
    }
  };

  // Resend OTP
  const handleResend = async () => {
    try {
      onResend?.();
      setOtpValues(Array(OTP_LENGTH).fill(""));
      setCountdown(OTP_TIME);
      setTimeout(() => inputsRef.current[0]?.focus(), 100);
    } catch (e) {
      devService.exception(e);
    } finally {
      appService.log("[otp-modal] resend", {}, DEBUG);
    }
  };

  // Handle typing
  const handleKeyDown = (e, index) => {
    const key = e.key;
    const isNum = /^[0-9]$/.test(key);

    if (isNum) {
      const newValues = [...otpValues];
      newValues[index] = key;
      setOtpValues(newValues);

      if (index < OTP_LENGTH - 1)
        inputsRef.current[index + 1]?.focus();
      else if (index === OTP_LENGTH - 1)
        handleVerify();
    } else if (key === "Backspace") {
      const newValues = [...otpValues];
      if (newValues[index] === "") {
        if (index > 0) inputsRef.current[index - 1]?.focus();
      } else {
        newValues[index] = "";
        setOtpValues(newValues);
      }
    }

    e.preventDefault();
  };

  const formatTime = (sec) => utilService.formatTime(sec);

  useEffect(() => {
    setOpen(true);
  }, []);

  return (
    <div className="otp-bg">
      <div className="bg-flag" />
      <div className="otp-container">
        <div className="main-content">
          <div className="otp-header">
            <IoArrowBackOutline className="otp-back"  onClick={() => navigate("/dev/login")} />
            <div>
              <div className="otp-title">NHẬP MÃ OTP</div>
              <div className="otp-desc">
                Điền vào đoạn mã OTP được gửi đến số <b>0979000001</b>
              </div>
              <div className="otp-timer">
                Thời gian hiệu lực <span>03:07</span>
              </div>
            </div>
          </div>

          <div className="otp-input-item">
            <input
              ref={inputRef}
              type="text"
              placeholder="Mã OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              maxLength={6}
            />
          </div>

          <div className="otp-actions">
            <Button 
                type="primary"
                className="otp-btn resend"
                disabled={countdown > 0}
                onClick={handleResend}>
                GỬI MÃ LẠI
                {countdown > 0 && <span> ({formatTime(countdown)})</span>}
            </Button>          
            <Button 
                type="secondary"
                // className="otp-btn confirm"
                disabled={countdown > 0}
                onClick={handleVerify}>
                XÁC NHẬN
            </Button>     
          </div>
        </div>
      </div>
    </div>
  );
};

export default OtpPage;
