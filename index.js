const fs = require("dotenv");
fs.config();

const io = require("@actions/io");
const puppeteer = require("puppeteer");

const isDebug = true;
let page;

(async () => {
  console.log('Launching puppeteer');
  const browser = await puppeteer.launch({
    headless: !isDebug,
    args: ["--no-sandbox"],
  });
  console.log('launched');
  await io.mkdirP(`screenshots`);
  console.log('new page');
  page = await browser.newPage();
  // page.on("console", (msg) => console.log("PAGE LOG:", msg.text()));

  console.log('setting position');
  await page.evaluateOnNewDocument(function () {
    navigator.geolocation.getCurrentPosition = function (cb) {
      setTimeout(() => {
        cb({
          coords: {
            accuracy: 21,
            altitude: null,
            altitudeAccuracy: null,
            heading: null,
            latitude: 32.07948174948672,
            longitude: 34.79441454362365,
            speed: null,
          },
        });
      }, 1000);
    };
  });

  console.log('going to meckano');
  await page.goto("https://app.meckano.co.il/login.php");
  console.log('waiting for selector email');
  await page.waitForSelector("#email", { visible: true, timeout: 5000 });
  console.log('typing email');
  await page.type("#email", process.env.MECKANO_USER, { delay: 100 });
  console.log('typing password');
  await page.type("#password", process.env.MECKANO_PASS, { delay: 100 });
  console.log('clicking on connect');
  await page.click('[value="התחברות"]');
  await page.waitForNavigation({ timeout: 10000 });

  if (new Date().getHours() < 12) {
    //Checkin
    if (!isDebug) {
      console.log('waiting rand time');
      await page.waitForTimeout(Math.floor(Math.random() * 15 * 60 * 1000));
      console.log('finished waiting rand time');
    }
    console.log('waiting for wrapperCheckin');
    await page.waitForSelector(".wrapperCheckin");
    console.log('clikcing on wrapperCheckin');
    await page.click(".wrapperCheckin");

    try {
      console.log('1st question wait');
      await page.waitForSelector(".yesNo");
      console.log('1st question select');
      await page.select(".yesNo", "כן");
      console.log('1st question click');
      await page.click(".buttonNext");

      await page.waitForTimeout(3000);
      console.log('2nd question wait');
      await page.waitForSelector(".yesNo");
      console.log('2nd question select');
      await page.select(".yesNo", "כן");
      console.log('2nd question click');
      await page.click(".buttonNext");
    } catch (e) {
      console.log(e);
    }
  } else {
    //Checkout
    if (!isDebug)
      await page.waitForTimeout(Math.floor(Math.random() * 15 * 60 * 1000));
    await page.waitForSelector(".wrapperCheckout");
    await page.click(".wrapperCheckout");
  }

  await page.waitForTimeout(5000);
  console.log('closing the browser');
  await browser.close();
})()
  .catch((exception) => {
    console.log(exception);
//     return page.screenshot({
//       fullPage: true,
//       path: `screenshots/${new Date().getTime()}.png`,
//     });
  })
  .finally(() => process.exit());
