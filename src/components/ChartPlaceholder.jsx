import React, { useEffect, useRef } from 'react';

const ChartPlaceholder = ({ symbol }) => {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        let animationFrameId;
        let offset = 0;

        // Resize handler
        const resize = () => {
            canvas.width = canvas.parentElement.offsetWidth;
            canvas.height = canvas.parentElement.offsetHeight;
        };
        window.addEventListener('resize', resize);
        resize();

        // Mock Data Points
        const points = [];
        for (let i = 0; i < 200; i++) {
            points.push(50 + Math.random() * 20 - 10 + Math.sin(i * 0.1) * 20);
        }

        const draw = () => {
            const { width, height } = canvas;
            ctx.clearRect(0, 0, width, height);

            // Grid
            ctx.strokeStyle = '#333';
            ctx.lineWidth = 1;
            ctx.beginPath();
            for (let x = 0; x < width; x += 50) {
                ctx.moveTo(x, 0); ctx.lineTo(x, height);
            }
            for (let y = 0; y < height; y += 50) {
                ctx.moveTo(0, y); ctx.lineTo(width, y);
            }
            ctx.stroke();

            // Line
            ctx.strokeStyle = '#00ff00';
            ctx.lineWidth = 2;
            ctx.beginPath();

            // Animated shift
            const shift = (Date.now() / 50) % 50;

            points.forEach((p, i) => {
                const x = (i * (width / 50)) - shift;
                const y = height - (p / 100) * height;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            });
            ctx.stroke();

            // Gradient fill
            const gradient = ctx.createLinearGradient(0, 0, 0, height);
            gradient.addColorStop(0, 'rgba(0, 255, 0, 0.2)');
            gradient.addColorStop(1, 'rgba(0, 255, 0, 0)');
            ctx.fillStyle = gradient;
            ctx.lineTo(width, height);
            ctx.lineTo(0, height);
            ctx.fill();

            animationFrameId = requestAnimationFrame(draw);
        };

        draw();

        return () => {
            window.removeEventListener('resize', resize);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <div className="w-full h-full relative">
            <canvas ref={canvasRef} className="block" />
            <div className="absolute top-2 left-2 text-xs font-bold text-[#a0a0a0]">
                {symbol} <span className="text-[#666]">1M</span>
            </div>
        </div>
    );
};

export default ChartPlaceholder;
