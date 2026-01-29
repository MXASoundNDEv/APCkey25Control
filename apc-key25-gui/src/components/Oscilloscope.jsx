import React, { useEffect, useRef } from 'react';

export function Oscilloscope({ analyser }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!analyser || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const bufferLength = analyser.fftSize;
    const dataArray = new Uint8Array(bufferLength);
    let rafId;

    const draw = () => {
      rafId = requestAnimationFrame(draw);
      analyser.getByteTimeDomainData(dataArray);
      ctx.fillStyle = '#0b1220';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.lineWidth = 2;
      ctx.strokeStyle = '#33ffc3';
      ctx.beginPath();

      const sliceWidth = (canvas.width * 1.0) / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i += 1) {
        const v = dataArray[i] / 128.0;
        const y = (v * canvas.height) / 2;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
        x += sliceWidth;
      }

      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();
    };

    draw();
    return () => cancelAnimationFrame(rafId);
  }, [analyser]);

  return (
    <div className="card">
      <div className="card-title">Oscilloscope (Web Audio)</div>
      <canvas ref={canvasRef} width={640} height={220} className="oscilloscope" />
    </div>
  );
}
