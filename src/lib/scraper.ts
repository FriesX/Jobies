import puppeteer, { Browser } from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
import fs from 'fs';
import { validateSafeUrl } from '@/lib/security/ssrf';

export interface ScrapedJobItem {
  title: string;
  company: string;
  location?: string;
  sourceUrl: string;
  rawText: string;
}

export interface ScrapedBatchResult {
  isListing: boolean;
  jobs: ScrapedJobItem[];
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
 * Clean URL parameters (strips tracking query strings)
 */
function cleanJobUrl(rawUrl: string, baseUrl: string): string {
  try {
    const parsed = new URL(rawUrl, baseUrl);
    // Keep only essential parameters
    const clean = new URL(parsed.origin + parsed.pathname);
    return clean.toString();
  } catch {
    return rawUrl;
  }
}

/**
 * Headless Browser Scraper for Single Jobs & Multi-Job Search Listings (up to 25 items per search)
 */
export async function scrapeJobWithHeadlessBrowser(targetUrl: string): Promise<ScrapedBatchResult> {
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

      await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
      );
      await page.setExtraHTTPHeaders({
        'Accept-Language': 'en-US,en;q=0.9,id;q=0.8',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      });

      await page.goto(urlStr, {
        waitUntil: 'domcontentloaded',
        timeout: 22000,
      });

      // Allow JavaScript frameworks & cards to render
      await new Promise((resolve) => setTimeout(resolve, 2500));

      const pageUrl = page.url();
      const isAuthWall =
        pageUrl.includes('/authwall') ||
        pageUrl.includes('/login') ||
        pageUrl.includes('/checkpoint') ||
        pageUrl.includes('/captcha');

      // Detect if this is a Multi-Job Search / Listing page
      const batchData = await page.evaluate((currentUrl) => {
        // Look for multiple job card items (LinkedIn, JobStreet, Indeed, etc.)
        const cardSelectors = [
          'ul.jobs-search__results-list li',
          '.base-card',
          '.job-search-card',
          '[data-entity-urn*="jobPosting"]',
          '.job-card-container',
          '.job-card',
          'article.job',
        ];

        let foundCards: Element[] = [];
        for (const sel of cardSelectors) {
          const els = Array.from(document.querySelectorAll(sel));
          if (els.length >= 2) {
            foundCards = els;
            break;
          }
        }

        // If multiple job cards detected (up to 25 items)
        if (foundCards.length >= 2) {
          const items: Array<{
            title: string;
            company: string;
            location: string;
            link: string;
            description: string;
          }> = [];

          for (const card of foundCards.slice(0, 25)) {
            const titleEl =
              card.querySelector('.base-search-card__title') ||
              card.querySelector('h3') ||
              card.querySelector('.job-card-list__title') ||
              card.querySelector('a');

            const linkEl =
              card.querySelector('a.base-card__full-link') ||
              card.querySelector('a[href*="/jobs/view/"]') ||
              card.querySelector('a[href*="/job/"]') ||
              card.querySelector('a');

            const companyEl =
              card.querySelector('.base-search-card__subtitle') ||
              card.querySelector('.job-card-container__company-name') ||
              card.querySelector('h4');

            const locationEl =
              card.querySelector('.job-search-card__location') ||
              card.querySelector('.job-card-container__metadata-item') ||
              card.querySelector('.location');

            const title = titleEl?.textContent?.trim() || '';
            const link = (linkEl as HTMLAnchorElement)?.href || currentUrl;
            const company = companyEl?.textContent?.trim() || '';
            const location = locationEl?.textContent?.trim() || '';
            const snippet = card.textContent?.replace(/\s+/g, ' ').trim() || '';

            if (title && title.length > 2) {
              items.push({
                title,
                company,
                location,
                link,
                description: `${title} at ${company || 'Company'}\nLocation: ${location}\nSource: ${link}\n\n${snippet}`,
              });
            }
          }

          if (items.length > 0) {
            return {
              isListing: true,
              items,
              singleJob: null,
            };
          }
        }

        // Single Job Page Extraction
        const metaOgTitle = document.querySelector('meta[property="og:title"]')?.getAttribute('content');
        const h1 = document.querySelector('h1')?.textContent?.trim();
        const docTitle = document.title?.trim();
        const title = metaOgTitle || h1 || docTitle || 'Job Opportunity';

        const metaOgSite = document.querySelector('meta[property="og:site_name"]')?.getAttribute('content');
        const companyEl =
          document.querySelector('[data-company-name="true"]')?.textContent?.trim() ||
          document.querySelector('.topcard__org-name-link')?.textContent?.trim() ||
          document.querySelector('.employer-name')?.textContent?.trim();
        const company = companyEl || metaOgSite || '';

        const locationEl =
          document.querySelector('.topcard__flavor--bullet')?.textContent?.trim() ||
          document.querySelector('[data-location="true"]')?.textContent?.trim() ||
          document.querySelector('.location')?.textContent?.trim();
        const location = locationEl || '';

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

        if (!bodyText || bodyText.length < 150) {
          const clone = document.body.cloneNode(true) as HTMLElement;
          clone.querySelectorAll('script, style, noscript, nav, footer, header, svg').forEach((el) => el.remove());
          bodyText = clone.textContent?.replace(/\s+/g, ' ').trim() || '';
        }

        const metaOgDesc = document.querySelector('meta[property="og:description"]')?.getAttribute('content');

        return {
          isListing: false,
          items: [],
          singleJob: {
            title,
            company,
            location,
            bodyText,
            metaOgDesc,
          },
        };
      }, urlStr);

      await browser.close();
      browser = null;

      if (batchData.isListing && batchData.items.length > 0) {
        return {
          isListing: true,
          jobs: batchData.items.map((it) => ({
            title: it.title,
            company: it.company || safeUrl.hostname,
            location: it.location || undefined,
            sourceUrl: cleanJobUrl(it.link, urlStr),
            rawText: it.description,
          })),
          isAuthWall,
          warnings,
        };
      }

      if (batchData.singleJob) {
        let finalRawText = batchData.singleJob.bodyText;
        if (isAuthWall) {
          warnings.push('Situs ini menampilkan authwall/login.');
          if (batchData.singleJob.metaOgDesc) {
            finalRawText = `${batchData.singleJob.title}\n\n${batchData.singleJob.metaOgDesc}\n\n(Catatan: Halaman ini membatasi bot dengan login wall)`;
          }
        }

        return {
          isListing: false,
          jobs: [
            {
              title: batchData.singleJob.title,
              company: batchData.singleJob.company || safeUrl.hostname,
              location: batchData.singleJob.location || undefined,
              sourceUrl: cleanJobUrl(urlStr, urlStr),
              rawText: finalRawText,
            },
          ],
          isAuthWall,
          warnings,
        };
      }
    }
  } catch (err: any) {
    if (browser) {
      try {
        await browser.close();
      } catch {}
    }
    warnings.push(`Headless browser fallback: ${err?.message || 'Execution error'}`);
  }

  // Fallback to Web Reader
  return await scrapeWithWebReaderFallback(urlStr, safeUrl.hostname, warnings);
}

/**
 * Fallback Web Reader (Jina Reader & Direct Fetch)
 */
async function scrapeWithWebReaderFallback(
  urlStr: string,
  hostname: string,
  existingWarnings: string[]
): Promise<ScrapedBatchResult> {
  const warnings = [...existingWarnings];

  try {
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
        // Check if multiple job links exist in markdown
        const jobLinkRegex = /\[([^\]]+)\]\((https:\/\/[^)]*linkedin\.com\/jobs\/view\/[^)]+)\)/g;
        const matches = [...markdown.matchAll(jobLinkRegex)];

        if (matches.length >= 2) {
          const jobs: ScrapedJobItem[] = matches.slice(0, 25).map((m) => {
            const rawTitle = m[1].trim();
            const jobUrl = m[2].split('?')[0]; // clean link
            return {
              title: rawTitle,
              company: hostname,
              sourceUrl: jobUrl,
              rawText: `Job Posting: ${rawTitle}\nDirect Link: ${jobUrl}\nSource: ${urlStr}`,
            };
          });

          return {
            isListing: true,
            jobs,
            isAuthWall: false,
            warnings,
          };
        }

        const titleMatch = markdown.match(/^#\s+(.+)$/m) || markdown.match(/Title:\s*(.+)/i);
        const title = titleMatch ? titleMatch[1].trim() : `Job Posting from ${hostname}`;

        return {
          isListing: false,
          jobs: [
            {
              title,
              company: hostname,
              sourceUrl: urlStr,
              rawText: markdown,
            },
          ],
          isAuthWall: markdown.toLowerCase().includes('authwall'),
          warnings,
        };
      }
    }
  } catch {
    warnings.push('Web reader proxy fallback failed; attempting direct fetch.');
  }

  // Final direct fetch
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
    isListing: false,
    jobs: [
      {
        title,
        company: hostname,
        sourceUrl: urlStr,
        rawText: html,
      },
    ],
    isAuthWall: html.includes('authwall'),
    warnings,
  };
}
