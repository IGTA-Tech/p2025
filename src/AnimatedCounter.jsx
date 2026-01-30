import React, { useState, useEffect, useRef } from 'react';

const AnimatedCounter = ({
  value,
  duration = 2000,
  formatNumber = true,
  suffix = '',
  prefix = ''
}) => {
  const [count, setCount] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const elementRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasAnimated) {
          animateCounter();
          setHasAnimated(true);
        }
      },
      { threshold: 0.5 }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => {
      if (elementRef.current) {
        observer.unobserve(elementRef.current);
      }
    };
  }, [hasAnimated]);

  const animateCounter = () => {
    const targetValue = typeof value === 'string' ? parseFloat(value.replace(/,/g, '')) : value;
    const startTime = Date.now();
    const startValue = 0;

    const updateCounter = () => {
      const currentTime = Date.now();
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const currentValue = startValue + (targetValue - startValue) * easeOutQuart;

      setCount(currentValue);

      if (progress < 1) {
        requestAnimationFrame(updateCounter);
      } else {
        setCount(targetValue);
      }
    };

    requestAnimationFrame(updateCounter);
  };

  const formatValue = (val) => {
    if (!formatNumber) return val;

    if (typeof val === 'number') {
      return Math.round(val).toLocaleString();
    }
    return val;
  };

  return (
    <span ref={elementRef} className="inline-block">
      {prefix}{formatValue(count)}{suffix}
    </span>
  );
};

export default AnimatedCounter;
