import { useState, useEffect } from 'react';
import './ScrollIndicator.css';

const ScrollIndicator = () => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 100) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="scroll-indicator">
      <div className="scroll-arrow scroll-arrow-1"></div>
      <div className="scroll-arrow scroll-arrow-2"></div>
      <div className="scroll-arrow scroll-arrow-3"></div>
    </div>
  );
};

export default ScrollIndicator;
