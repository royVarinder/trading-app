"use client";

import { useEffect, useRef } from "react";

export function TradingViewWidget({
  scriptSrc,
  config,
}: {
  scriptSrc: string;
  config: Record<string, unknown>;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.innerHTML = "";
    const widgetDiv = document.createElement("div");
    widgetDiv.className = "tradingview-widget-container__widget";
    container.appendChild(widgetDiv);

    const script = document.createElement("script");
    script.type = "text/javascript";
    script.src = scriptSrc;
    script.async = true;
    script.text = JSON.stringify(config);
    container.appendChild(script);

    return () => {
      container.innerHTML = "";
    };
  }, [scriptSrc, config]);

  return <div ref={containerRef} className="tradingview-widget-container" />;
}
