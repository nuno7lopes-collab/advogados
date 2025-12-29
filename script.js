const body = document.body;
const header = document.querySelector(".site-header");
const progressBar = document.querySelector(".scroll-progress span");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

window.addEventListener("DOMContentLoaded", () => {
  body.classList.add("is-loaded");
});

const handleHeader = () => {
  if (!header) return;
  header.classList.toggle("is-scrolled", window.scrollY > 24);
};

const updateProgress = () => {
  if (!progressBar) return;
  const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
  const progress = scrollHeight > 0 ? window.scrollY / scrollHeight : 0;
  progressBar.style.width = `${Math.min(progress * 100, 100)}%`;
};

let scrollTicking = false;
const handleScroll = () => {
  if (!scrollTicking) {
    scrollTicking = true;
    window.requestAnimationFrame(() => {
      handleHeader();
      updateProgress();
      scrollTicking = false;
    });
  }
};

handleScroll();
window.addEventListener("scroll", handleScroll, { passive: true });

const networkCanvas = document.querySelector(".network-canvas");
const startNetwork = () => {
  if (!networkCanvas || prefersReducedMotion.matches) return;
  if (networkCanvas.dataset.active === "true") return;
  networkCanvas.dataset.active = "true";

  const ctx = networkCanvas.getContext("2d");
  if (ctx) {
    let width = 0;
    let height = 0;
    let nodes = [];
    let pulses = [];
    const maxDistance = 180;

    const createPulse = (pool) => {
      const from = pool[Math.floor(Math.random() * pool.length)];
      let to = pool[Math.floor(Math.random() * pool.length)];
      if (from === to) {
        to = pool[(pool.indexOf(from) + 1) % pool.length];
      }
      return {
        from,
        to,
        progress: Math.random(),
        speed: 0.002 + Math.random() * 0.004,
      };
    };

    const resizeCanvas = () => {
      const rect = networkCanvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      networkCanvas.width = width * dpr;
      networkCanvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const density = Math.min(
        70,
        Math.max(34, Math.floor((width * height) / 24000))
      );
      nodes = Array.from({ length: density }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.45,
        vy: (Math.random() - 0.5) * 0.45,
        phase: Math.random() * Math.PI * 2,
        radius: 1 + Math.random() * 1.4,
      }));

      pulses = Array.from({ length: 7 }, () => createPulse(nodes));
    };

    const drawNetwork = (timestamp = 0) => {
      const time = timestamp * 0.001;
      ctx.clearRect(0, 0, width, height);

      nodes.forEach((node) => {
        node.x += node.vx;
        node.y += node.vy;
        if (node.x <= 0 || node.x >= width) node.vx *= -1;
        if (node.y <= 0 || node.y >= height) node.vy *= -1;
      });

      for (let i = 0; i < nodes.length; i += 1) {
        for (let j = i + 1; j < nodes.length; j += 1) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.hypot(dx, dy);
          if (dist < maxDistance) {
            const alpha = 1 - dist / maxDistance;
            ctx.strokeStyle = `rgba(90, 150, 255, ${alpha * 0.35})`;
            ctx.lineWidth = 0.8 + alpha * 0.6;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.stroke();
          }
        }
      }

      nodes.forEach((node) => {
        const pulse = 0.5 + 0.5 * Math.sin(time + node.phase);
        ctx.fillStyle = `rgba(92, 198, 255, ${0.2 + pulse * 0.35})`;
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius + pulse * 0.6, 0, Math.PI * 2);
        ctx.fill();
      });

      pulses.forEach((pulse, index) => {
        pulse.progress += pulse.speed;
        if (pulse.progress >= 1) {
          pulses[index] = createPulse(nodes);
          return;
        }
        const x = pulse.from.x + (pulse.to.x - pulse.from.x) * pulse.progress;
        const y = pulse.from.y + (pulse.to.y - pulse.from.y) * pulse.progress;

        ctx.strokeStyle = "rgba(100, 255, 180, 0.18)";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(pulse.from.x, pulse.from.y);
        ctx.lineTo(x, y);
        ctx.stroke();

        ctx.save();
        ctx.shadowBlur = 16;
        ctx.shadowColor = "rgba(100, 255, 180, 0.7)";
        ctx.fillStyle = "rgba(100, 255, 180, 0.95)";
        ctx.beginPath();
        ctx.arc(x, y, 2.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      requestAnimationFrame(drawNetwork);
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    requestAnimationFrame(drawNetwork);
  }
};

["pointermove", "scroll", "touchstart"].forEach((eventName) => {
  window.addEventListener(eventName, startNetwork, { passive: true, once: true });
});

setTimeout(startNetwork, 1400);

const staggerGroups = document.querySelectorAll("[data-stagger]");
staggerGroups.forEach((group) => {
  Array.from(group.children).forEach((item, index) => {
    item.dataset.reveal = "item";
    item.style.setProperty("--delay", `${index * 90}ms`);
  });
});

const magneticButtons = document.querySelectorAll(".btn-magnetic");
const prefersPointer = window.matchMedia("(pointer: fine)");

if (prefersPointer.matches && !prefersReducedMotion.matches) {
  magneticButtons.forEach((button) => {
    button.addEventListener("mousemove", (event) => {
      const rect = button.getBoundingClientRect();
      const x = event.clientX - rect.left - rect.width / 2;
      const y = event.clientY - rect.top - rect.height / 2;
      const limit = 6;
      button.style.setProperty("--mx", `${(x / rect.width) * limit}px`);
      button.style.setProperty("--my", `${(y / rect.height) * limit}px`);
    });

    button.addEventListener("mouseleave", () => {
      button.style.setProperty("--mx", "0px");
      button.style.setProperty("--my", "0px");
    });
  });
}

const revealItems = document.querySelectorAll("[data-reveal]");

if (!prefersReducedMotion.matches && revealItems.length) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.2 }
  );

  revealItems.forEach((item) => observer.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add("in-view"));
}
