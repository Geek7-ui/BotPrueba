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
    
    // Tomar screenshot antes de intentar login
    await page.screenshot({ path: 'before-login.png' });
    console.log('📸 Screenshot antes del login guardado');
    
    // Esperar un momento antes del reCAPTCHA
    await new Promise(resolve => setTimeout(resolve, 1000));
    
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
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    } catch (error) {
      console.log('⚠️ No se encontró reCAPTCHA o ya está resuelto:', error.message);
    }
    
    console.log('🔑 Haciendo login...');
    
    // Verificar que los campos tengan valores antes de hacer clic
    const hasUsername = await page.$eval('#auth-username', el => el.value.length > 0);
    const hasPassword = await page.$eval('#auth-password', el => el.value.length > 0);
    
    console.log('✓ Username filled:', hasUsername);
    console.log('✓ Password filled:', hasPassword);
    
    if (!hasUsername || !hasPassword) {
      throw new Error('Los campos no se llenaron correctamente');
    }
    
    // Hacer clic en el botón de login
    await Promise.all([
      page.click('button[action="login"]'),
      // Esperar navegación O cambio en la URL O timeout
      Promise.race([
        page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }).catch(() => null),
        page.waitForFunction(() => window.location.href.includes('/servers'), { timeout: 15000 }).catch(() => null),
        new Promise(resolve => setTimeout(resolve, 10000))
      ])
    ]);
    
    console.log('✅ Login completado');
    
    // Navegar al dashboard del servidor
    console.log('📊 Navegando al dashboard...');
    
    // Esperar antes de navegar
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    await page.goto('https://www.mcserverhost.com/servers/14df21d0/dashboard', {
      waitUntil: 'networkidle2',
      timeout: 40000
    });
    
    // Esperar a que la página cargue completamente
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Tomar screenshot del dashboard
    await page.screenshot({ path: 'dashboard.png' });
    console.log('📸 Screenshot del dashboard guardado');
    
    // Verificar si seguimos logueados
    const currentUrl = page.url();
    console.log('📍 URL actual:', currentUrl);
    
    if (currentUrl.includes('/login')) {
      console.log('❌ Parece que el login falló - fuimos redirigidos al login');
      throw new Error('Login failed - redirected to login page');
    }
    
    // Esperar al botón RENEW con más tiempo y mejor manejo
    console.log('🔍 Buscando botón RENEW...');
    
    // Primero intentar con el selector exacto
    let renewButton = await page.$('a.billing-button.renew.pseudo');
    
    // Si no lo encuentra, intentar selectores alternativos
    if (!renewButton) {
      console.log('⚠️ Selector exacto no encontrado, probando alternativas...');
      
      // Obtener todos los enlaces que contengan "RENEW"
      const allLinks = await page.evaluate(() => {
        const links = Array.from(document.querySelectorAll('a'));
        return links.map(link => ({
          text: link.textContent.trim(),
          class: link.className,
          onclick: link.getAttribute('onclick')
        }));
      });
      
      console.log('🔗 Enlaces encontrados:', JSON.stringify(allLinks.slice(0, 10), null, 2));
      
      // Intentar encontrar por texto
      renewButton = await page.$x("//a[contains(text(), 'RENEW')]");
      
      if (renewButton.length > 0) {
        console.log('✅ Botón encontrado usando XPath');
        renewButton = renewButton[0];
      } else {
        // Último intento: buscar cualquier elemento con onclick que contenga 'subscription'
        renewButton = await page.$('a[onclick*="subscription"]');
        if (renewButton) {
          console.log('✅ Botón encontrado usando onclick');
        }
      }
    }
    
    if (!renewButton) {
      console.log('❌ No se pudo encontrar el botón RENEW con ningún método');
      throw new Error('RENEW button not found');
    }
    
    console.log('🔄 Haciendo clic en RENEW...');
    // Hacer clic en el botón RENEW
    if (Array.isArray(renewButton)) {
      await renewButton.click();
    } else {
      await page.evaluate(btn => btn.click(), renewButton);
    }
    
    // Esperar a que se procese la renovación
    await new Promise(resolve => setTimeout(resolve, 3000));
    
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
