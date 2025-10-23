const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--disable-gpu'
    ]
  });

  try {
    const page = await browser.newPage();
    
    // Configurar viewport y user agent
    await page.setViewport({ width: 1280, height: 720 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    console.log('🔄 Navegando a la página de login...');
    await page.goto('https://www.mcserverhost.com/login', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    // Esperar a que cargue el formulario
    await page.waitForSelector('#auth-username', { timeout: 10000 });
    
    console.log('📝 Ingresando credenciales...');
    // Ingresar username
    await page.type('#auth-username', process.env.USERNAME, { delay: 100 });
    
    // Ingresar password
    await page.type('#auth-password', process.env.PASSWORD, { delay: 100 });
    
    // Esperar un momento antes del reCAPTCHA
    await page.waitForTimeout(1000);
    
    console.log('🤖 Buscando reCAPTCHA...');
    // Buscar y hacer clic en el reCAPTCHA
    try {
      // Esperar al iframe del reCAPTCHA
      const recaptchaFrame = await page.waitForSelector('iframe[src*="recaptcha"]', {
        timeout: 10000
      });
      
      if (recaptchaFrame) {
        const frame = await recaptchaFrame.contentFrame();
        
        // Hacer clic en el checkbox del reCAPTCHA
        await frame.waitForSelector('.recaptcha-checkbox-border', { timeout: 5000 });
        await frame.click('.recaptcha-checkbox-border');
        
        console.log('✅ reCAPTCHA clicked');
        
        // Esperar a que se resuelva el reCAPTCHA
        await page.waitForTimeout(3000);
      }
    } catch (error) {
      console.log('⚠️ No se encontró reCAPTCHA o ya está resuelto:', error.message);
    }
    
    console.log('🔑 Haciendo login...');
    // Hacer clic en el botón de login
    await page.click('button[action="login"]');
    
    // Esperar a que se complete el login (esperando navegación)
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 });
    
    console.log('✅ Login exitoso');
    
    // Navegar al dashboard del servidor
    console.log('📊 Navegando al dashboard...');
    await page.goto('https://www.mcserverhost.com/servers/14df21d0/dashboard', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    
    // Esperar al botón RENEW
    await page.waitForSelector('a.billing-button.renew.pseudo', { timeout: 10000 });
    
    console.log('🔄 Haciendo clic en RENEW...');
    // Hacer clic en el botón RENEW
    await page.click('a.billing-button.renew.pseudo');
    
    // Esperar a que se procese la renovación
    await page.waitForTimeout(3000);
    
    console.log('✅ Renovación completada exitosamente!');
    
    // Tomar screenshot de confirmación
    await page.screenshot({ path: 'success.png' });
    
  } catch (error) {
    console.error('❌ Error durante la ejecución:', error);
    
    // Tomar screenshot del error
    const page = (await browser.pages())[0];
    if (page) {
      await page.screenshot({ path: `error-${Date.now()}.png` });
    }
    
    throw error;
  } finally {
    await browser.close();
  }
})();
