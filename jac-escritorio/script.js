const body = document.body;

window.addEventListener("DOMContentLoaded", () => {
  body.classList.add("is-loaded");
});

const navToggle = document.querySelector("[data-nav-toggle]");
const navLinks = document.querySelector("[data-nav-links]");

if (navToggle && navLinks) {
  navToggle.addEventListener("click", () => {
    const isOpen = navLinks.classList.toggle("open");
    navToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
    navToggle.setAttribute("aria-label", isOpen ? "Fechar menu" : "Abrir menu");
  });

  document.addEventListener("click", (event) => {
    if (!navLinks.classList.contains("open")) return;
    const target = event.target;
    if (target.closest("[data-nav-toggle]") || target.closest("[data-nav-links]")) {
      return;
    }
    navLinks.classList.remove("open");
    navToggle.setAttribute("aria-expanded", "false");
    navToggle.setAttribute("aria-label", "Abrir menu");
  });

  navLinks.addEventListener("click", (event) => {
    if (event.target.tagName === "A") {
      navLinks.classList.remove("open");
      navToggle.setAttribute("aria-expanded", "false");
      navToggle.setAttribute("aria-label", "Abrir menu");
    }
  });
}

const navTabLinks = Array.from(document.querySelectorAll(".nav-tabs a"));
const navCta = document.querySelector(".nav-links .btn");
const navItems = navCta ? [...navTabLinks, navCta] : navTabLinks;
const navTabs = document.querySelector(".nav-tabs");

const setTabIndicator = (link) => {
  if (!navTabs || !link || !navTabs.contains(link)) return;
  navTabs.style.setProperty("--tab-left", `${link.offsetLeft}px`);
  navTabs.style.setProperty("--tab-width", `${link.offsetWidth}px`);
  navTabs.style.setProperty("--tab-opacity", "1");
};

const hideTabIndicator = () => {
  if (!navTabs) return;
  navTabs.style.setProperty("--tab-opacity", "0");
};

const refreshTabIndicator = () => {
  if (!navTabs) return;
  const activeLink = navTabs.querySelector(".is-active");
  if (activeLink) {
    setTabIndicator(activeLink);
  } else {
    hideTabIndicator();
  }
};

const shouldIgnoreNavClick = (event, link) =>
  event.defaultPrevented ||
  event.button !== 0 ||
  event.metaKey ||
  event.ctrlKey ||
  event.shiftKey ||
  link.target === "_blank" ||
  link.hasAttribute("download");

const clearNavActive = () => {
  navItems.forEach((link) => {
    link.classList.remove("is-active");
    link.removeAttribute("aria-current");
  });
};

const setNavActive = (link) => {
  if (!link) return;
  clearNavActive();
  link.classList.add("is-active");
  link.setAttribute("aria-current", "page");
  if (navTabs) {
    if (navTabs.contains(link)) {
      setTabIndicator(link);
    } else {
      hideTabIndicator();
    }
  }
};

const getBaseName = (pathname) => {
  const parts = pathname.split("/").filter(Boolean);
  return parts[parts.length - 1] || "index.html";
};

const getLinkInfo = (link) => {
  const href = link.getAttribute("href");
  const url = new URL(href, window.location.href);
  return { base: getBaseName(url.pathname), hash: url.hash };
};

const findNavLink = (matcher) =>
  navTabLinks.find((link) => {
    const info = getLinkInfo(link);
    return matcher(info);
  });

const indexLink = findNavLink(({ base, hash }) => base === "index.html" && !hash);
const servicosLink = findNavLink(({ hash }) => hash === "#servicos");
const faqLink = findNavLink(({ hash }) => hash === "#faq");
const sobreLink = findNavLink(({ base }) => base === "sobre.html");
const contactarLink =
  navCta && getBaseName(new URL(navCta.href, window.location.href).pathname) === "contacto.html"
    ? navCta
    : null;

const scheduleActiveUpdate = (updateFn) => {
  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(() => {
      updateFn();
      ticking = false;
    });
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("hashchange", () => window.requestAnimationFrame(updateFn));
  updateFn();
};

if (navTabLinks.length) {
  const currentPage = getBaseName(window.location.pathname);

  if (currentPage === "index.html") {
    const servicosSection = document.querySelector("#servicos");
    const faqSection = document.querySelector("#faq");

    const updateIndexActive = () => {
      const offset = window.scrollY + window.innerHeight * 0.35;
      if (faqSection && offset >= faqSection.offsetTop) {
        setNavActive(faqLink || indexLink);
        return;
      }
      if (servicosSection && offset >= servicosSection.offsetTop) {
        setNavActive(servicosLink || indexLink);
        return;
      }
      setNavActive(indexLink);
    };

    scheduleActiveUpdate(updateIndexActive);
  } else if (currentPage === "contacto.html") {
    setNavActive(contactarLink || indexLink);
  } else if (currentPage === "sobre.html") {
    setNavActive(sobreLink);
  } else if (currentPage === "privacidade.html" || currentPage === "obrigado.html") {
    setNavActive(indexLink);
  }
}

if (navItems.length) {
  navItems.forEach((link) => {
    link.addEventListener("click", (event) => {
      if (shouldIgnoreNavClick(event, link)) return;
      setNavActive(link);
    });
  });
}

if (navTabs && navTabLinks.length) {
  window.addEventListener("resize", () => refreshTabIndicator(), { passive: true });
  refreshTabIndicator();
}

const staggerGroups = document.querySelectorAll("[data-stagger]");
staggerGroups.forEach((group) => {
  Array.from(group.children).forEach((item, index) => {
    item.dataset.reveal = "item";
    item.style.setProperty("--delay", `${index * 90}ms`);
  });
});

const revealItems = document.querySelectorAll("[data-reveal]");
const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)");

if (!prefersReduced.matches && revealItems.length) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.18 }
  );

  revealItems.forEach((item) => observer.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add("in-view"));
}

const parallaxElements = document.querySelectorAll("[data-parallax]");
if (!prefersReduced.matches && parallaxElements.length) {
  let ticking = false;

  const updateParallax = () => {
    parallaxElements.forEach((element) => {
      const rect = element.getBoundingClientRect();
      const strength = Number.parseFloat(element.dataset.parallax || "30");
      const progress =
        (window.innerHeight - rect.top) / (window.innerHeight + rect.height);
      const offset = (progress - 0.5) * strength;
      element.style.transform = `translate3d(0, ${offset.toFixed(2)}px, 0)`;
    });
    ticking = false;
  };

  const requestParallax = () => {
    if (!ticking) {
      window.requestAnimationFrame(updateParallax);
      ticking = true;
    }
  };

  requestParallax();
  window.addEventListener("scroll", requestParallax, { passive: true });
  window.addEventListener("resize", requestParallax);
}

if (!prefersReduced.matches) {
  document.addEventListener("click", (event) => {
    if (event.defaultPrevented) return;
    const link = event.target.closest("a");
    if (!link) return;
    if (link.target === "_blank" || link.hasAttribute("download")) return;
    const href = link.getAttribute("href");
    if (!href || href.startsWith("#")) return;
    if (href.startsWith("mailto:") || href.startsWith("tel:")) return;
    const url = new URL(link.href, window.location.href);
    if (url.origin !== window.location.origin) return;
    if (url.pathname === window.location.pathname && url.hash) return;
    event.preventDefault();
    document.body.classList.add("is-leaving");
    window.setTimeout(() => {
      window.location.href = url.href;
    }, 420);
  });
}

const form = document.querySelector("form[data-netlify]");
if (form) {
  const steps = form.querySelectorAll(".form-step");
  const progress = form.querySelector(".form-progress span");
  const nextButton = form.querySelector("[data-step-next]");
  const prevButton = form.querySelector("[data-step-prev]");
  let currentStep = 0;
  const isLocal =
    window.location.protocol === "file:" ||
    window.location.hostname === "" ||
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1";

  const setStep = (index) => {
    currentStep = Math.max(0, Math.min(index, steps.length - 1));
    steps.forEach((step, stepIndex) => {
      step.classList.toggle("is-active", stepIndex === currentStep);
    });
    if (progress) {
      progress.style.width = `${((currentStep + 1) / steps.length) * 100}%`;
    }
  };

  setStep(currentStep);

  if (nextButton) {
    nextButton.addEventListener("click", () => {
      const fields = steps[currentStep].querySelectorAll(
        "input, select, textarea"
      );
      const isValid = Array.from(fields).every((field) => field.reportValidity());
      if (isValid) {
        setStep(currentStep + 1);
      }
    });
  }

  if (prevButton) {
    prevButton.addEventListener("click", () => setStep(currentStep - 1));
  }

  form.addEventListener("submit", (event) => {
    form.classList.add("was-submitted");
    if (isLocal) {
      event.preventDefault();
      const action = form.getAttribute("action") || "obrigado.html";
      window.location.href = action;
    }
  });
}
