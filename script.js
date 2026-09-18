const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
const sections = document.querySelectorAll(".reveal, .languages > div, .activities li, .future-grid article, .project-link");
sections.forEach((item) => {
  item.classList.add("reveal");
  const siblings = [...item.parentElement.children];
  item.style.setProperty("--reveal-delay", Math.min(siblings.indexOf(item), 4) * 65 + "ms");
});
let observer;
function configureReveals() {
  observer?.disconnect();
  sections.forEach((section) => section.classList.remove("pending"));
  if (motionPreference.matches || !("IntersectionObserver" in window)) return;
  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.remove("pending");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.08 },
  );
  sections.forEach((section) => {
    if (section.getBoundingClientRect().top > window.innerHeight)
      section.classList.add("pending");
    observer.observe(section);
  });
}
configureReveals();
motionPreference.addEventListener("change", configureReveals);
const progress = document.querySelector(".progress");
let scheduled = false;
function updateProgress() {
  const distance = document.documentElement.scrollHeight - window.innerHeight;
  progress.style.transform = `scaleX(${distance > 0 ? Math.min(1, Math.max(0, window.scrollY / distance)) : 0})`;
  scheduled = false;
}
function scheduleProgress() {
  if (!scheduled) {
    scheduled = true;
    requestAnimationFrame(updateProgress);
  }
}
window.addEventListener("scroll", scheduleProgress, { passive: true });
window.addEventListener("resize", scheduleProgress);
updateProgress();

// Seek the film in both directions without autoplay or external libraries.
const hero = document.querySelector(".hero-animated");
const film = hero?.querySelector("video");
const mediaLayer = hero?.querySelector(".hero-media");
if (hero && film && mediaLayer) {
  let targetTime = 0;
  let filmFrame = 0;
  function seekFilm() {
    filmFrame = 0;
    if (motionPreference.matches || !Number.isFinite(film.duration)) return;
    const start = hero.getBoundingClientRect().top + window.scrollY;
    const distance = Math.max(1, hero.offsetHeight - window.innerHeight);
    const fraction = Math.min(
      1,
      Math.max(0, (window.scrollY - start) / distance),
    );
    targetTime = fraction * Math.max(0, film.duration - 0.05);
    if (!film.seeking && Math.abs(film.currentTime - targetTime) > 0.025)
      film.currentTime = targetTime;
  }
  function scheduleFilm() {
    if (!filmFrame) filmFrame = requestAnimationFrame(seekFilm);
  }
  film.addEventListener("seeked", () => {
    if (!motionPreference.matches) mediaLayer.classList.add("ready");
    if (Math.abs(film.currentTime - targetTime) > 0.025) scheduleFilm();
  });
  film.addEventListener("loadeddata", () => {
    mediaLayer.classList.add("ready");
    scheduleFilm();
  });
  film.addEventListener("error", () => mediaLayer.classList.remove("ready"));
  function configureFilm() {
    mediaLayer.classList.remove("ready");
    if (motionPreference.matches) {
      film.pause();
      film.removeAttribute("src");
      film.load();
      return;
    }
    const source = window.matchMedia("(max-width: 800px)").matches
      ? "assets/scene-01-mobile.mp4"
      : "assets/scene-01.mp4";
    if (film.getAttribute("src") !== source) {
      film.src = source;
      film.load();
    }
    scheduleFilm();
  }
  window.addEventListener("scroll", scheduleFilm, { passive: true });
  window.addEventListener("resize", scheduleFilm);
  motionPreference.addEventListener("change", configureFilm);
  configureFilm();
}

// Pointer depth is limited to precise pointers; touch and reduced motion stay static.
const precisePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
document.querySelectorAll(".hero-code, .project-link").forEach((card) => {
  let frame = 0;
  function resetDepth() {
    cancelAnimationFrame(frame);
    card.style.removeProperty("--tilt-x");
    card.style.removeProperty("--tilt-y");
  }
  card.addEventListener("pointermove", (event) => {
    if (motionPreference.matches || !precisePointer.matches) return;
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      const rect = card.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      card.style.setProperty("--tilt-x", (-y * 4).toFixed(2) + "deg");
      card.style.setProperty("--tilt-y", (x * 4).toFixed(2) + "deg");
    });
  });
  card.addEventListener("pointerleave", resetDepth);
  motionPreference.addEventListener("change", resetDepth);
  precisePointer.addEventListener("change", resetDepth);
});
