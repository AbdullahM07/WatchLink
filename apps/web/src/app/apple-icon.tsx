import { ImageResponse } from 'next/og';

// Apple touch icon (home-screen). Auto-wired by Next into the apple-touch-icon link.
export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#7c3aed',
        }}
      >
        <div
          style={{
            width: 0,
            height: 0,
            borderTop: '46px solid transparent',
            borderBottom: '46px solid transparent',
            borderLeft: '74px solid white',
            marginLeft: 16,
          }}
        />
      </div>
    ),
    { ...size },
  );
}
