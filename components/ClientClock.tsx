"use client";

import { useEffect, useState } from "react";

function getCurrentTime() {
    return new Date().toLocaleTimeString("en-IN", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
    });
}

export default function ClientClock() {
    const [time, setTime] = useState("");

    useEffect(() => {
        setTime(getCurrentTime());

        const interval = window.setInterval(() => {
            setTime(getCurrentTime());
        }, 1000);

        return () => {
            window.clearInterval(interval);
        };
    }, []);

    return (
        <span suppressHydrationWarning>
            {time}
        </span>
    );
}