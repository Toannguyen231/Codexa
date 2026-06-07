import React, { useState, useMemo } from 'react';
import './HeatmapCalendar.scss';

const HeatmapCalendar = ({ heatmapData, currentStreak, bestStreak, username }) => {
  const [tooltip, setTooltip] = useState({ visible: false, content: '', x: 0, y: 0 });

  const getColorByActivity = (count) => {
    if (count === 0) return '#161b22'; // GitHub dark mode empty square
    if (count <= 2) return '#0e4429';  // L1 Green
    if (count <= 5) return '#006d32';  // L2 Green
    if (count <= 10) return '#26a641'; // L3 Green
    return '#39d353';                  // L4 Green
  };
  
  const formatTooltipDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };
  
  const handleMouseEnter = (e, item) => {
    setTooltip({
      visible: true,
      content: `${formatTooltipDate(item.date)}: ${item.count} hoạt động`,
      x: e.clientX,
      y: e.clientY
    });
  };
  
  const handleMouseLeave = () => {
    setTooltip({ visible: false, content: '', x: 0, y: 0 });
  };

  // Generate fallback data if heatmapData is empty
  const displayData = useMemo(() => {
    if (heatmapData && heatmapData.length > 0) return heatmapData;
    
    const fallback = [];
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 365);
    
    // Get Monday of the first week
    const firstDate = new Date(startDate);
    const dayOfWeek = firstDate.getDay();
    const diff = firstDate.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    firstDate.setDate(diff);
    
    for (let week = 0; week < 52; week++) {
      const weekData = [];
      for (let day = 0; day < 7; day++) {
        const currentDate = new Date(firstDate);
        currentDate.setDate(currentDate.getDate() + week * 7 + day);
        
        const year = currentDate.getFullYear();
        const monthStr = String(currentDate.getMonth() + 1).padStart(2, '0');
        const dayStr = String(currentDate.getDate()).padStart(2, '0');
        const dateStr = `${year}-${monthStr}-${dayStr}`;
        
        weekData.push({
          date: dateStr,
          count: 0,
          dayOfWeek: day,
          month: currentDate.getMonth()
        });
      }
      fallback.push(weekData);
    }
    return fallback;
  }, [heatmapData]);

  const dayLabels = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

  return (
    <div className="heatmap-container">
      <div className="heatmap-header">
        <h2>Lịch hoạt động (52 tuần gần nhất)</h2>
        <div className="streak-info">
          <div className="streak-item">
            <span className="streak-icon">🔥</span>
            <span className="streak-label">Chuỗi hiện tại:</span>
            <span className="streak-value">{currentStreak} ngày</span>
          </div>
          <div className="streak-item">
            <span className="streak-icon">🏆</span>
            <span className="streak-label">Chuỗi dài nhất:</span>
            <span className="streak-value">{bestStreak} ngày</span>
          </div>
        </div>
      </div>

      <div className="heatmap-wrapper">
        <div className="heatmap-content">
          <div className="day-labels">
            {dayLabels.map((label, index) => (
              <div key={index} className="day-label">{label}</div>
            ))}
          </div>

          <div className="heatmap-grid-wrapper">
            <div className="month-labels">
              <span className="month-label" style={{ left: '0px' }}>Tháng 1</span>
              <span className="month-label" style={{ left: '180px' }}>Tháng 4</span>
              <span className="month-label" style={{ left: '360px' }}>Tháng 7</span>
              <span className="month-label" style={{ left: '540px' }}>Tháng 10</span>
            </div>

            <div className="heatmap-grid">
              {displayData.map((week, weekIndex) => (
                <div key={weekIndex} className="heatmap-week">
                  {week.map((day, dayIndex) => (
                    <div
                      key={`${weekIndex}-${dayIndex}`}
                      className={`heatmap-day day-${day.count > 10 ? '10+' : day.count === 0 ? '0' : day.count <= 2 ? '1-2' : day.count <= 5 ? '3-5' : '6-10'}`}
                      style={{ backgroundColor: getColorByActivity(day.count) }}
                      onMouseEnter={(e) => handleMouseEnter(e, day)}
                      onMouseLeave={handleMouseLeave}
                      title={`${formatTooltipDate(day.date)}: ${day.count} lần`}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="heatmap-legend">
        <span className="legend-label">Ít hơn</span>
        <div className="legend-item" style={{ backgroundColor: '#161b22' }}></div>
        <div className="legend-item" style={{ backgroundColor: '#0e4429' }}></div>
        <div className="legend-item" style={{ backgroundColor: '#006d32' }}></div>
        <div className="legend-item" style={{ backgroundColor: '#26a641' }}></div>
        <div className="legend-item" style={{ backgroundColor: '#39d353' }}></div>
        <span className="legend-label">Nhiều hơn</span>
      </div>

      {tooltip.visible && (
        <div
          className="heatmap-tooltip"
          style={{ left: tooltip.x + 10, top: tooltip.y - 30 }}
        >
          {tooltip.content}
        </div>
      )}
    </div>
  );
};

export default HeatmapCalendar;