import React from 'react';
import './WelcomePage.scss';
import { IoCloseOutline } from 'react-icons/io5';
import Button from '../../../components/Button';

function ConfigDialog({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop">
        <div className="modal">
            <div className="modal-header">
            <h2>Thiết lập cấu hình App</h2>
            <IoCloseOutline onClick={onClose} size={24} />
            </div>

            <div className="modal-content">
            {/* Mạng Nội Bộ */}
            <div className="config-section">
                <div className="config-section-title">Mạng Nội Bộ</div>

                <label>Tên miền:</label>
                <input placeholder="Nhập tên miền" />

                <label>Giao thức:</label>
                <select>
                    <option value="http">http</option>
                    <option value="https">https</option>
                </select>

                <label>Port:</label>
                <input placeholder="Nhập port" />

                <label>URL:</label>
                <input placeholder="URL sẽ tự động hiển thị" readOnly />
            </div>

            {/* Mạng Internet */}
            <div className="config-section">
                <div className="config-section-title">Mạng Internet</div>

                <label>Tên miền:</label>
                <input placeholder="Nhập tên miền" />

                <label>Giao thức:</label>
                <select>
                    <option value="http">http</option>
                    <option value="https">https</option>
                </select>

                <label>Port:</label>
                <input placeholder="Nhập port" />

                <label>URL:</label>
                <input placeholder="URL sẽ tự động hiển thị" readOnly />
            </div>

            {/* Socket */}
            <div className="config-section">
                <div className="config-section-title">Socket</div>

                <label>Tên miền:</label>
                <input placeholder="Nhập tên miền" />

                <label>Port:</label>
                <input placeholder="Nhập port" />
            </div>
            </div>

            <div className="modal-footer">
                <Button type="primary">LƯU</Button>
            </div>
        </div>
    </div>

  );
}

export default ConfigDialog;
