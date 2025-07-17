// src/components/BackgroundSlider.js
import React, { useState, useEffect } from "react";
import bg1 from "../img/1.jpg";
import bg2 from "../img/2.jpg";
import bg3 from "../img/3.jpg";
import "./BackgroundSlider.css";

export default function BackgroundSlider() {
  const images = [bg1, bg2, bg3];
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((c) => (c + 1) % images.length);
    }, 5000); // change every 5s
    return () => clearInterval(timer);
  }, [images.length]);

  return (
    <div
      className="background-slider"
      style={{ backgroundImage: `url(${images[current]})` }}
    />
  );
}
