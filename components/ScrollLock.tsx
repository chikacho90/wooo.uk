"use client";

import { useEffect } from "react";

// 홈에서만 스크롤·바운스 잠금 (알이 제자리에 고정, 키보드 떠도 페이지 안 올라감)
export default function ScrollLock() {
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("home-locked");
    return () => root.classList.remove("home-locked");
  }, []);
  return null;
}
