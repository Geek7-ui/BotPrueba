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
    await page.goto('https://panel.freegamehost.xyz/auth/login', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    // Esperar a que cargue el formulario
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('🔍 Buscando campos de login...');
    
    // Buscar el campo de username/email - probamos diferentes selectores
    let usernameInput = await page.$('input[name="username"]') || 
                       await page.$('input[type="text"]') ||
                       await page.$('input[placeholder*="Username"]') ||
                       await page.$('input[placeholder*="Email"]');
    
    if (!usernameInput) {
      // Listar todos los inputs para debugging
      const inputs = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('input')).map(input => ({
          type: input.type,
          name: input.name,
          id: input.id,
          placeholder: input.placeholder,
          class: input.className
        }));
      });
      console.log('📋 Inputs encontrados:', JSON.stringify(inputs, null, 2));
      throw new Error('No se encontró el campo de username');
    }
    
    console.log('📝 Ingresando credenciales...');
    
    // Ingresar username/email
    await usernameInput.click();
    await usernameInput.type(process.env.USERNAME, { delay: 100 });
    
    // Buscar el campo de password
    let passwordInput = await page.$('input[name="password"]') || 
                       await page.$('input[type="password"]');
    
    if (!passwordInput) {
      throw new Error('No se encontró el campo de password');
    }
    
    // Ingresar password
    await passwordInput.click();
    await passwordInput.type(process.env.PASSWORD, { delay: 100 });
    
    // Tomar screenshot antes de hacer login
    await page.screenshot({ path: 'before-login.png' });
    console.log('📸 Screenshot antes del login guardado');
    
    // Esperar un momento
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('🔑 Haciendo login...');
    
    // Buscar y hacer clic en el botón de login
    const loginButton = await page.$('button[type="submit"]');
    
    if (!loginButton) {
      throw new Error('No se encontró el botón de login');
    }
    
    await loginButton.click();
    
    console.log('⏳ Esperando que el login se procese...');
    
    // Esperar a que la navegación se complete o timeout
    try {
      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 });
    } catch (e) {
      console.log('⚠️ No hubo navegación, esperando 10 segundos...');
      await new Promise(resolve => setTimeout(resolve, 10000));
    }
    
    const currentUrl = page.url();
    console.log('📍 URL actual:', currentUrl);
    
    console.log('✅ Login completado');
    
    // Navegar al servidor
    console.log('🖥️ Navegando al servidor...');
    await page.goto('https://panel.freegamehost.xyz/server/bb865b8a', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    
    // Esperar a que cargue la página del servidor
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Tomar screenshot del servidor
    await page.screenshot({ path: 'server-page.png' });
    console.log('📸 Screenshot de la página del servidor guardado');
    
    console.log('🔍 Buscando botón "Add 8 hours"...');
    
    // Buscar el botón por el texto
    const button = await page.evaluateHandle(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.find(btn => {
        const span = btn.querySelector('span');
        return span && span.textContent.includes('Add 8 hours');
      });
    });
    
    if (!button || !button.asElement()) {
      console.log('⚠️ No se encontró con el método 1, probando alternativas...');
      
      // Intentar con XPath
      const buttons = await page.$x("//button[.//span[contains(text(), 'Add 8 hours')]]");
      
      if (buttons.length > 0) {
        console.log('✅ Botón encontrado con XPath');
        await buttons[0].click();
      } else {
        // Listar todos los botones para debugging
        const allButtons = await page.evaluate(() => {
          return Array.from(document.querySelectorAll('button')).map(btn => ({
            text: btn.textContent.trim(),
            class: btn.className
          }));
        });
        console.log('🔘 Botones encontrados:', JSON.stringify(allButtons, null, 2));
        throw new Error('No se encontró el botón "Add 8 hours"');
      }
    } else {
      console.log('✅ Botón "Add 8 hours" encontrado');
      await button.asElement().click();
    }
    
    console.log('✅ Click en "Add 8 hours" exitoso!');
    
    // Esperar a que se procese
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Tomar screenshot final
    await page.screenshot({ path: 'success.png' });
    console.log('📸 Screenshot final guardado');
    
    console.log('✅ Proceso completado exitosamente!');
    
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
