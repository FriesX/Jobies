import puppeteer, { Browser } from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
import fs from 'fs';
import { validateSafeUrl } from '@/lib/security/ssrf';

export interface ScrapedJobData {
  title: string;
  company: string;
  location?: string;
  rawText: string;
  isAuthWall: boolean;
  warnings?: string[];
}

/**
 * Resolves local browser executable for Windows/macOS development
 */
function getLocalExecutablePath(): string | null {
  if (process.env.CHROME_PATH && fs.existsSync(process.env.CHROME_PATH)) {
    return process.env.CHROME_PATH;
  }

  const commonPaths = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium-browser',
  ];

  for (const path of commonPaths) {
    if (fs.existsSync(path)) {
      return path;
    }
  }

  return null;
}

/**
 * Headless Browser Scraper for Dynamic / SPA / Anti-Bot Protected Job Postings
 */
export async function scrapeJobWithHeadlessBrowser(targetUrl: string): Promise<ScrapedJobData> {
  const safeUrl = await validateSafeUrl(targetUrl);
  const urlStr = safeUrl.toString();
  const warnings: string[] = [];

  let browser: Browser | null = null;

  try {
    const isLocal = process.platform === 'win32' || process.platform === 'darwin';
    let executablePath = isLocal ? getLocalExecutablePath() : null;

    if (!executablePath) {
      try {
        executablePath = await chromium.executablePath();
      } catch {
        executablePath = null;
      }
    }

    if (executablePath) {
      browser = await puppeteer.launch({
        args: isLocal
          ? ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--window-size=1280,800']
          : [...chromium.args, '--no-sandbox', '--disable-setuid-sandbox'],
        defaultViewport: { width: 1280, height: 800 },
        executablePath,
        headless: true,
      });

      const page = await browser.newPage();

      // Mask automation signatures
      await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
      );
      await page.setExtraHTTPHeaders({
        'Accept-Language': 'en-US,en;q=0.9,id;q=0.8',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      });

      // Navigate to target URL with 20s timeout
      await page.goto(urlStr, {
        waitUntil: 'domcontentloaded',
        timeout: 20000,
      });

      // Give dynamic SPAs 2.5s to mount hydrated components
      await new Promise((resolve) => setTimeout(resolve, 2500));

      const pageUrl = page.url();
      const isAuthWall =
        pageUrl.includes('/authwall') ||
        pageUrl.includes('/login') ||
        pageUrl.includes('/checkpoint') ||
        pageUrl.includes('/captcha');

      // Extract structured metadata & text from rendered DOM
      const extracted = await page.evaluate(() => {
        // 1. Title detection
        const metaOgTitle = document.querySelector('meta[property="og:title"]')?.getAttribute('content');
        const h1 = document.querySelector('h1')?.textContent?.trim();
        const docTitle = document.title?.trim();
        const title = metaOgTitle || h1 || docTitle || 'Job Opportunity';

        // 2. Company detection
        const metaOgSite = document.querySelector('meta[property="og:site_name"]')?.getAttribute('content');
        const companyEl =
          document.querySelector('[data-company-name="true"]')?.textContent?.trim() ||
          document.querySelector('.topcard__org-name-link')?.textContent?.trim() ||
          document.querySelector('.employer-name')?.textContent?.trim();
        const company = companyEl || metaOgSite || '';

        // 3. Location detection
        const locationEl =
          document.querySelector('.topcard__flavor--bullet')?.textContent?.trim() ||
          document.querySelector('[data-location="true"]')?.textContent?.trim() ||
          document.querySelector('.location')?.textContent?.trim();
        const location = locationEl || '';

        // 4. Job Description Text Extraction
        // Search for targeted job description container
        const descriptionSelectors = [
          '.show-more-less-html__markup',
          '#job-details',
          '.job-description',
          '[data-automation-id="jobPostingDescription"]',
          'article',
          'main',
          '[role="main"]',
          '.description',
        ];

        let bodyText = '';
        for (const sel of descriptionSelectors) {
          const el = document.querySelector(sel);
          if (el && el.textContent && el.textContent.trim().length > 150) {
            bodyText = el.textContent.trim();
            break;
          }
        }

        // Fallback to full body text if specific container wasn't matched
        if (!bodyText || bodyText.length < 150) {
          const clone = document.body.cloneNode(true) as HTMLElement;
          // Remove scripts, styles, navigations, footers
          clone.querySelectorAll('script, style, noscript, nav, footer, header, svg').forEach((el) => el.remove());
          bodyText = clone.textContent?.replace(/\s+/g, ' ').trim() || '';
        }

        // OpenGraph description fallback
        const metaOgDesc = document.querySelector('meta[property="og:description"]')?.getAttribute('content');

        return {
          title,
          company,
          location,
          bodyText,
          metaOgDesc,
        };
      });

      await browser.close();
      browser = null;

      let finalRawText = extracted.bodyText;
      if (isAuthWall) {
        warnings.push('Situs ini menampilkan halaman login/authwall (misal LinkedIn privat).');
        if (extracted.metaOgDesc) {
          finalRawText = `${extracted.title}\n\n${extracted.metaOgDesc}\n\n(Catatan: Halaman ini membatasi bot dengan login wall. Untuk deskripsi lengkap, salin dan tempel di tab 'Paste Description')`;
        }
      }

      return {
        title: extracted.title,
        company: extracted.company || safeUrl.hostname,
        location: extracted.location || undefined,
        rawText: finalRawText,
        isAuthWall,
        warnings,
      };
    }
  } catch (err: any) {
    if (browser) {
      try {
        await browser.close();
      } catch {}
    }
    warnings.push(`Headless browser fallback: ${err?.message || 'Error running browser'}`);
  }

  // Fallback: AI Web Reader Proxy (Jina Reader) + Standard HTTP Fetch
  return await scrapeWithWebReaderFallback(urlStr, safeUrl.hostname, warnings);
}

/**
 * High-reliability fallback reader using standard fetch + Jina AI Reader
 */
async function scrapeWithWebReaderFallback(
  urlStr: string,
  hostname: string,
  existingWarnings: string[]
): Promise<ScrapedJobData> {
  const warnings = [...existingWarnings];

  try {
    // Attempt Jina Reader (renders SPAs and converts to clean readable markdown text)
    const jinaUrl = `https://r.jina.ai/${urlStr}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    const res = await fetch(jinaUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) JobiesAI/1.0',
        Accept: 'text/plain, text/markdown',
      },
    });

    clearTimeout(timeout);

    if (res.ok) {
      const markdown = await res.text();
      if (markdown && markdown.length > 100) {
        // Extract title from first markdown header
        const titleMatch = markdown.match(/^#\s+(.+)$/m) || markdown.match(/Title:\s*(.+)/i);
        const title = titleMatch ? titleMatch[1].trim() : `Job Posting from ${hostname}`;

        const isAuthWall =
          markdown.toLowerCase().includes('authwall') ||
          markdown.toLowerCase().includes('sign in to view') ||
          markdown.toLowerCase().includes('security verification');

        return {
          title,
          company: hostname,
          rawText: markdown,
          isAuthWall,
          warnings,
        };
      }
    }
  } catch {
    warnings.push('Reader proxy fallback failed; falling back to direct HTML fetch.');
  }

  // Final direct fetch fallback
  const directRes = await fetch(urlStr, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 JobiesBot/1.0',
    },
  });

  const html = await directRes.text();
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : `Job Posting from ${hostname}`;

  return {
    title,
    company: hostname,
    rawText: html,
    isAuthWall: html.includes('authwall') || html.includes('captcha'),
    warnings,
  };
}
