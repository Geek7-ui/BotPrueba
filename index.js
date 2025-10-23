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

    // Espera para que el AJAX se procese
    await new Promise(resolve => setTimeout(resolve, 10000));

    // Captura de pantalla del login
    await page.screenshot({ path: "./after_login.png", fullPage: true });
    console.log("📸 Captura guardada: after_login.png");

    console.log("⏳ Abriendo dashboard...");
    await page.goto(`https://www.mcserverhost.com/servers/${SERVER_ID}/dashboard`, {
      waitUntil: "networkidle2",
    });

    console.log("♻️ Buscando botón RENEW...");
    const renewButton = await page.$("a.billing-button.renew.pseudo");

    if (renewButton) {
      console.log("🖱️ Botón RENEW encontrado. Haciendo clic...");
      await renewButton.click();
      await new Promise(resolve => setTimeout(resolve, 5000));
      console.log("✅ Renovación completada con éxito.");
    } else {
      console.log("⚠️ No se encontró el botón RENEW. Quizá ya se renovó o la sesión no inició correctamente.");
      // Captura adicional si no se encontró
      await page.screenshot({ path: "./no_renew_button.png", fullPage: true });
      console.log("📸 Captura guardada: no_renew_button.png");
    }

  } catch (err) {
    console.error("❌ Error durante la ejecución:", err);
    try {
      await page.screenshot({ path: "./error_screenshot.png", fullPage: true });
      console.log("📸 Captura guardada: error_screenshot.png");
    } catch (e) {
      console.error("No se pudo guardar la captura:", e);
    }
  } finally {
    await browser.close();
    console.log("🔚 Proceso terminado.");
  }
})();
