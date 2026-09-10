import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import CodeWindow from './CodeWindow';

const STATS = [
  { value: 7, suffix: '', label: 'ngôn ngữ hỗ trợ' },
  { value: 50, prefix: '<', suffix: 'ms', label: 'độ trễ đồng bộ' },
  { value: 7, suffix: '', label: 'bậc rank thi đấu' },
  { value: 50, suffix: '+', label: 'người / phòng' },
];

function Typewriter({ text, speed = 40, startDelay = 500 }) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    let i = 0;
    let timer;
    const startTimeout = setTimeout(() => {
      timer = setInterval(() => {
        i++;
        setDisplayed(text.slice(0, i));
        if (i >= text.length) {
          clearInterval(timer);
          setDone(true);
        }
      }, speed);
    }, startDelay);

    return () => {
      clearTimeout(startTimeout);
      clearInterval(timer);
    };
  }, [text, speed, startDelay]);

  return (
    <span>
      {displayed}
      {!done && <span className="typewriter-cursor" />}
    </span>
  );
}

function AnimatedStat({ stat }) {
  const ref = useRef(null);
  const [count, setCount] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          const target = stat.value;
          const duration = 1500;
          const start = performance.now();
          function frame(now) {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            // Ease out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.round(eased * target));
            if (progress < 1) requestAnimationFrame(frame);
          }
          requestAnimationFrame(frame);
        }
      },
      { threshold: 0.5 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [stat.value, hasAnimated]);

  return (
    <div className="stat" ref={ref}>
      <b>
        {stat.prefix || ''}
        {count}
        {stat.suffix || ''}
      </b>
      <span>{stat.label}</span>
    </div>
  );
}

function MagneticButton({ children, className, as: Comp = 'a', to, href, ...rest }) {
  const innerRef = useRef(null);
  const wrapperRef = useRef(null);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    function onMove(e) {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      const dist = Math.sqrt(x * x + y * y);
      const maxDist = 150;
      const strength = Math.min(dist / maxDist, 1);
      const pullX = x * 0.2 * strength;
      const pullY = y * 0.2 * strength;
      el.style.transform = `translate(${pullX}px, ${pullY}px)`;
    }
    function onLeave() {
      el.style.transform = 'translate(0, 0)';
    }
    el.addEventListener('mousemove', onMove);
    el.addEventListener('mouseleave', onLeave);
    return () => {
      el.removeEventListener('mousemove', onMove);
      el.removeEventListener('mouseleave', onLeave);
    };
  }, []);

  if (Comp === Link && to) {
    return (
      <span ref={wrapperRef} className={className} style={{ display: 'inline-flex' }}>
        <Link ref={innerRef} to={to} style={{ textDecoration: 'none', color: 'inherit', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }} {...rest}>
          {children}
        </Link>
      </span>
    );
  }
  return <a ref={wrapperRef} className={className} href={href} {...rest}>{children}</a>;
}

export default function Hero() {
  return (
    <section className="hero">
      <div className="wrap hero-grid">
        <div>
          <div className="badge reveal"><span className="pulse" /> Đang phát triển tích cực · Miễn phí & mã nguồn mở</div>
          <h1 className="reveal">
            Code cùng nhau,<br />không còn <span className="hl">chờ đến lượt</span>.
          </h1>
          <p className="desc reveal" id="tagline">
            "<Typewriter text="Codexa là nền tảng lập trình cộng tác thời gian thực: đồng bộ dưới 50ms, AI chấm bài, và rank 7 bậc để bạn tiến bộ mỗi ngày." speed={30} startDelay={800} />
          </p>
          <div className="cta-group reveal">
            <MagneticButton className="btn btn-primary btn-lg" as={Link} to="/login">
              Mở phòng code ngay →
            </MagneticButton>
            <MagneticButton className="btn btn-ghost btn-lg" href="#features">
              Xem tính năng
            </MagneticButton>
          </div>
          <div className="stat-row reveal">
            {STATS.map((s) => (
              <AnimatedStat key={s.label} stat={s} />
            ))}
          </div>
        </div>
        <div className="reveal">
          <CodeWindow />
        </div>
      </div>
    </section>
  );
}
