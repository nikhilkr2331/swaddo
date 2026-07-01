import { ImageResponse } from "next/og";

export const dynamic = 'force-static';
export const size = {
  width: 512,
  height: 512,
};
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#E2401C",
        }}
      >
        <div
          style={{
            width: 320,
            height: 320,
            backgroundColor: "#FFFFFF",
            borderRadius: 160,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "20px solid #292524", // dark rim like the screenshot
          }}
        >
          {/* Bike Icon */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="160"
            height="160"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#E2401C"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="18.5" cy="17.5" r="3.5" />
            <circle cx="5.5" cy="17.5" r="3.5" />
            <circle cx="15" cy="5" r="1" />
            <path d="M12 17.5V14l-3-3 4-3 2 3h2" />
          </svg>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
