import {useEffect, useMemo, useState} from "react";


export default function useOnScreen(ref, threshold = 0.3) {
  const [isVisible, setIsVisible] = useState(false); // 可视状态

  const observer = useMemo(() => {
    return new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      {
        root: null,
        threshold,
      }
    )
  }, [threshold]);

  useEffect(() => {
    if (ref.current) {
      observer.observe(ref.current); // 开始监听
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, [observer, ref, threshold]);

  return isVisible
}
