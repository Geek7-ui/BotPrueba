const puppeteer = require("puppeteer");
const fs = require("fs");

(async () => {
  console.log("🔵 Iniciando navegador...");

  const browser = await puppeteer.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage"
    ]
  });

  const page = await browser.newPage();

  // ====== Cargar cookies ======
  if (fs.existsSync("cookies.json")) {
    const cookies = JSON.parse(fs.readFileSync("cookies.json"));
    await page.setCookie(...cookies);
    console.log("🟢 Cookies cargadas.");
  } else {
    console.log("⚠️ No existe cookies.json");
  }

  // ====== Abrir Dashboard ======
  await page.goto("https://panel.freegamehost.xyz", {
    waitUntil: "networkidle2"
  });

  console.log("🔵 Página cargada.");

  // ====== Buscar el botón ======
  await page.waitForSelector("button", { timeout: 20000 });

  console.log("🟢 Botón encontrado, haciendo clic...");
  await page.click("button");

  console.log("✅ ¡Clic hecho correctamente!");

  await browser.close();
  console.log("🔵 Bot finalizado.");
})();
