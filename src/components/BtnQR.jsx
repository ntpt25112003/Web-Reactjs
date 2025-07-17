import React from 'react';
import { Html5Qrcode } from 'html5-qrcode';

const BtnQR = ({ onScan }) => {
  const scanQRCode = async () => {
    const qrRegionId = "qr-reader";
    const html5QrCode = new Html5Qrcode(qrRegionId);

    const config = { fps: 10, qrbox: 250 };
    try {
      await html5QrCode.start(
        { facingMode: "environment" },
        config,
        (decodedText, decodedResult) => {
          html5QrCode.stop();
          onScan(JSON.stringify([{ rawValue: decodedText }]));
        },
        (error) => {
          // ignore decode errors
        }
      );
    } catch (err) {
      console.error("QR scan error", err);
    }
  };

  return (
    <>
      <button onClick={scanQRCode} style={{ background: 'none', border: 'none' }}>
        <span role="img" aria-label="QR">📷</span>
      </button>
      <div id="qr-reader" style={{ width: 300, height: 300 }}></div>
    </>
  );
};

export default BtnQR;
