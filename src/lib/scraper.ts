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
 * Normalizes input URL (auto-adds https:// if missing)
 */
export function normalizeUserUrl(rawUrl: string): string {
  let url = rawUrl.trim();
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = `https://${url}`;
  }
  return url;
}

/**
 * Checks if target URL is just a generic homepage without job details or search queries.
 * Distinguishes major public portals from company career pages.
 */
export function isGenericHomepage(rawUrl: string): boolean {
  try {
    const parsed = new URL(normalizeUserUrl(rawUrl));
    const host = parsed.hostname.toLowerCase().replace(/^www\./, '');
    const path = parsed.pathname.replace(/\/+$/, '');

    // Major public job aggregator portals
    const majorJobBoards = [
      'linkedin.com',
      'glints.com',
      'jobstreet.com',
      'jobstreet.co.id',
      'id.jobstreet.com',
      'indeed.com',
      'id.indeed.com',
      'kalibrr.com',
    ];

    const isMajorBoard = majorJobBoards.some((b) => host === b || host.endsWith('.' + b));

    if (isMajorBoard) {
      // If root path or plain /jobs without search parameter
      if ((path === '' || path === '/' || path === '/jobs' || path === '/jobs/') && !parsed.search) {
        return true;
      }
    }

    return false;
  } catch {
    return false;
  }
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
 * Clean URL parameters (strips tracking query strings while keeping essential identifiers)
 */
function cleanJobUrl(rawUrl: string, baseUrl: string): string {
  try {
    const parsed = new URL(rawUrl, baseUrl);
    const host = parsed.hostname.toLowerCase();

    // Preserve clean path for LinkedIn, Glints, JobStreet, Indeed
    if (host.includes('linkedin.com') || host.includes('glints.com') || host.includes('jobstreet.') || host.includes('lever.co') || host.includes('greenhouse.io') || host.includes('ashbyhq.com')) {
      return new URL(parsed.origin + parsed.pathname).toString();
    }

    // For Indeed or other query-based URLs
    if (host.includes('indeed.')) {
      const jk = parsed.searchParams.get('jk');
      if (jk) {
        return `${parsed.origin}/viewjob?jk=${jk}`;
      }
    }

    return parsed.toString();
  } catch {
    return rawUrl;
  }
}

/**
 * Headless Browser Scraper for Single Jobs & Multi-Job Search Listings across:
 * - LinkedIn
 * - Glints
 * - JobStreet
 * - Indeed
 * - Kalibrr
 * - Company Career Portals & ATS (Greenhouse, Lever, Ashby, Workday, SmartRecruiters, etc.)
 */
export async function scrapeJobWithHeadlessBrowser(targetUrl: string): Promise<ScrapedBatchResult> {
  const normalized = normalizeUserUrl(targetUrl);

  if (isGenericHomepage(normalized)) {
    throw new Error(
      'URL yang dimasukkan adalah halaman utama portal (bukan lowongan spesifik atau hasil pencarian). Silakan gunakan form Pencarian Otomatis atau masukkan link spesifik/hasil pencarian.'
    );
  }

  const safeUrl = await validateSafeUrl(normalized);
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
          ? [
              '--no-sandbox',
              '--disable-setuid-sandbox',
              '--disable-dev-shm-usage',
              '--window-size=1280,900',
              '--disable-blink-features=AutomationControlled',
            ]
          : [...chromium.args, '--no-sandbox', '--disable-setuid-sandbox'],
        defaultViewport: { width: 1280, height: 900 },
        executablePath,
        headless: true,
      });

      const page = await browser.newPage();

      await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
      );
      await page.setExtraHTTPHeaders({
        'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      });

      // Avoid waiting indefinitely on media/analytics trackers
      await page.goto(urlStr, {
        waitUntil: 'domcontentloaded',
        timeout: 25000,
      });

      // Allow JavaScript frameworks (Next.js, React, Vue) to mount and render cards
      await new Promise((resolve) => setTimeout(resolve, 3500));

      const pageUrl = page.url();
      const isAuthWall =
        pageUrl.includes('/authwall') ||
        pageUrl.includes('/checkpoint') ||
        pageUrl.includes('/captcha');

      // Comprehensive DOM Inspection for Multi-Job Listings or Single Detailed Job
      const batchData = await page.evaluate((currentUrl) => {
        // --- 1. DETECT MULTI-JOB LISTING / SEARCH RESULTS ---
        const portalListingItems: Array<{
          title: string;
          company: string;
          location: string;
          link: string;
          description: string;
        }> = [];

        // GLINTS SEARCH LISTING
        const glintsLinks = Array.from(document.querySelectorAll('a[href*="/opportunities/jobs/"]'));
        if (glintsLinks.length >= 2) {
          const seenGlintsLinks = new Set<string>();

          for (const a of glintsLinks) {
            const cleanHref = (a as HTMLAnchorElement).href.split('?')[0];
            if (!cleanHref || seenGlintsLinks.has(cleanHref)) continue;
            seenGlintsLinks.add(cleanHref);

            // Navigate up to card wrapper
            let card: Element | null =
              a.closest('[class*="CompactJobCard"], [class*="JobCardWrapper"], [class*="job-search-results_job-card"]') ||
              a.parentElement?.parentElement?.parentElement?.parentElement ||
              a;

            const title =
              (a as HTMLElement).innerText?.trim() ||
              card.querySelector('h2, h3, [class*="JobTitle"]')?.textContent?.trim() ||
              '';

            const compEl = card.querySelector('a[href*="/companies/"], [class*="Company"]');
            let company = compEl?.textContent?.trim() || 'Glints Partner Employer';

            const locEl = card.querySelector('[class*="Location"], [class*="location"]');
            const lines = ((card as HTMLElement).innerText || '').split('\n').map((s) => s.trim()).filter(Boolean);
            const location = locEl?.textContent?.trim() || (lines.length > 2 ? lines[lines.length - 1] : 'Indonesia');

            if (location && company.endsWith(location)) {
              company = company.slice(0, -location.length).trim();
            }

            const salMatch = ((card as HTMLElement).innerText || '').match(/Rp\s*[\d\-.,]+(?:jt|\s*juta|\s*rb)?/i);
            const salary = salMatch ? salMatch[0] : '';

            const snippet = (card as HTMLElement).innerText?.replace(/\s+/g, ' ').trim() || '';

            if (title && title.length > 2) {
              portalListingItems.push({
                title,
                company,
                location,
                link: cleanHref,
                description: `Posisi: ${title}\nPerusahaan: ${company}\nLokasi: ${location}\n${salary ? 'Gaji: ' + salary + '\n' : ''}Portal: Glints\nLink Lamaran: ${cleanHref}\n\nDetail:\n${snippet}`,
              });
            }
          }
        }

        // JOBSTREET SEARCH LISTING
        if (portalListingItems.length < 2) {
          const jobstreetCards = Array.from(
            document.querySelectorAll('article[data-card-type="JobCard"], article[data-job-id], article')
          );

          if (jobstreetCards.length >= 2) {
            for (const card of jobstreetCards) {
              const titleEl = card.querySelector('a[data-automation="jobTitle"], [data-automation="job-card-title"], h3 a, h2 a, a[href*="/job/"]');
              const companyEl = card.querySelector('[data-automation="jobCompany"], a[href*="-jobs"]');
              const locationEl = card.querySelector('[data-automation="jobLocation"]');

              const title = titleEl?.textContent?.trim() || '';
              const link = (titleEl as HTMLAnchorElement)?.href || (card.querySelector('a') as HTMLAnchorElement)?.href || '';
              const company = companyEl?.textContent?.trim() || '';
              const location = locationEl?.textContent?.trim() || '';
              const snippet = card.textContent?.replace(/\s+/g, ' ').trim() || '';

              if (title && link) {
                portalListingItems.push({
                  title,
                  company,
                  location,
                  link,
                  description: `Posisi: ${title}\nPerusahaan: ${company || 'Perusahaan'}\nLokasi: ${location}\nPortal: JobStreet\nLink Lamaran: ${link}\n\nDetail Singkat:\n${snippet}`,
                });
              }
            }
          }
        }

        // LINKEDIN SEARCH LISTING
        if (portalListingItems.length < 2) {
          const linkedinCards = Array.from(
            document.querySelectorAll('ul.jobs-search__results-list li, .base-card, .job-search-card, [data-entity-urn*="jobPosting"]')
          );

          if (linkedinCards.length >= 2) {
            for (const card of linkedinCards) {
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
                portalListingItems.push({
                  title,
                  company,
                  location,
                  link,
                  description: `Posisi: ${title}\nPerusahaan: ${company || 'Company'}\nLokasi: ${location}\nPortal: LinkedIn\nLink Lamaran: ${link}\n\nRingkasan:\n${snippet}`,
                });
              }
            }
          }
        }

        // INDEED SEARCH LISTING
        if (portalListingItems.length < 2) {
          const indeedCards = Array.from(document.querySelectorAll('.job_seen_beacon, td.resultContent, div.jobsearch-SerpJobCard'));
          if (indeedCards.length >= 2) {
            for (const card of indeedCards) {
              const titleEl = card.querySelector('h2.jobTitle a, a[id^="job_"], a.jcs-JobTitle');
              const companyEl = card.querySelector('[data-testid="company-name"], .companyName');
              const locationEl = card.querySelector('[data-testid="text-location"], .companyLocation');

              const title = titleEl?.textContent?.trim() || '';
              const link = (titleEl as HTMLAnchorElement)?.href || '';
              const company = companyEl?.textContent?.trim() || '';
              const location = locationEl?.textContent?.trim() || '';
              const snippet = card.textContent?.replace(/\s+/g, ' ').trim() || '';

              if (title && link) {
                portalListingItems.push({
                  title,
                  company,
                  location,
                  link,
                  description: `Posisi: ${title}\nPerusahaan: ${company}\nLokasi: ${location}\nPortal: Indeed\nLink Lamaran: ${link}\n\nDetail:\n${snippet}`,
                });
              }
            }
          }
        }

        // COMPANY CAREER / ATS LISTING (Greenhouse, Lever, Ashby, Workday, SmartRecruiters, or Custom)
        if (portalListingItems.length < 2) {
          const atsPostings = Array.from(
            document.querySelectorAll(
              '.opening, tr.job, .posting, [data-testid*="job-posting"], [data-automation-id="jobSearchResult"], .opening-job, .career-item, .job-item'
            )
          );

          if (atsPostings.length >= 2) {
            for (const el of atsPostings) {
              const linkEl = el.querySelector('a') || (el.tagName === 'A' ? (el as HTMLAnchorElement) : null);
              const titleEl = el.querySelector('h2, h3, h4, .posting-title, [data-automation-id="jobTitle"]') || linkEl;
              const locationEl = el.querySelector('.location, .workplaceTypes, [data-automation-id="jobPostingLocation"]');
              const deptEl = el.querySelector('.department, .posting-category');

              const title = titleEl?.textContent?.trim() || '';
              const link = (linkEl as HTMLAnchorElement)?.href || '';
              const location = locationEl?.textContent?.trim() || '';
              const dept = deptEl?.textContent?.trim() || '';

              if (title && link) {
                portalListingItems.push({
                  title,
                  company: document.title.split(/[-|•]/)[0].trim() || '',
                  location: location || dept,
                  link,
                  description: `Posisi: ${title}\nDepartemen/Kategori: ${dept}\nLokasi: ${location}\nSumber: Career Portal (${link})`,
                });
              }
            }
          }
        }

        // If Multi-Job Listing was confirmed (up to 30 items)
        if (portalListingItems.length >= 2) {
          return {
            isListing: true,
            items: portalListingItems.slice(0, 30),
            singleJob: null,
          };
        }

        // --- 2. SINGLE JOB DETAILED EXTRACTION (HIGH-FIDELITY / MENYELURUH) ---

        // A. Extract Schema.org JobPosting JSON-LD (Standard for Glints, JobStreet, Lever, Greenhouse, etc.)
        let jsonLdJob: any = null;
        const jsonLdScripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));
        for (const script of jsonLdScripts) {
          try {
            const parsed = JSON.parse(script.textContent || '');
            const candidates = Array.isArray(parsed) ? parsed : parsed['@graph'] ? parsed['@graph'] : [parsed];
            for (const cand of candidates) {
              if (cand && (cand['@type'] === 'JobPosting' || cand['@type']?.includes?.('JobPosting'))) {
                jsonLdJob = cand;
                break;
              }
            }
            if (jsonLdJob) break;
          } catch {}
        }

        // Extract metadata & title
        const metaOgTitle = document.querySelector('meta[property="og:title"]')?.getAttribute('content');
        const h1 = document.querySelector('h1')?.textContent?.trim();
        const docTitle = document.title?.trim();
        const title = jsonLdJob?.title || metaOgTitle || h1 || docTitle || 'Job Opportunity';

        // Extract company
        const metaOgSite = document.querySelector('meta[property="og:site_name"]')?.getAttribute('content');
        const companyEl =
          document.querySelector('[data-automation="jobCompany"]') ||
          document.querySelector('a[href*="/companies/"]') ||
          document.querySelector('[data-company-name="true"]') ||
          document.querySelector('.topcard__org-name-link') ||
          document.querySelector('.employer-name') ||
          document.querySelector('.posting-headline h2');
        const company =
          jsonLdJob?.hiringOrganization?.name ||
          (typeof jsonLdJob?.hiringOrganization === 'string' ? jsonLdJob.hiringOrganization : null) ||
          companyEl?.textContent?.trim() ||
          metaOgSite ||
          '';

        // Extract location
        let location = '';
        if (jsonLdJob?.jobLocation) {
          const addr = Array.isArray(jsonLdJob.jobLocation) ? jsonLdJob.jobLocation[0]?.address : jsonLdJob.jobLocation?.address;
          if (typeof addr === 'string') {
            location = addr;
          } else if (addr) {
            location = [addr.addressLocality, addr.addressRegion, addr.addressCountry].filter(Boolean).join(', ');
          }
        }
        if (!location) {
          const locEl =
            document.querySelector('[data-automation="jobLocation"]') ||
            document.querySelector('.topcard__flavor--bullet') ||
            document.querySelector('[data-location="true"]') ||
            document.querySelector('.location') ||
            document.querySelector('[data-automation-id="jobPostingLocation"]');
          location = locEl?.textContent?.trim() || '';
        }

        // Extract salary if available
        let salaryText = '';
        if (jsonLdJob?.baseSalary) {
          const curr = jsonLdJob.baseSalary.currency || '';
          const val = jsonLdJob.baseSalary.value;
          if (val) {
            if (typeof val === 'number') salaryText = `${curr} ${val.toLocaleString()}`;
            else if (val.minValue && val.maxValue) {
              salaryText = `${curr} ${val.minValue.toLocaleString()} - ${val.maxValue.toLocaleString()}`;
            } else if (val.value) {
              salaryText = `${curr} ${val.value.toLocaleString()}`;
            }
            if (val.unitText) salaryText += ` / ${val.unitText}`;
          }
        }

        // Extract detailed description text
        const descriptionSelectors = [
          '[data-automation="jobDescription"]',
          '[data-automation="jobDetails"]',
          '[class*="JobDescription"]',
          '.show-more-less-html__markup',
          '#job-details',
          '.job-description',
          '[data-automation-id="jobPostingDescription"]',
          '.section-wrapper',
          '#content',
          'article',
          'main',
          '[role="main"]',
          '.description',
        ];

        let detailedBody = '';

        // If JSON-LD description is rich HTML
        if (jsonLdJob?.description && jsonLdJob.description.length > 100) {
          const temp = document.createElement('div');
          temp.innerHTML = jsonLdJob.description;
          detailedBody = temp.innerText || temp.textContent || '';
        }

        if (!detailedBody || detailedBody.length < 150) {
          for (const sel of descriptionSelectors) {
            const el = document.querySelector(sel);
            if (el && el.textContent && el.textContent.trim().length > 150) {
              // Convert bullet points and paragraph breaks into readable structured text
              detailedBody = (el as HTMLElement).innerText || el.textContent.trim();
              break;
            }
          }
        }

        if (!detailedBody || detailedBody.length < 150) {
          const clone = document.body.cloneNode(true) as HTMLElement;
          clone.querySelectorAll('script, style, noscript, nav, footer, header, svg, iframe').forEach((el) => el.remove());
          detailedBody = clone.innerText?.replace(/\s+/g, ' ').trim() || '';
        }

        // Build comprehensive structured body
        const metaOgDesc = document.querySelector('meta[property="og:description"]')?.getAttribute('content');
        const sections: string[] = [];

        sections.push(`POSISI / JOB TITLE: ${title}`);
        if (company) sections.push(`PERUSAHAAN: ${company}`);
        if (location) sections.push(`LOKASI & KEBIJAKAN KERJA: ${location}`);
        if (salaryText) sections.push(`RENTANG GAJI: ${salaryText}`);
        if (jsonLdJob?.employmentType) sections.push(`TIPE PEKERJAAN: ${jsonLdJob.employmentType}`);
        sections.push(`SUMBER LINK: ${currentUrl}`);

        if (detailedBody) {
          sections.push(`\n=== DESKRIPSI LENGKAP & PERSYARATAN PEKERJAAN ===\n${detailedBody}`);
        } else if (metaOgDesc) {
          sections.push(`\n=== RINGKASAN DESKRIPSI ===\n${metaOgDesc}`);
        }

        return {
          isListing: false,
          items: [],
          singleJob: {
            title,
            company,
            location,
            salaryText,
            bodyText: sections.join('\n'),
            metaOgDesc,
          },
        };
      }, urlStr);

      await browser.close();
      browser = null;

      // Handle multi-job listing results
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

      // Handle single job results
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

  // Fallback to Web Reader (Jina Reader & Multi-Portal Regex Parser)
  return await scrapeWithWebReaderFallback(urlStr, safeUrl.hostname, warnings);
}

/**
 * Fallback Web Reader (Jina Reader with Multi-Portal Regex Extraction)
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
    const timeout = setTimeout(() => controller.abort(), 16000);

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
        // 1. LinkedIn Search Listing Parser
        const linkedinRegex =
          /\[([^\]]+)\]\((https:\/\/[^)]*linkedin\.com\/jobs\/view\/[^)]+)\)[\s\S]*?####\s*\[([^\]]+)\][^\n]*\n\s*([^\n]+)/g;
        const linkedinMatches = [...markdown.matchAll(linkedinRegex)];

        if (linkedinMatches.length >= 2) {
          const jobs: ScrapedJobItem[] = linkedinMatches.slice(0, 30).map((m) => {
            const rawTitle = m[1].trim();
            const jobUrl = m[2].split('?')[0];
            const company = m[3].trim();
            const rawLocation = m[4].replace(/Actively Hiring|\d+\s+(day|week|month|hour)s?\s+ago/gi, '').trim();

            return {
              title: rawTitle,
              company,
              location: rawLocation || undefined,
              sourceUrl: jobUrl,
              rawText: `Posisi: ${rawTitle}\nPerusahaan: ${company}\nLokasi: ${rawLocation}\nPortal: LinkedIn\nLink Lowongan: ${jobUrl}\nSumber: ${urlStr}`,
            };
          });

          return {
            isListing: true,
            jobs,
            isAuthWall: false,
            warnings,
          };
        }

        // 2. Glints Search Listing Parser
        const glintsRegex = /\[([^\]]+)\]\((https:\/\/[^)]*glints\.com\/[^)]*\/opportunities\/jobs\/[^)]+)\)/g;
        const glintsMatches = [...markdown.matchAll(glintsRegex)];

        if (glintsMatches.length >= 2) {
          const jobs: ScrapedJobItem[] = glintsMatches.slice(0, 30).map((m) => {
            const rawTitle = m[1].trim();
            const jobUrl = m[2].split('?')[0];
            return {
              title: rawTitle,
              company: 'Glints Partner Employer',
              sourceUrl: jobUrl,
              rawText: `Posisi: ${rawTitle}\nPerusahaan: Glints Partner Employer\nPortal: Glints\nLink Lowongan: ${jobUrl}\nSumber: ${urlStr}`,
            };
          });

          return {
            isListing: true,
            jobs,
            isAuthWall: false,
            warnings,
          };
        }

        // 3. JobStreet Search Listing Parser
        const jobstreetRegex = /\[([^\]]+)\]\((https:\/\/[^)]*jobstreet\.com[^)]*\/job\/[^)]+)\)/g;
        const jobstreetMatches = [...markdown.matchAll(jobstreetRegex)];

        if (jobstreetMatches.length >= 2) {
          const jobs: ScrapedJobItem[] = jobstreetMatches.slice(0, 30).map((m) => {
            const rawTitle = m[1].trim();
            const jobUrl = m[2].split('?')[0];
            return {
              title: rawTitle,
              company: hostname,
              sourceUrl: jobUrl,
              rawText: `Posisi: ${rawTitle}\nPortal: JobStreet\nLink Lowongan: ${jobUrl}\nSumber: ${urlStr}`,
            };
          });

          return {
            isListing: true,
            jobs,
            isAuthWall: false,
            warnings,
          };
        }

        // 4. General Career/ATS Links Parser
        const genericJobRegex =
          /\[([^\]]{3,80})\]\((https:\/\/[^)]*(?:greenhouse\.io|lever\.co|ashbyhq\.com|myworkdayjobs\.com|\/jobs\/|\/careers\/)[^)]+)\)/gi;
        const genericMatches = [...markdown.matchAll(genericJobRegex)];

        if (genericMatches.length >= 2) {
          const jobs: ScrapedJobItem[] = genericMatches.slice(0, 30).map((m) => {
            const rawTitle = m[1].trim();
            const jobUrl = m[2].split('?')[0];
            return {
              title: rawTitle,
              company: hostname,
              sourceUrl: jobUrl,
              rawText: `Posisi: ${rawTitle}\nPortal: Career ATS / Direct\nLink Lowongan: ${jobUrl}\nSumber: ${urlStr}`,
            };
          });

          return {
            isListing: true,
            jobs,
            isAuthWall: false,
            warnings,
          };
        }

        // Single Job Fallback from Markdown
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
