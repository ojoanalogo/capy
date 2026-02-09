import React from "react";

export const DITHERING_PATTERN_ID = "comic-halftone";

export const DitheringPattern: React.FC = () => {
  return (
    <svg
      style={{
        position: "absolute",
        width: 0,
        height: 0,
        overflow: "hidden",
      }}
    >
      <defs>
        <pattern
          id={DITHERING_PATTERN_ID}
          x="0"
          y="0"
          width="8"
          height="8"
          patternUnits="userSpaceOnUse"
        >
          <circle cx="4" cy="4" r="2" fill="black" fillOpacity="0.15" />
        </pattern>
      </defs>
    </svg>
  );
};
