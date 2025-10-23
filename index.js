const puppeteer = require('puppeteer');

(async () => {
  const LOGIN_URL = 'https://www.mcserverhost.com/login';
  const DASHBOARD_URL = 'https://www.mcserverhost.com/servers/14df21d0/dashboard';

  const USER = process.env.MC_USER;
  const PASS = process.env.MC_PASS;

  if (!USER || !PASS) {
    console.error('⚠️  MC_USER o MC_PASS no definidos. Define las variables de entorno o los secrets.');
    process.exit(1);
  }

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1366, height: 768 });

    console.log('➡️ Abriendo login...');
    await page.goto(LOGIN_URL, { waitUntil: 'networkidle2', timeout: 60000 });

    console.log('✍️ Ingresando credenciales...');
    await page.waitForSelector('#auth-username', { timeout: 10000 });
    await page.type('#auth-username', USER, { delay: 50 });
    await page.type('#auth-password', PASS, { delay: 50 });

    console.log('🔐 Clic en LOGIN...');
    // botón: <button action="login" ...>LOGIN</button>
    await page.evaluate(() => {
      const btn = document.querySelector('button[action="login"]');
      if (btn) btn.click();
    });

    // esperar la navegación o recarga (fall back a timeout)
    try {
      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 });
    } catch (e) {
      // puede que la página haga reload por JS o cambie sin navegación completa; no pasa nada
    }

    console.log('⏳ Intentando acceder al dashboard...');
    await page.goto(DASHBOARD_URL, { waitUntil: 'networkidle2', timeout: 60000 });

    console.log('♻️ Esperando botón RENEW...');
    await page.waitForSelector('a.billing-button.renew.pseudo', { timeout: 15000 });

    console.log('🖱️ Haciendo clic en RENEW...');
    // usar evaluate para que ejecute el onclick con post(...)
    await page.evaluate(() => {
      const a = document.querySelector('a.billing-button.renew.pseudo');
      if (a) a.click();
    });

    // Esperar un poco para asegurar que la petición se hizo
    await page.waitForTimeout(4000);

    console.log('✅ Renovación intentada. Hora:', new Date().toISOString());
  } catch (err) {
    console.error('❌ Error:', err);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
})();
