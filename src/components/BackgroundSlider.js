import React, { useState, useEffect, useRef } from "react";
import bg1 from "../img/1.jpg";
import bg2 from "../img/2.jpg";
import bg3 from "../img/3.jpg";
import "./BackgroundSlider.css";

const images = [bg1, bg2, bg3];

export default function BackgroundSlider() {
  const [current, setCurrent] = useState(0);
  const [prev, setPrev] = useState(null); // For crossfade
  const [loaded, setLoaded] = useState(true);
  const timerRef = useRef();

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setPrev(current);
      setCurrent((c) => (c + 1) % images.length);
    }, 5000);
    return () => clearInterval(timerRef.current);
    // eslint-disable-next-line
  }, [current]);

  useEffect(() => {
    if (prev === null) return; // No need to preload for the first image
    setLoaded(false);
    const img = new window.Image();
    img.onload = () => setLoaded(true);
    img.src = images[current];
  }, [current, prev]);

  // After fade-in, clear the prev image
  useEffect(() => {
    if (!loaded || prev === null) return;
    const timeout = setTimeout(() => setPrev(null), 600); // match CSS transition
    return () => clearTimeout(timeout);
  }, [loaded, prev]);

  return (
    <>
      {/* Previous image (fading out) */}
      {prev !== null && (
        <div
          className="background-slider"
          style={{
            backgroundImage: `url(${images[prev]})`,
            opacity: loaded ? 0 : 1,
            zIndex: -2,
          }}
        />
      )}
      {/* Current image (fading in) */}
      <div
        className="background-slider"
        style={{
          backgroundImage: `url(${images[current]})`,
          opacity: loaded ? 1 : 0,
          zIndex: -1,
        }}
      />
    </>
  );
}
