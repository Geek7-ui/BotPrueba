const puppeteer = require('puppeteer');

(async () => {
  const LOGIN_URL = 'https://www.mcserverhost.com/login';
  const DASHBOARD_URL = 'https://www.mcserverhost.com/servers/14df21d0/dashboard';

  const USER = process.env.MC_USER;
  const PASS = process.env.MC_PASS;

  if (!USER || !PASS) {
    console.error('⚠️  MC_USER o MC_PASS no definidos.');
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

    console.log('🔐 Haciendo clic en LOGIN...');
    await page.evaluate(() => {
      const btn = document.querySelector('button[action="login"]');
      if (btn) btn.click();
    });

    try {
      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 });
    } catch (e) {
      console.log('⚠️ No hubo navegación completa (posible recarga con JS)');
    }

    console.log('⏳ Abriendo dashboard...');
    await page.goto(DASHBOARD_URL, { waitUntil: 'networkidle2', timeout: 60000 });

    console.log('♻️ Esperando botón RENEW...');
    await page.waitForSelector('a.billing-button.renew.pseudo', { timeout: 15000 });

    console.log('🖱️ Haciendo clic en RENEW...');
    await page.evaluate(() => {
      const a = document.querySelector('a.billing-button.renew.pseudo');
      if (a) a.click();
    });

    await page.waitForTimeout(4000);
    console.log('✅ Renovación realizada:', new Date().toISOString());
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await browser.close();
  }
})();
