const form = document.getElementById("leadForm");
const statusEl = document.getElementById("formStatus");

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  statusEl.textContent = "Отправляем заявку...";
  statusEl.className = "status";

  const formData = new FormData(form);
  const payload = Object.fromEntries(formData.entries());

  try {
    const response = await fetch("/api/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const result = await response.json();
    if (!response.ok || !result.ok) {
      throw new Error(result.message || "Ошибка отправки формы.");
    }

    statusEl.textContent = result.message;
    statusEl.className = "status ok";
    form.reset();
  } catch (error) {
    statusEl.textContent = error.message || "Сервис временно недоступен.";
    statusEl.className = "status err";
  }
});
