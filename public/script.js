const form = document.getElementById("leadForm");
const statusEl = document.getElementById("formStatus");
const FALLBACK_EMAIL = "mail@tigra-kzn.ru";

async function submitViaApi(payload) {
  let response;
  try {
    response = await fetch("/api/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
  } catch (_) {
    const error = new Error("Сервер недоступен.");
    error.code = "NETWORK_ERROR";
    throw error;
  }

  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    const error = new Error("API вернул не JSON.");
    error.code = "NON_JSON_RESPONSE";
    throw error;
  }

  const result = await response.json();
  if (!response.ok || !result.ok) {
    throw new Error(result.message || "Ошибка отправки формы.");
  }

  return result.message;
}

async function submitViaEmailFallback(payload) {
  const fallbackData = new FormData();
  fallbackData.append("_subject", "Новая заявка с сайта Тигра");
  fallbackData.append("_captcha", "false");
  fallbackData.append("Имя родителя", payload.parentName || "");
  fallbackData.append("Телефон", payload.phone || "");
  fallbackData.append("Дата праздника", payload.date || "");
  fallbackData.append("Пакет", payload.packageType || "");
  fallbackData.append("Количество гостей", payload.guests || "");
  fallbackData.append("Пожелания", payload.wishes || "");

  const response = await fetch(`https://formsubmit.co/ajax/${FALLBACK_EMAIL}`, {
    method: "POST",
    headers: { Accept: "application/json" },
    body: fallbackData
  });

  const result = await response.json();
  if (!response.ok || result.success !== "true") {
    throw new Error("Не удалось отправить заявку через email-сервис.");
  }
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  statusEl.textContent = "Отправляем заявку...";
  statusEl.className = "status";

  const formData = new FormData(form);
  const payload = Object.fromEntries(formData.entries());

  try {
    let message;
    try {
      message = await submitViaApi(payload);
    } catch (apiError) {
      const canUseFallback =
        apiError &&
        (apiError.code === "NETWORK_ERROR" || apiError.code === "NON_JSON_RESPONSE");
      if (!canUseFallback) {
        throw apiError;
      }

      await submitViaEmailFallback(payload);
      message =
        "Заявка отправлена. Если сайт работает на GitHub Pages, она отправлена через email-сервис.";
    }
    statusEl.textContent = message;
    statusEl.className = "status ok";
    form.reset();
  } catch (error) {
    statusEl.textContent = error.message || "Сервис временно недоступен.";
    statusEl.className = "status err";
  }
});
