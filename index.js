import puppeteer from "puppeteer";

const cookies = [
  {"name":"session","value":"vXZpacAd68JDg6KQcgQ9iZK7TYGnHbHAWivB3bAK","domain":"billing.freeminecrafthost.com","path":"/","expires":1750627814,"size":74,"httpOnly":true,"secure":true,"session":false,"sameSite":"Lax"},
  {"name":"XSRF-TOKEN","value":"eyJpdiI6IlBNNUkrZ0VieVE4b1VpcnAwTWc1bmc9PSIsInZhbHVlIjoiOWc1ejBYMmJFWld1S2dkRjV2RkZtanRjUkkzeEY4TjFwM21NbUdqY0V2amhsaXd2L00zTnAxY3ZkRXRXc2l0byIsIm1hYyI6ImQ1NTg5ZjkwNmU2NjY0YTMxMjZkZmEwOGQwMmJhNGJmNGQ5YzlhOTljMTIyNDc2ZDk2YTQzZDBhMWUyMTgyZTAifQ%3D%3D","domain":"billing.freeminecrafthost.com","path":"/","expires":1750647617,"size":324,"httpOnly":false,"secure":true,"session":false,"sameSite":"Lax"}
];

async function startBot() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox"]
  });

  const page = await browser.newPage();
  await page.setCookie(...cookies);

  console.log("➡️ Entrando a Earn Coins...");
  await page.goto("https://billing.freeminecrafthost.com/earn/coins", {
    waitUntil: "networkidle2"
  });

  console.log("✔ Sesión iniciada");
  
  // -----------------------------
  // 🔥 Función: cerrar anuncios simples
  // -----------------------------
  async function closeSimpleAds() {
    const closeBtns = [
      "button[class*='close']",
      ".btn-close",
      ".close",
      ".adsbox-close",
      "button[aria-label='Close']"
    ];

    for (const selector of closeBtns) {
      try {
        const el = await page.$(selector);
        if (el) {
          await el.click();
          console.log("❌ Anuncio simple cerrado");
          await page.waitForTimeout(1000);
        }
      } catch {}
    }
  }

  // -----------------------------
  // 🔥 Función: detectar anuncio de video
  // -----------------------------
  async function detectVideoAd() {
    try {
      const timer = await page.$("span.timer, .ad-timer, #timer");
      if (timer) {
        console.log("🎬 Anuncio de video detectado");

        // Esperar a que desaparezca el timer
        await page.waitForFunction(
          () => !document.querySelector("span.timer, .ad-timer, #timer"),
          { timeout: 60000 }
        );

        console.log("➡️ Video terminado");
        return true;
      }
    } catch {}

    return false;
  }

  // -----------------------------
  // 🔥 Función: saltar anuncio (skip video)
  // -----------------------------
  async function skipVideoAd() {
    const skipButtons = [
      "button.skip-btn",
      "button[class*='skip']",
      "button[text='Skip']",
      "#skip-button",
      ".skip-ad"
    ];

    for (const selector of skipButtons) {
      try {
        const el = await page.$(selector);
        if (el) {
          await el.click();
          console.log("⏭ Video saltado");
          return true;
        }
      } catch {}
    }
    return false;
  }

  // -----------------------------
  // 🖱 clic humano aleatorio
  // -----------------------------
  async function humanClick() {
    const x = 100 + Math.random() * 300;
    const y = 150 + Math.random() * 200;
    await page.mouse.click(x, y);
    console.log(`🖱 Clic humano (${x.toFixed(0)}, ${y.toFixed(0)})`);
  }

  // -----------------------------
  // 🎯 CICLO AFK PRINCIPAL
  // -----------------------------
  const AFK_MS = 50 * 60 * 1000;
  const start = Date.now();

  console.log("⏳ Modo AFK activado (50 minutos)...");

  while (Date.now() - start < AFK_MS) {
    await closeSimpleAds();

    const video = await detectVideoAd();
    if (video) {
      await skipVideoAd();
    }

    await humanClick();

    await page.waitForTimeout(12_000); // clic cada 12s
  }

  console.log("😴 Descanso: 15 minutos...");
  await page.waitForTimeout(15 * 60 * 1000);

  browser.close();
  console.log("🔄 Reiniciando ciclo...");
  startBot();
}

startBot();
