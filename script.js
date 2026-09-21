// ---- CONFIGURA ESTO ANTES DE PUBLICAR ----
// 1) Crea una cuenta gratis en https://formspree.io, crea un formulario nuevo
//    y pega aquí el endpoint que te da (algo como "https://formspree.io/f/abcd1234")
const FORM_ENDPOINT = "https://formspree.io/f/xzezpejp";

// 2) Webhook del equipo del bot (n8n) — recibe los datos del formulario
//    en cuanto alguien lo envía, en paralelo al envío a Formspree.
const WEBHOOK_ENDPOINT = "https://n8n.aiagencyusa.com/webhook/1f1d5a94-4338-43d6-b4a6-4ff112d00d0a";
// -------------------------------------------

// Menú móvil
const menuToggle = document.getElementById("menuToggle");
const mobileNav = document.getElementById("mobileNav");

menuToggle.addEventListener("click", () => {
  const isOpen = mobileNav.classList.toggle("open");
  menuToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
});

mobileNav.querySelectorAll(".nav-link").forEach((link) => {
  link.addEventListener("click", () => {
    mobileNav.classList.remove("open");
    menuToggle.setAttribute("aria-expanded", "false");
  });
});

// Selección de chips (tamaño) — grupo de radio accesible
function setupRadioGroup(groupEl, hiddenInput) {
  const buttons = groupEl.querySelectorAll("[role='radio']");
  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      buttons.forEach((b) => b.setAttribute("aria-checked", "false"));
      btn.setAttribute("aria-checked", "true");
      hiddenInput.value = btn.dataset.value;
    });
  });
}

setupRadioGroup(document.getElementById("sizeChips"), document.getElementById("tamanoInput"));
setupRadioGroup(document.getElementById("zonaChips"), document.getElementById("zonaInput"));
setupRadioGroup(document.getElementById("asesoramientoToggle"), document.getElementById("asesoramientoInput"));

// Acordeón de preguntas frecuentes
document.querySelectorAll(".accordion-trigger").forEach((trigger) => {
  trigger.addEventListener("click", () => {
    const panel = trigger.nextElementSibling;
    const isOpen = trigger.getAttribute("aria-expanded") === "true";
    trigger.setAttribute("aria-expanded", isOpen ? "false" : "true");
    panel.style.maxHeight = isOpen ? "0px" : panel.scrollHeight + "px";
  });
});

// Botón flotante: se muestra cuando el formulario deja de estar a la vista
const floatingCta = document.getElementById("floatingCta");
const heroSection = document.getElementById("formulario");
const heroObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      floatingCta.classList.toggle("visible", !entry.isIntersecting);
    });
  },
  { threshold: 0.1 }
);
heroObserver.observe(heroSection);

// Revelado de las categorías del portfolio al hacer scroll
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.15 }
);
document.querySelectorAll(".carousel-wrap").forEach((item) => revealObserver.observe(item));

// Flechas de navegación de cada carrusel
document.querySelectorAll(".carousel-wrap").forEach((wrap) => {
  const track = wrap.querySelector(".carousel");
  const prevBtn = wrap.querySelector(".carousel-prev");
  const nextBtn = wrap.querySelector(".carousel-next");
  const items = track.querySelectorAll(".carousel-item");

  function updateArrows() {
    const maxScroll = track.scrollWidth - track.clientWidth;
    prevBtn.hidden = track.scrollLeft <= 4;
    nextBtn.hidden = track.scrollLeft >= maxScroll - 4;
  }

  prevBtn.addEventListener("click", () => {
    track.scrollBy({ left: -track.clientWidth, behavior: "smooth" });
  });
  nextBtn.addEventListener("click", () => {
    track.scrollBy({ left: track.clientWidth, behavior: "smooth" });
  });
  track.addEventListener("scroll", updateArrows);

  if (items.length <= 1) {
    prevBtn.hidden = true;
    nextBtn.hidden = true;
  } else {
    updateArrows();
  }
});

// Formulario
const form = document.getElementById("ideaForm");
const submitBtn = document.getElementById("submitBtn");
const formStatus = document.getElementById("formStatus");
const tamanoInput = document.getElementById("tamanoInput");
const tamanoError = document.getElementById("tamanoError");
const zonaInput = document.getElementById("zonaInput");
const zonaError = document.getElementById("zonaError");
const asesoramientoInput = document.getElementById("asesoramientoInput");
const asesoramientoError = document.getElementById("asesoramientoError");

// Navegación del formulario por pasos
const steps = Array.from(document.querySelectorAll(".form-step"));
const totalSteps = steps.length;
const progressFill = document.getElementById("progressFill");
const prevStepBtn = document.getElementById("prevStepBtn");
const nextStepBtn = document.getElementById("nextStepBtn");
const descripcionInput = document.getElementById("descripcion");
let currentStep = 1;

function showStep(n) {
  steps.forEach((step) => {
    step.hidden = Number(step.dataset.step) !== n;
  });
  progressFill.style.width = (n / totalSteps) * 100 + "%";
  prevStepBtn.hidden = n === 1;
  nextStepBtn.hidden = n === totalSteps;
  submitBtn.hidden = n !== totalSteps;
}

function stepIsValid(n) {
  if (n === 1) {
    tamanoError.classList.toggle("visible", !tamanoInput.value);
    return !!tamanoInput.value;
  }
  if (n === 2) {
    zonaError.classList.toggle("visible", !zonaInput.value);
    return !!zonaInput.value;
  }
  if (n === 3) {
    asesoramientoError.classList.toggle("visible", !asesoramientoInput.value);
    return !!asesoramientoInput.value;
  }
  if (n === 4) {
    if (!descripcionInput.value.trim()) {
      descripcionInput.reportValidity();
      return false;
    }
    return true;
  }
  return true;
}

nextStepBtn.addEventListener("click", () => {
  if (!stepIsValid(currentStep)) return;
  currentStep = Math.min(currentStep + 1, totalSteps);
  showStep(currentStep);
});

prevStepBtn.addEventListener("click", () => {
  currentStep = Math.max(currentStep - 1, 1);
  showStep(currentStep);
});

showStep(currentStep);

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  formStatus.textContent = "";
  formStatus.classList.remove("error");

  let valid = form.checkValidity();

  tamanoError.classList.toggle("visible", !tamanoInput.value);
  zonaError.classList.toggle("visible", !zonaInput.value);
  asesoramientoError.classList.toggle("visible", !asesoramientoInput.value);
  if (!tamanoInput.value || !zonaInput.value || !asesoramientoInput.value) valid = false;

  if (!valid) {
    form.reportValidity();
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = "Enviando…";

  const nombre = document.getElementById("nombre").value.trim();

  try {
    const formData = new FormData(form);

    // Datos en formato simple para el webhook (JSON)
    const payload = Object.fromEntries(formData.entries());

    // Se manda al webhook del bot en paralelo; si falla, no bloquea el
    // envío principal a Formspree ni la experiencia del cliente.
    fetch(WEBHOOK_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).catch((err) => console.error("Webhook error:", err));

    const response = await fetch(FORM_ENDPOINT, {
      method: "POST",
      headers: { Accept: "application/json" },
      body: formData,
    });

    if (!response.ok) throw new Error("submit_failed");

    form.hidden = true;
    const thankYou = document.getElementById("thankYou");
    thankYou.hidden = false;
    document.getElementById("thankYouName").textContent = nombre;
  } catch (err) {
    formStatus.textContent = "No hemos podido enviar el formulario. Inténtalo de nuevo en un momento.";
    formStatus.classList.add("error");
    submitBtn.disabled = false;
    submitBtn.textContent = "Enviar mi idea";
  }
});
