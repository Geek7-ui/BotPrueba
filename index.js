import puppeteer from "puppeteer";

const USERNAME = process.env.MCSERVER_USER;
const PASSWORD = process.env.MCSERVER_PASS;
const SERVER_ID = "14df21d0";

(async () => {
  console.log("➡️ Iniciando navegador...");
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();
  page.setDefaultNavigationTimeout(60000);

  try {
    console.log("➡️ Abriendo página de login...");
    await page.goto("https://www.mcserverhost.com/login", { waitUntil: "networkidle2" });

    console.log("✍️ Ingresando credenciales...");
    await page.type("#auth-username", USERNAME, { delay: 100 });
    await page.type("#auth-password", PASSWORD, { delay: 100 });

    console.log("🔐 Haciendo clic en LOGIN...");
    await page.click('button[action="login"]');

    // 🕐 Esperamos un cambio visible después del clic
    await new Promise(resolve => setTimeout(resolve, 8000)); // 8 s de espera para el AJAX

    const currentURL = page.url();
    console.log(`🌐 Página actual después del login: ${currentURL}`);

    if (currentURL.includes("login")) {
      console.warn("⚠️ Aún parece que no inició sesión. Continuaremos de todos modos...");
    }

    console.log("⏳ Abriendo dashboard...");
    await page.goto(`https://www.mcserverhost.com/servers/${SERVER_ID}/dashboard`, {
      waitUntil: "networkidle2",
    });

    console.log("♻️ Buscando botón RENEW...");
    await page.waitForSelector("a.billing-button.renew.pseudo", { timeout: 40000 });

    console.log("🖱️ Haciendo clic en RENEW...");
    await page.click("a.billing-button.renew.pseudo");
    await new Promise(resolve => setTimeout(resolve, 5000));

    console.log("✅ Renovación completada con éxito.");
  } catch (err) {
    console.error("❌ Error durante la ejecución:", err);
    try {
      await page.screenshot({ path: "error_screenshot.png", fullPage: true });
      console.log("📸 Captura de pantalla guardada: error_screenshot.png");
    } catch (e) {
      console.error("No se pudo guardar la captura:", e);
    }
  } finally {
    await browser.close();
    console.log("🔚 Proceso terminado.");
  }
})();
