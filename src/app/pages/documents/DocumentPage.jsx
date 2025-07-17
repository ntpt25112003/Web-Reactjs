import React, { useEffect, useState, useRef } from 'react';
import appService from '../../services/appService';
import devService from '../../services/devService';
import "./DocumentPage.scss";
import {
    IoArrowBackOutline,IoCloseOutline, IoAdd , IoHelp,IoChatbubbles,IoCalendarClearOutline,
    IoSearchOutline,IoFilterOutline, IoFolderOpenOutline, IoDocumentOutline, IoRefreshOutline,
} from "react-icons/io5";
import FieldText from '../../../components/input/field-text/FieldText';
import FieldNumber from '../../../components/input/field-num/FieldNum';
import FieldDate from '../../../components/input/field-date/FieldDate';
import Button from '../../../components/Button';
import { motion, AnimatePresence } from 'framer-motion';
import { expandCollapseFilterVariants } from '../../../animations/animations';


const DocumentPage = () => {
  const pageSize = 7;
  const content = Array.from({ length: 20 }, (_, i) => ({
    Id: i + 1,
    Title: `Document ${i + 1}`,
  }));

  const [isBubOpen, setIsBubOpen] = useState(false);

  const [loading, setLoading] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [totalRow, setTotalRow] = useState(0);

  const [text, setText] = useState('');
  const [number, setNumber] = useState(0);
  const [date, setDate] = useState('');
  const [pageNumber, setPageNumber] = useState(1);

  const [lstData, setData] = useState([]);
  const [paging, setPaging] = useState(true);

  const [selectedTab, setSelectedTab] = useState('post');

  const loadMoreRef = useRef(null);

//   const app = appService.getInstance();
//   const dev = devService.getInstance();

  useEffect(() => {
    setPaging(true);
    init();
  }, []);

  // Load dữ liệu lần đầu
  useEffect(() => {
    loadData(false);
  }, []);

  // Quan sát phần tử cuối để auto loadMore
  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      const entry = entries[0];
      // Nếu load đủ rồi thì không làm gì nữa
      if (entry.isIntersecting && paging && lstData.length < content.length) {
        loadData(true);
      }
    }, { threshold: 1.0 });
  
    const currentRef = loadMoreRef.current;
    if (currentRef) observer.observe(currentRef);
  
    return () => {
      if (currentRef) observer.unobserve(currentRef);
    };
  }, [paging, lstData]);
  

  const init = async () => {
    try {
      setLoading(true);
      await loadData();
    } catch (e) {
      devService.exception(e);
    } finally {
      appService.log('[document.page] init');
    }
  };

  const btnReset = () => {
    setText('');
    setNumber(0);
    setDate('');
    appService.log('[document.page] btnReset');
  };

  const btnSearch = async () => {
    try {
      await loadData(false);
    } catch (e) {
      dev.exception(e, undefined, await app.lang("task-assign.mgr.err_search_title"));
    } finally {
      appService.log('[document.page] btnSearch');
    }
  };

  const loadData = async (isMore = false) => {
    const page = isMore ? pageNumber + 1 : 1;
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
  
    // Nếu đã đủ rồi thì không load nữa
    if (start >= content.length) {
      setPaging(false);
      return;
    }
  
    await new Promise(r => setTimeout(r, 300));
  
    const paged = content.slice(start, end);
    setData(prev => isMore ? [...prev, ...paged] : paged);
    setPageNumber(page);
    setTotalRow(content.length);
    setPaging(end < content.length);
  };

  const resetFilter = () => {
    setText("");
    setNumber(0);
    setDate("");
    loadData(false);
  };

  const loadMore = async () => {
    await loadData(true);
  };

  const doRefresh = async () => {
    await loadData(false);
  };

  return (
    <div className="document-page">
      <header className="header">
        <button className="header-button" onClick={() => window.history.back()}>
          <IoArrowBackOutline size={24} />
        </button>
        <h1 className="title" >Họp theo phiên sáng chiều</h1>
        <button className="header-button" onClick={() => setShowFilter(!showFilter)}>
          <IoFilterOutline size={24}/>
        </button>
      </header>

      <div className="document-content">
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

        <div className="segment">
            <button
                className={selectedTab === 'image' ? 'active' : ''}
                onClick={() => setSelectedTab('image')}
            >
                Hình ảnh triển lãm
            </button>
            <button
                className={selectedTab === 'post' ? 'active' : ''}
                onClick={() => setSelectedTab('post')}
            >
                Bài viết
            </button>
        </div>

        {selectedTab === 'image' && (
            <div className="segment-content">
                <p>A</p>
            </div>
        )}

        {selectedTab === 'post' && (
        <div className="document-table">
            <div className="table-row header">
                <div className="id-column" >STT</div>
                <div className="item-column">Nội dung</div>
                <div className="icon-column-title">Xem</div>
            </div>
            {lstData.map(item => (
            <div className="table-row" key={item.Id}> 
                <div className="id-column" >{item.Id}</div>
                <div className="item-column">{item.Title}</div>
                <div className="icon-column">
                  <button className="icon"><IoSearchOutline size={20} /></button>
                </div>
            </div>
            ))}
            <div ref={loadMoreRef} style={{ height: 30 }} />
        </div>
        )}
    </div>
      

        <div className="bub">
            <button
                className="bub-main"
                onClick={() => setIsBubOpen(!isBubOpen)}
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

export default DocumentPage;
