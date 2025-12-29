const body = document.body;

window.addEventListener("DOMContentLoaded", () => {
  body.classList.add("is-loaded");
});

const header = document.querySelector(".site-header");
const navToggle = document.querySelector("[data-nav-toggle]");
const navLinks = document.querySelector("[data-nav-links]");
let isTicking = false;

const handleScrollState = () => {
  if (!header) return;
  header.classList.toggle("is-scrolled", window.scrollY > 24);
  isTicking = false;
};

handleScrollState();
window.addEventListener(
  "scroll",
  () => {
    if (!isTicking) {
      window.requestAnimationFrame(handleScrollState);
      isTicking = true;
    }
  },
  { passive: true }
);

if (navToggle && navLinks) {
  navToggle.addEventListener("click", () => {
    const isOpen = navLinks.classList.toggle("open");
    navToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
  });

  document.addEventListener("click", (event) => {
    if (!navLinks.classList.contains("open")) return;
    const target = event.target;
    if (target.closest("[data-nav-toggle]") || target.closest("[data-nav-links]")) {
      return;
    }
    navLinks.classList.remove("open");
    navToggle.setAttribute("aria-expanded", "false");
  });

  navLinks.addEventListener("click", (event) => {
    if (event.target.tagName === "A") {
      navLinks.classList.remove("open");
      navToggle.setAttribute("aria-expanded", "false");
    }
  });
}

const staggerGroups = document.querySelectorAll("[data-stagger]");
staggerGroups.forEach((group) => {
  Array.from(group.children).forEach((item, index) => {
    item.dataset.reveal = "item";
    item.style.setProperty("--delay", `${index * 80}ms`);
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
    { threshold: 0.2 }
  );

  revealItems.forEach((item) => observer.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add("in-view"));
}

const timeline = document.querySelector("[data-timeline]");
if (timeline) {
  const steps = timeline.querySelectorAll("[data-step]");
  const progressLine = timeline.querySelector(".timeline-line span");
  const updateTimeline = () => {
    const rect = timeline.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const progress = Math.min(
      Math.max((viewportHeight * 0.6 - rect.top) / rect.height, 0),
      1
    );
    if (progressLine) {
      progressLine.style.height = `${progress * 100}%`;
    }

    let activeIndex = 0;
    steps.forEach((step, index) => {
      const stepRect = step.getBoundingClientRect();
      if (stepRect.top <= viewportHeight * 0.5) {
        activeIndex = index;
      }
    });

    steps.forEach((step, index) => {
      step.classList.toggle("is-active", index === activeIndex);
    });
  };

  updateTimeline();
  window.addEventListener("scroll", updateTimeline, { passive: true });
  window.addEventListener("resize", updateTimeline);
}

const areaCards = document.querySelectorAll("[data-area-card]");
const areaModal = document.querySelector("[data-area-modal]");
const areaOverlay = document.querySelector("[data-area-overlay]");
const areaDrawer = document.querySelector("[data-area-drawer]");
const areaClose = document.querySelector("[data-area-close]");
const areaTitle = document.querySelector("[data-area-title]");
const areaWhen = document.querySelector("[data-area-when]");
const areaExamples = document.querySelector("[data-area-examples]");

const focusableSelector =
  "a[href], button, textarea, input, select, [tabindex]:not([tabindex='-1'])";

const trapFocus = (container) => {
  const focusable = Array.from(container.querySelectorAll(focusableSelector)).filter(
    (element) => !element.hasAttribute("disabled")
  );
  if (!focusable.length) {
    return () => {};
  }
  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  const handleKey = (event) => {
    if (event.key !== "Tab") return;
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  container.addEventListener("keydown", handleKey);
  return () => container.removeEventListener("keydown", handleKey);
};

const createFocusManager = () => {
  let cleanup = null;
  let returnFocus = null;

  return {
    activate: (container, initialFocus) => {
      returnFocus = document.activeElement;
      if (cleanup) cleanup();
      cleanup = trapFocus(container);
      if (initialFocus) {
        initialFocus.focus();
      }
    },
    deactivate: () => {
      if (cleanup) cleanup();
      cleanup = null;
      if (returnFocus && returnFocus.focus) {
        returnFocus.focus();
      }
      returnFocus = null;
    },
  };
};

const modalFocus = createFocusManager();
const drawerFocus = createFocusManager();

const closeAreaModal = () => {
  if (!areaModal) return;
  areaModal.classList.remove("open");
  body.classList.remove("modal-open");
  areaModal.setAttribute("aria-hidden", "true");
  modalFocus.deactivate();
};

const openAreaModal = (card) => {
  if (!areaModal || !areaTitle || !areaWhen || !areaExamples || !areaDrawer) {
    return;
  }
  areaTitle.textContent = card.dataset.title || "";
  areaWhen.textContent = card.dataset.when || "";
  areaExamples.innerHTML = "";
  const examples = (card.dataset.examples || "").split("|").filter(Boolean);
  examples.forEach((example) => {
    const li = document.createElement("li");
    li.textContent = example;
    areaExamples.appendChild(li);
  });
  if (typeof card.focus === "function") {
    card.focus({ preventScroll: true });
  }
  areaModal.classList.add("open");
  body.classList.add("modal-open");
  areaModal.setAttribute("aria-hidden", "false");
  modalFocus.activate(areaDrawer, areaClose);
};

areaCards.forEach((card) => {
  card.addEventListener("click", () => openAreaModal(card));
});

if (areaOverlay) {
  areaOverlay.addEventListener("click", closeAreaModal);
}

const contactToggle = document.querySelector("[data-contact-toggle]");
const contactDrawer = document.querySelector("[data-contact-drawer]");
const contactOverlay = document.querySelector("[data-contact-overlay]");
const contactClose = document.querySelector("[data-contact-close]");

const openContactDrawer = () => {
  if (!contactDrawer || !contactOverlay) return;
  contactDrawer.classList.add("open");
  contactOverlay.classList.add("open");
  contactDrawer.setAttribute("aria-hidden", "false");
  drawerFocus.activate(contactDrawer, contactClose);
};

const closeContactDrawer = () => {
  if (!contactDrawer || !contactOverlay) return;
  contactDrawer.classList.remove("open");
  contactOverlay.classList.remove("open");
  contactDrawer.setAttribute("aria-hidden", "true");
  drawerFocus.deactivate();
};

const toggleContactDrawer = () => {
  if (!contactDrawer || !contactOverlay) return;
  if (contactDrawer.classList.contains("open")) {
    closeContactDrawer();
  } else {
    openContactDrawer();
  }
};

if (contactToggle) {
  contactToggle.addEventListener("click", toggleContactDrawer);
}

if (contactOverlay) {
  contactOverlay.addEventListener("click", closeContactDrawer);
}

if (contactClose) {
  contactClose.addEventListener("click", closeContactDrawer);
}

if (areaClose) {
  areaClose.addEventListener("click", closeAreaModal);
}

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeAreaModal();
    closeContactDrawer();
  }
});

const form = document.querySelector("form[data-netlify]");
if (form) {
  const steps = form.querySelectorAll(".form-step");
  const progress = form.querySelector(".form-progress span");
  const nextButton = form.querySelector("[data-step-next]");
  const prevButton = form.querySelector("[data-step-prev]");
  let currentStep = 0;

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

  form.addEventListener("submit", () => {
    form.classList.add("was-submitted");
  });
}
