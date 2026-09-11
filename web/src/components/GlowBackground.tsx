export function GlowBackground({ watermark = false }: { watermark?: boolean }) {
  return (
    <>
      <div className="glow glow--coral" />
      <div className="glow glow--violet" />
      <div className="glow glow--pink" />
      {watermark ? <div className="watermark">DAILY</div> : null}
    </>
  );
}
