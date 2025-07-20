import React, { useState, useEffect } from "react";
import bg1 from "../img/1.jpg";
import bg2 from "../img/2.jpg";
import bg3 from "../img/3.jpg";
import "./BackgroundSlider.css";

const images = [bg1, bg2, bg3];

export default function BackgroundSlider() {
  const [current, setCurrent] = useState(0);
  const [loaded, setLoaded] = useState(true);

  // Preload the next image and only show when loaded
  useEffect(() => {
    setLoaded(false);
    const img = new window.Image();
    img.onload = () => setLoaded(true);
    img.src = images[current];
  }, [current]);

  // Change slide every 5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((c) => (c + 1) % images.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div
      className={`background-slider${loaded ? " loaded" : ""}`}
      style={{
        backgroundImage: loaded ? `url(${images[current]})` : "none",
      }}
    />
  );
}
