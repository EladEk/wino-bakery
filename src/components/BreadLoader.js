import React from "react";
import "./BreadLoader.css";

const letters = ["ו", "י", "נ", "ו"]; // Replace with your logo’s exact letters, right to left!

export default function BreadLoader() {
  // Center point for the middle letter
  const centerX = 200;
  // Letter spacing (in px)
  const spacing = 65;

  return (
    <div className="loader-overlay">
      <svg width="400" height="150" viewBox="0 0 400 150" style={{ display: "block" }}>
        {letters.map((char, idx) => (
          <text
            key={idx}
            // Position each letter right-to-left, so the first in the array is farthest right
            x={centerX + spacing * (letters.length / 2 - idx - 0.5)}
            y={100}
            fontSize="80"
            direction= "rtl"
            fontFamily="'Frank Ruhl Libre', 'David Libre', serif"
            fill="#222"
            className={`shine-letter letter${idx + 1}`}
            style={{
              textAnchor: "middle",
              fontWeight: 900,
              paintOrder: "stroke",
              stroke: "#fdf5ce",
              strokeWidth: 2,
              filter: "drop-shadow(1px 2px 1px #bda16733)",
            }}
          >
            {char}
          </text>
        ))}
      </svg>
      <div
        style={{
          marginTop: 20,
          fontSize: 24,
          color: "#666",
          direction: "rtl",
          textAlign: "center",
          fontFamily: "inherit",
          letterSpacing: 1,
        }}
      >
        טוען...
      </div>    
    </div>
  );
}