"use client";
import React, { useState } from 'react';
import './ExpandingTriangles.css';

const ExpandingTriangles = () => {
    const [isExpanded, setIsExpanded] = useState(false);

    const handleClick = () => {
      setIsExpanded(!isExpanded);
    };
  
    return (
      <div className="rect" style={{ width: isExpanded ? '400px' : '300px', height: '300px' }}>
        <div className="triangle" style={{ borderBottomColor: isExpanded ? 'blue' : 'yellow' }} onClick={handleClick}></div>
        <div className="triangle" style={{ borderBottomColor: isExpanded ? 'yellow' : 'blue' }} onClick={handleClick}></div>
        <div className="rectangle" style={{ width: isExpanded ? '100px' : '200px', height: '300px' }} onClick={handleClick}></div>
      </div>
    );
  };

export default ExpandingTriangles;
