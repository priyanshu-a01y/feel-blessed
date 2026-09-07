"use client";

import { useEffect, useState } from "react";

function indiaTime() {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date());
}

export default function LiveClock() {
  const [time, setTime] = useState(indiaTime);

  useEffect(() => {
    const update = () => setTime(indiaTime());
    update();

    const interval = window.setInterval(update, 1000);
    return () => window.clearInterval(interval);
  }, []);

  return <span>{time}</span>;
}
