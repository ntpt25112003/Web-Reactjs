import React, { useEffect, useState } from "react";
import { 
    IoFilterOutline, IoRefreshOutline, IoSearchOutline, IoAdd, IoHelp, IoDocumentOutline,
    IoChatbubbles, IoArrowBackOutline, IoFolderOpenOutline,IoCalendarClearOutline, IoCloseOutline,
    IoInformationCircleOutline, IoListOutline, IoDocumentTextOutline,IoImagesOutline,IoMapOutline, 
    IoCheckboxOutline, IoPeopleOutline, IoMicOutline } from "react-icons/io5";
import "./FeaturePage.scss";
import FieldText from '../../../components/input/field-text/FieldText';
import FieldNumber from '../../../components/input/field-num/FieldNum';
import FieldDate from '../../../components/input/field-date/FieldDate';
import Button from '../../../components/Button';
import { motion, AnimatePresence } from 'framer-motion';
import {
  expandCollapseFilterVariants,
} from '../../../animations/animations';

const FeaturePage = () => {
  const pageSize = 8;
  const mockData = [
    { id: 1, name: "THÔNG TIN", icon: IoInformationCircleOutline },
    { id: 2, name: "DANH SÁCH ĐẠI BIỂU", icon: IoListOutline },
    { id: 3, name: "TÀI LIỆU", icon: IoDocumentTextOutline},
    { id: 4, name: "PHIM ẢNH/HÌNH ẢNH", icon: IoImagesOutline },
    { id: 5, name: "SƠ ĐỒ CHỖ NGỒI", icon: IoMapOutline },
    { id: 6, name: "ĐIỂM DANH", icon: IoCheckboxOutline },
    { id: 7, name: "TỔ THẢO LUẬN", icon: IoPeopleOutline },
    { id: 8, name: "ĐIỀU HÀNH PHÁT BIỂU", icon: IoMicOutline },
    
  ];

  const [loading, setLoading] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [text, setText] = useState("");
  const [number, setNumber] = useState(0);
  const [date, setDate] = useState("");
  const [data, setData] = useState([]);
  const [pageNumber, setPageNumber] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const [isBubOpen, setIsBubOpen] = useState(false);

  const loadData = async (isMore = false) => {
    setLoading(true);
    let page = isMore ? pageNumber + 1 : 1;

    let filtered = [...mockData];
    if (text.trim()) {
      filtered = filtered.filter((x) =>
        x.name.toLowerCase().includes(text.toLowerCase())
      );
    }

    const start = (page - 1) * pageSize;
    const paged = filtered.slice(start, start + pageSize);

    setData((prev) => (isMore ? [...prev, ...paged] : paged));
    setPageNumber(page);
    setHasMore(start + pageSize < filtered.length);
    setLoading(false);
  };

  useEffect(() => {
    loadData(false);
  }, []);

  const resetFilter = () => {
    setText("");
    setNumber(0);
    setDate("");
    loadData(false);
  };

  return (
    <div className="feature-page">
      <header className="header">
        <button className="header-button" onClick={() => window.history.back()}>
          <IoArrowBackOutline size={24} />
        </button>
        <h1 className="title" >Họp theo phiên sáng chiều</h1>
        <button className="header-button" onClick={() => setShowFilter(!showFilter)}>
          <IoFilterOutline size={24}/>
        </button>
      </header>

        <div className="feature-content">
            {showFilter && (
                <motion.div
                className="filter-panel"
                variants={expandCollapseFilterVariants}
                initial="collapsed"
                animate="expanded"
                exit="collapsed"
                >
                <div className="item">
                    <div className="item-label">
                    <IoFolderOpenOutline className="icon" />
                    <span>Văn bản</span>
                    </div>
                    <div className="item-field">
                    <FieldText value={text} onChange={setText} />
                    </div>
                </div>

                <div className="item">
                    <div className="item-label">
                    <IoDocumentOutline className="icon" />
                    <span>Số</span>
                    </div>
                    <div className="item-field">
                    <FieldNumber value={number} onChange={setNumber} />
                    </div>
                </div>

                <div className="item">
                    <div className="item-label">
                    <IoCalendarClearOutline className="icon" />
                    <span>Date</span>
                    </div>
                    <div className="item-field">
                    <FieldDate value={date} onChange={setDate} />
                    </div>
                </div>

                <div className="filter-actions">
                    <Button className="outline" onClick={resetFilter}>
                    <IoRefreshOutline style={{ fontSize: 20, marginRight: 6 }} />
                    Tải lại
                    </Button>
                    <Button className="primary" onClick={() => loadData(false)}>
                    <IoSearchOutline style={{ fontSize: 20, marginRight: 6 }} />
                    Tìm
                    </Button>
                </div>
                </motion.div>
            )}


            <div className="content">
                <div className="title">
                    <h2 >DANH SÁCH CHỨC NĂNG</h2>
                </div>

                <div className="content-card" >
                    <div className="delegate-card">
                        <img
                        className="avatar"
                        src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSKXiujup2V1SDUxQwnXMQFglzZBxLArQhBTQ&s"
                        alt="avatar"
                        />
                        <div className="info">
                            <h3>Đồng chí PHAN VĂN MÃI</h3>
                            <p>Ủy viên Trung ương Đảng, Phó Bí thư Thành ủy, Chủ tịch UBND TPHCM</p>
                            <p><b>Đoàn:</b> Đoàn đại biểu A &nbsp;  </p>
                            <p><b>Tổ:</b> Tổ 2 &nbsp; <b>Số ĐB:</b> A0001</p>
                        </div>
                    </div>

                    <div className="function-grid">
                        {data.map((item) => (
                        <button key={item.id} className="function-btn">
                            {item.icon && <item.icon size={16} />}
                            <span>{item.name}</span>
                        </button>
                        ))}
                    </div>
                </div>

                {/* {hasMore && (
                    <div className="load-more">
                    <button onClick={() => loadData(true)}>Tải thêm</button>
                    </div>
                )} */}
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
  );
};

export default FeaturePage;
