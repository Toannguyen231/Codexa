import { useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function FinalCta() {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    function createParticle() {
      const p = document.createElement('div');
      p.style.cssText = `
        position: absolute;
        width: 4px;
        height: 4px;
        border-radius: 50%;
        background: var(--cyan);
        pointer-events: none;
        left: ${Math.random() * 100}%;
        top: ${Math.random() * 100}%;
        opacity: 0;
        z-index: 0;
      `;
      el.appendChild(p);
      const angle = Math.random() * Math.PI * 2;
      const speed = 40 + Math.random() * 60;
      const size = 2 + Math.random() * 4;
      p.style.width = size + 'px';
      p.style.height = size + 'px';
      const hue = Math.random() > 0.5 ? 170 : 38;
      p.style.background = `hsl(${hue}, 70%, 60%)`;
      const start = performance.now();
      function anim(now) {
        const t = (now - start) / 1000;
        if (t > 2) { p.remove(); return; }
        const x = Math.cos(angle) * speed * t;
        const y = Math.sin(angle) * speed * t - 20 * t * t;
        p.style.transform = `translate(${x}px, ${y}px)`;
        p.style.opacity = Math.max(0, 1 - t / 2);
        requestAnimationFrame(anim);
      }
      requestAnimationFrame(anim);
    }

    let interval;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          interval = setInterval(createParticle, 300);
        } else {
          clearInterval(interval);
        }
      },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => {
      clearInterval(interval);
      obs.disconnect();
    };
  }, []);

  return (
    <section className="section">
      <div className="wrap">
        <div className="final-cta reveal" ref={ref}>
          <p className="eyebrow" style={{ justifyContent: 'center' }}>sẵn sàng chưa</p>
          <h2>Tạo phòng. Gửi link. Bắt đầu code.</h2>
          <p>Không cần tải app, không cần cấu hình — mở trình duyệt và code cùng nhau ngay.</p>
          <div className="cta-group" style={{ justifyContent: 'center' }}>
            <Link className="btn btn-primary btn-lg" to="/login">
              Mở Codexa ngay →
            </Link>
            <a
              className="btn btn-ghost btn-lg"
              href="https://github.com/Toannguyen231/Codexa"
              target="_blank"
              rel="noopener"
            >
              Xem mã nguồn
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
