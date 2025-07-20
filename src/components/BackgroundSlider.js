import React, { useState, useEffect } from "react";
import bg1 from "../img/1.jpg";
import bg2 from "../img/2.jpg";
import bg3 from "../img/3.jpg";
import "./BackgroundSlider.css";

const images = [bg1, bg2, bg3];
const FADE_DURATION = 1000;    // ms
const VISIBLE_DURATION = 10000; // ms

export default function BackgroundSlider() {
  const [current, setCurrent] = useState(0);
  const [opacity, setOpacity] = useState(0);

  useEffect(() => {
    let fadeInTimeout, visibleTimeout, nextTimeout;

    setOpacity(0);
    fadeInTimeout = setTimeout(() => setOpacity(1), 10);

    visibleTimeout = setTimeout(() => setOpacity(0), FADE_DURATION + VISIBLE_DURATION);

    nextTimeout = setTimeout(() => {
      setCurrent((c) => (c + 1) % images.length);
    }, FADE_DURATION * 2 + VISIBLE_DURATION);

    return () => {
      clearTimeout(fadeInTimeout);
      clearTimeout(visibleTimeout);
      clearTimeout(nextTimeout);
    };
  }, [current]);

  return (
    <div className="background-fade-container">
      <div
        className="background-slider"
        style={{
          backgroundImage: `url(${images[current]})`,
          opacity,
          transition: `opacity ${FADE_DURATION}ms linear`,
        }}
      />
    </div>
  );
}
