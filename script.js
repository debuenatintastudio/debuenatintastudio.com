// ---- CONFIGURA ESTO ANTES DE PUBLICAR ----
// 1) Crea una cuenta gratis en https://formspree.io, crea un formulario nuevo
//    y pega aquí el endpoint que te da (algo como "https://formspree.io/f/abcd1234")
const FORM_ENDPOINT = "https://formspree.io/f/xzezpejp";

// 2) Webhook del equipo del bot (n8n) — recibe los datos del formulario
//    en cuanto alguien lo envía, en paralelo al envío a Formspree.
const WEBHOOK_ENDPOINT = "https://n8n.aiagencyusa.com/webhook/1f1d5a94-4338-43d6-b4a6-4ff112d00d0a";

// 3) Endpoint propio (Vercel) que reenvía el lead a Meta Conversions API.
const CAPI_ENDPOINT = "/api/lead";
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
const asesoramientoInput = document.getElementById("asesoramientoInput");
const asesoramientoError = document.getElementById("asesoramientoError");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  formStatus.textContent = "";
  formStatus.classList.remove("error");

  let valid = form.checkValidity();

  tamanoError.classList.toggle("visible", !tamanoInput.value);
  asesoramientoError.classList.toggle("visible", !asesoramientoInput.value);
  if (!tamanoInput.value || !asesoramientoInput.value) valid = false;

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

    // ID único para este envío — se usa para que Meta pueda deduplicar
    // el evento "Lead" que dispara el navegador (Pixel) con el que
    // dispara nuestro servidor (Conversions API), y no se cuenten dos veces.
    const eventId =
      window.crypto && crypto.randomUUID
        ? crypto.randomUUID()
        : `lead_${Date.now()}_${Math.random().toString(36).slice(2)}`;

    // Se manda al webhook del bot en paralelo; si falla, no bloquea el
    // envío principal a Formspree ni la experiencia del cliente.
    fetch(WEBHOOK_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).catch((err) => console.error("Webhook error:", err));

    // Se manda a nuestro endpoint propio, que reenvía el lead a Meta
    // Conversions API (server-side). También en paralelo, sin bloquear.
    fetch(CAPI_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, eventId }),
    }).catch((err) => console.error("CAPI endpoint error:", err));

    const response = await fetch(FORM_ENDPOINT, {
      method: "POST",
      headers: { Accept: "application/json" },
      body: formData,
    });

    if (!response.ok) throw new Error("submit_failed");

    // Evento del Pixel (navegador), con el mismo eventId que el envío
    // server-side de arriba, para que Meta los deduplique en uno solo.
    fbq("track", "Lead", {}, { eventID: eventId });

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
