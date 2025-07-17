// SegmentsPage.jsx
import React, { useEffect, useState } from 'react';
import {
  IoArrowBackOutline,
  IoStorefrontOutline,
  IoPeopleOutline,
  IoArrowForwardOutline,
  IoAdd,
  IoHelp,
  IoChatbubbles,
  IoCloseOutline
} from 'react-icons/io5';
import './SegmentPage.scss';

const SegmentPage = () => {
  const [loading, setLoading] = useState(false);
  const [dates, setDates] = useState([]);
  const [startIndex, setStartIndex] = useState(0);
  const [selectedDate, setSelectedDate] = useState('');
  const [activatedButton, setActivatedButton] = useState('hoitruong');

  useEffect(() => {
    const tempDates = Array.from(Array(10).keys()).map(i =>
      new Date(new Date().setDate(new Date().getDate() - i)).toLocaleDateString()
    ).reverse();
    setDates(tempDates);
    setSelectedDate(tempDates[0]);
  }, []);

  const visibleDates = dates.slice(startIndex, startIndex + 3);

  const handlePrev = () => {
    if (startIndex > 0) setStartIndex(startIndex - 1);
  };

  const handleNext = () => {
    if (startIndex + 3 < dates.length) setStartIndex(startIndex + 1);
  };

  const handleButtonClick = (btn) => {
    setActivatedButton(btn);
    console.log(btn);
  };

  const [isBubOpen, setIsBubOpen] = useState(false);

  return (
    <div className="segments-page">
      <div className="segments-header">
        <button className="back-button" onClick={() => window.history.back()}>
          <IoArrowBackOutline size={24} />
        </button>
        <h1 className="segments-title" >Họp theo phiên sáng chiều</h1>
      </div>

      <div className="content">
        <div className="sub-toolbar">
          <h2 >ĐIỂM DANH</h2>
        </div>

        <div className="container">
          <div className="left-container">
            <button
              className={`segment-btn ${activatedButton === 'hoitruong' ? 'active' : ''}`}
              onClick={() => handleButtonClick('hoitruong')}
            >
              <IoStorefrontOutline size={38} style={{ marginBottom: 10 }} />
              <span>Hội trường</span>
            </button>

            <button
              className={`segment-btn ${activatedButton === 'to' ? 'active' : ''}`}
              onClick={() => handleButtonClick('to')}
            >
              <IoPeopleOutline size={38} style={{ marginBottom: 10 }} />
              <span>Tổ</span>
            </button>
          </div>

          <div className="right-container">
            <div className="date-segment-container">
              <button onClick={handlePrev} disabled={startIndex === 0}>
                <IoArrowBackOutline />
              </button>
              <div className="segment-dates">
                {visibleDates.map(date => (
                  <button
                    key={date}
                    className={`date-button ${selectedDate === date ? 'selected' : ''}`}
                    onClick={() => setSelectedDate(date)}
                  >
                    {date}
                  </button>
                ))}
              </div>
              <button onClick={handleNext} disabled={startIndex + 3 >= dates.length}>
                <IoArrowForwardOutline />
              </button>
            </div>
          </div>
        </div>

        <div className="bub">
            <button
                className="bub-main"
                onClick={() => setIsBubOpen(!isBubOpen)} // toggle mở/đóng
            >
                {isBubOpen ? <IoCloseOutline /> : <IoAdd />}
            </button>

            {isBubOpen && ( // chỉ hiển thị nếu bật
                <div className="bub-list">
                <button><IoHelp /></button>
                <button><IoChatbubbles/></button>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default SegmentPage;
