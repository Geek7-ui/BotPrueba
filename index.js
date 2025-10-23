import puppeteer from "puppeteer";

const USERNAME = process.env.MCSERVER_USER;
const PASSWORD = process.env.MCSERVER_PASS;
const SERVER_ID = "14df21d0"; // cambia esto si tu ID es diferente

(async () => {
  console.log("➡️ Iniciando navegador...");
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();

  try {
    console.log("➡️ Abriendo página de login...");
    await page.goto("https://www.mcserverhost.com/login", { waitUntil: "networkidle2" });

    console.log("✍️ Ingresando credenciales...");
    await page.type("#auth-username", USERNAME, { delay: 100 });
    await page.type("#auth-password", PASSWORD, { delay: 100 });

    console.log("🔐 Haciendo clic en LOGIN...");
    await page.click('button[action="login"]');
    await new Promise(resolve => setTimeout(resolve, 5000)); // espera para que cargue la sesión

    console.log("⏳ Abriendo dashboard...");
    await page.goto(`https://www.mcserverhost.com/servers/${SERVER_ID}/dashboard`, {
      waitUntil: "networkidle2",
    });

    console.log("♻️ Esperando botón RENEW...");
    await page.waitForSelector("a.billing-button.renew.pseudo", { timeout: 15000 });

    console.log("🖱️ Haciendo clic en RENEW...");
    await page.click("a.billing-button.renew.pseudo");

    await new Promise(resolve => setTimeout(resolve, 5000)); // espera que el clic se procese

    console.log("✅ Renovación completada con éxito.");
  } catch (err) {
    console.error("❌ Error durante la ejecución:", err);
  } finally {
    await browser.close();
    console.log("🔚 Proceso terminado.");
  }
})();
