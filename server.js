const express = require("express");
const fs = require("fs/promises");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, "data");
const REQUESTS_FILE = path.join(DATA_DIR, "requests.json");

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

async function ensureStorage() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.access(REQUESTS_FILE);
  } catch {
    await fs.writeFile(REQUESTS_FILE, "[]", "utf8");
  }
}

function normalizePhone(phone) {
  return String(phone || "").trim();
}

app.post("/api/requests", async (req, res) => {
  const { parentName, phone, date, packageType, guests, wishes } = req.body || {};

  if (!parentName || !phone || !date || !packageType) {
    return res.status(400).json({ ok: false, message: "Заполните обязательные поля формы." });
  }

  const normalizedPhone = normalizePhone(phone);
  if (normalizedPhone.length < 6) {
    return res.status(400).json({ ok: false, message: "Введите корректный номер телефона." });
  }

  const newRequest = {
    id: Date.now(),
    createdAt: new Date().toISOString(),
    parentName: String(parentName).trim(),
    phone: normalizedPhone,
    date: String(date).trim(),
    packageType: String(packageType).trim(),
    guests: String(guests || "").trim(),
    wishes: String(wishes || "").trim()
  };

  try {
    const raw = await fs.readFile(REQUESTS_FILE, "utf8");
    const list = JSON.parse(raw);
    list.push(newRequest);
    await fs.writeFile(REQUESTS_FILE, JSON.stringify(list, null, 2), "utf8");
    return res.json({ ok: true, message: "Заявка принята! Мы свяжемся с вами в ближайшее время." });
  } catch {
    return res.status(500).json({ ok: false, message: "Не удалось сохранить заявку. Попробуйте еще раз." });
  }
});

app.get("*", (_, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

ensureStorage().then(() => {
  app.listen(PORT, () => {
    console.log(`Server started on http://localhost:${PORT}`);
  });
});
