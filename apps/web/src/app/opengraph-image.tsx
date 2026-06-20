import { ImageResponse } from 'next/og';

// Social share card (Open Graph + Twitter). Auto-wired by Next into og:image
// and twitter:image for every page that doesn't override it.
export const alt = 'WatchLink — Watch videos together in perfect sync';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '0 96px',
          color: '#ffffff',
          background: '#130f1a',
          backgroundImage:
            'radial-gradient(circle at 82% -12%, rgba(184,90,236,0.50), transparent 48%), radial-gradient(circle at -12% 112%, rgba(245,158,11,0.22), transparent 46%)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
          <div
            style={{
              width: 96,
              height: 96,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#a23bd8',
              borderRadius: 24,
            }}
          >
            <div
              style={{
                width: 0,
                height: 0,
                borderTop: '24px solid transparent',
                borderBottom: '24px solid transparent',
                borderLeft: '38px solid white',
                marginLeft: 8,
              }}
            />
          </div>
          <div style={{ fontSize: 54, fontWeight: 700 }}>WatchLink</div>
        </div>

        <div style={{ fontSize: 78, fontWeight: 800, marginTop: 44, lineHeight: 1.08, maxWidth: 1000 }}>
          Watch videos together, in perfect sync.
        </div>

        <div style={{ fontSize: 34, color: '#dfa8fb', marginTop: 28 }}>
          Live chat · reactions · timestamped notes · push-to-talk voice
        </div>
      </div>
    ),
    { ...size },
  );
}
