// ---- CONFIGURA ESTO ANTES DE PUBLICAR ----
// 1) Crea una cuenta gratis en https://formspree.io, crea un formulario nuevo
//    y pega aquí el endpoint que te da (algo como "https://formspree.io/f/abcd1234")
const FORM_ENDPOINT = "https://formspree.io/f/xzezpejp";

// 2) Pon aquí el número de WhatsApp del estudio, en formato internacional sin
//    espacios ni símbolos (ejemplo: "34600111222")
const WHATSAPP_NUMBER = "34621076860";
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

// Revelado de las fotos del portfolio al hacer scroll
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
document.querySelectorAll(".portfolio-item").forEach((item) => revealObserver.observe(item));

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
  const telefono = document.getElementById("telefono").value.trim();
  const fotoInput = document.getElementById("foto");
  const hasPhoto = fotoInput.files && fotoInput.files.length > 0;

  try {
    const formData = new FormData(form);
    // El plan gratuito de Formspree no admite archivos adjuntos.
    // Quitamos el campo de foto de este envío; se pide por WhatsApp después.
    formData.delete("foto");

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

    if (hasPhoto) {
      document.getElementById("thankYouPhoto").hidden = false;
      const whatsappMsg = encodeURIComponent(
        `Hola, soy ${nombre}. Acabo de enviar mi idea por la web y quería adjuntaros la foto de referencia.`
      );
      const link = document.getElementById("whatsappLink");
      link.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${whatsappMsg}`;
      link.hidden = false;
    }
  } catch (err) {
    formStatus.textContent = "No hemos podido enviar el formulario. Inténtalo de nuevo en un momento.";
    formStatus.classList.add("error");
    submitBtn.disabled = false;
    submitBtn.textContent = "Enviar mi idea";
  }
});
