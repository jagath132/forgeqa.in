import { URL } from 'url';

/**
 * Crawls a web application using Playwright (or fallback HTTP fetch if Playwright is unavailable),
 * extracts structural elements (pages, headings, forms, buttons, nav links, text),
 * and produces a structured CrawlReport for AI PRD generation.
 */
export async function crawlWebApp({ url, email, password, focus, maxPages = 20 }) {
  if (!url || typeof url !== 'string') {
    throw new Error('A valid target URL is required for crawling.');
  }

  let targetUrlObj;
  try {
    targetUrlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
  } catch {
    throw new Error(`Invalid URL format: ${url}`);
  }

  const origin = targetUrlObj.origin;
  const visited = new Set();
  const pages = [];
  let loginAttempted = false;
  let loginSuccess = false;

  let playwrightModule = null;
  try {
    playwrightModule = await import('playwright');
  } catch {
    // Playwright not installed in environment
  }

  if (playwrightModule && playwrightModule.chromium) {
    let browser = null;
    try {
      browser = await playwrightModule.chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
      });

      const context = await browser.newContext({
        viewport: { width: 1280, height: 800 },
        userAgent:
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 ForgeQA/1.0',
      });

      const page = await context.newPage();
      page.setDefaultTimeout(15000);
      page.setDefaultNavigationTimeout(20000);

      // 1. Initial navigation
      await page.goto(targetUrlObj.href, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1000);

      // 2. Optional Auto-Login
      if (email && password) {
        loginAttempted = true;
        try {
          const emailInput = await page.$(
            'input[type="email"], input[name*="email" i], input[name*="user" i], input[id*="email" i], input[placeholder*="email" i]'
          );
          const passInput = await page.$(
            'input[type="password"], input[name*="pass" i], input[id*="pass" i]'
          );

          if (emailInput && passInput) {
            await emailInput.fill(email);
            await passInput.fill(password);

            const submitBtn = await page.$(
              'button[type="submit"], input[type="submit"], button:has-text("Sign in"), button:has-text("Log in"), button:has-text("Login")'
            );
            if (submitBtn) {
              await Promise.all([
                page
                  .waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 10000 })
                  .catch(() => {}),
                submitBtn.click(),
              ]);
              await page.waitForTimeout(1500);
              loginSuccess = true;
            }
          }
        } catch (authErr) {
          console.warn('Auto-login encounter notice:', authErr.message);
        }
      }

      // 3. BFS Crawl
      const queue = [{ url: page.url(), depth: 0 }];

      while (queue.length > 0 && pages.length < maxPages) {
        const { url: currentUrl, depth } = queue.shift();
        const normalizedUrl = currentUrl.split('#')[0].replace(/\/$/, '');

        if (visited.has(normalizedUrl)) continue;
        visited.add(normalizedUrl);

        try {
          if (page.url() !== currentUrl) {
            await page.goto(currentUrl, { waitUntil: 'domcontentloaded', timeout: 12000 });
            await page.waitForTimeout(500);
          }

          const pageData = await page.evaluate(() => {
            const getTexts = (sel) =>
              Array.from(document.querySelectorAll(sel))
                .map((el) => el.innerText?.trim())
                .filter(Boolean)
                .slice(0, 30);

            const headings = [...getTexts('h1'), ...getTexts('h2'), ...getTexts('h3')].slice(0, 20);

            const buttons = Array.from(
              document.querySelectorAll('button, [role="button"], a.btn, .btn')
            )
              .map((b) => b.innerText?.trim() || b.getAttribute('aria-label') || '')
              .filter(Boolean)
              .slice(0, 25);

            const forms = Array.from(document.querySelectorAll('form, .form'))
              .map((f) => {
                const inputs = Array.from(f.querySelectorAll('input, select, textarea')).map(
                  (i) => ({
                    name: i.getAttribute('name') || i.getAttribute('id') || '',
                    type: i.getAttribute('type') || i.tagName.toLowerCase(),
                    placeholder: i.getAttribute('placeholder') || '',
                    label:
                      i.labels?.[0]?.innerText?.trim() ||
                      i.closest('label')?.innerText?.trim() ||
                      '',
                  })
                );
                return { inputs: inputs.slice(0, 15) };
              })
              .slice(0, 5);

            const links = Array.from(document.querySelectorAll('a[href]'))
              .map((a) => ({
                href: a.href,
                text: a.innerText?.trim() || a.getAttribute('title') || '',
              }))
              .filter((l) => l.href && !l.href.startsWith('javascript:'))
              .slice(0, 50);

            // Clean text extraction
            const bodyClone = document.body.cloneNode(true);
            const removeTags = ['script', 'style', 'noscript', 'svg', 'iframe'];
            removeTags.forEach((tag) => {
              bodyClone.querySelectorAll(tag).forEach((el) => el.remove());
            });
            const rawText = (bodyClone.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 2500);

            return {
              title: document.title || '',
              headings,
              buttons: Array.from(new Set(buttons)),
              forms,
              links,
              snippet: rawText,
            };
          });

          pages.push({
            url: currentUrl,
            title: pageData.title,
            headings: pageData.headings,
            buttons: pageData.buttons,
            forms: pageData.forms,
            snippet: pageData.snippet,
          });

          // Enqueue links
          if (depth < 2 && pages.length < maxPages) {
            for (const link of pageData.links) {
              try {
                const linkObj = new URL(link.href);
                if (linkObj.origin === origin) {
                  const cleanLink = link.href.split('#')[0].replace(/\/$/, '');
                  if (!visited.has(cleanLink)) {
                    queue.push({ url: link.href, depth: depth + 1 });
                  }
                }
              } catch {
                // ignore invalid link URLs
              }
            }
          }
        } catch (pageErr) {
          console.warn(`Error crawling ${currentUrl}:`, pageErr.message);
        }
      }

      await browser.close();
    } catch (err) {
      if (browser) await browser.close().catch(() => {});
      throw new Error(`Browser crawl failed: ${err.message}`);
    }
  } else {
    // Fallback: Fetch single page via HTTP
    try {
      const resp = await fetch(targetUrlObj.href, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 ForgeQA/1.0',
        },
      });
      if (!resp.ok) {
        throw new Error(`HTTP ${resp.status}: ${resp.statusText}`);
      }
      const html = await resp.text();

      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      const title = titleMatch ? titleMatch[1].trim() : targetUrlObj.hostname;

      // Extract basic text
      const cleanHtml = html
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      pages.push({
        url: targetUrlObj.href,
        title,
        headings: [],
        buttons: [],
        forms: [],
        snippet: cleanHtml.slice(0, 4000),
      });
    } catch (fetchErr) {
      throw new Error(`URL fetch failed: ${fetchErr.message}`);
    }
  }

  return {
    targetUrl: targetUrlObj.href,
    origin,
    focusModule: focus || null,
    loginAttempted,
    loginSuccess,
    totalPagesExplored: pages.length,
    pages,
    timestamp: new Date().toISOString(),
  };
}
