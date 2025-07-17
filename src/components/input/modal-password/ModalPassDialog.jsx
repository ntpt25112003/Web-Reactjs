import React, { useState } from 'react';
import { IoArrowBackOutline, IoLockClosedOutline, IoKeyOutline, IoCheckmarkCircleOutline, IoEyeOutline, IoEyeOffOutline } from 'react-icons/io5';
import './ModalPassDialog.scss';
import Button from '../../../components/Button';

function ModalPassDialog({ isOpen, onClose, requireOldPassword = false }) {
  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');

  const passwordRequirements = {
    minLength: newPass.length >= 9,
    hasUpperCase: /[A-Z]/.test(newPass),
    hasLowerCase: /[a-z]/.test(newPass),
    hasNumber: /[0-9]/.test(newPass),
    hasSpecialChar: /[^A-Za-z0-9]/.test(newPass),
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <div className="modal-header">
          <button className="back-button" onClick={onClose}>
            <IoArrowBackOutline size={20} />
          </button>
          <h2>Đặt lại mật khẩu</h2>
        </div>

        <div className="modal-content">
          <p className="instruction">Đặt lại mật khẩu cho tài khoản của bạn</p>

          {requireOldPassword && (
            <div className="input-group">
              <IoLockClosedOutline className="icon" />
              <input
                type={showOldPass ? 'text' : 'password'}
                placeholder="Mật khẩu cũ"
                value={oldPass}
                onChange={(e) => setOldPass(e.target.value)}
              />
              <button onClick={() => setShowOldPass(!showOldPass)}>
                {showOldPass ? <IoEyeOutline /> : <IoEyeOffOutline />}
              </button>
            </div>
          )}

          <div className="input-group">
            <IoKeyOutline className="icon" />
            <input
              type={showNewPass ? 'text' : 'password'}
              placeholder="Mật khẩu mới"
              value={newPass}
              onChange={(e) => setNewPass(e.target.value)}
            />
            <button onClick={() => setShowNewPass(!showNewPass)}>
              {showNewPass ? <IoEyeOutline /> : <IoEyeOffOutline />}
            </button>
          </div>

          <div className="input-group">
            <IoCheckmarkCircleOutline className="icon" />
            <input
              type={showConfirmPass ? 'text' : 'password'}
              placeholder="Xác nhận mật khẩu"
              value={confirmPass}
              onChange={(e) => setConfirmPass(e.target.value)}
            />
            <button onClick={() => setShowConfirmPass(!showConfirmPass)}>
              {showConfirmPass ? <IoEyeOutline /> : <IoEyeOffOutline />}
            </button>
          </div>

          <div className="password-requirements">
            <p>Mật khẩu cần đạt các yêu cầu sau:</p>
            <ul>
              <li className={passwordRequirements.minLength ? 'ok' : 'fail'}>Ít nhất 9 ký tự</li>
              <li className={passwordRequirements.hasUpperCase ? 'ok' : 'fail'}>Ít nhất 1 ký tự in hoa</li>
              <li className={passwordRequirements.hasLowerCase ? 'ok' : 'fail'}>Ít nhất 1 ký tự thường</li>
              <li className={passwordRequirements.hasNumber ? 'ok' : 'fail'}>Ít nhất 1 chữ số</li>
              <li className={passwordRequirements.hasSpecialChar ? 'ok' : 'fail'}>Ít nhất 1 ký tự đặc biệt</li>
            </ul>
          </div>

          <button className="reset-button">
            <IoKeyOutline /> Đặt mật khẩu
          </button>
          {/* <Button type="primary" className="modal-footer">
            <IoKeyOutline />
            Đặt mật khẩu
          </Button> */}

        </div>
      </div>
    </div>
  );
}

export default ModalPassDialog;
