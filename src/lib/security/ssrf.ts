import dns from 'dns/promises';

/**
 * Checks if an IP address belongs to private/reserved ranges (SSRF protection)
 */
export function isPrivateIp(ip: string): boolean {
  // IPv4 checks
  const ipv4Parts = ip.split('.').map(Number);
  if (ipv4Parts.length === 4 && ipv4Parts.every((p) => !isNaN(p) && p >= 0 && p <= 255)) {
    const [b1, b2] = ipv4Parts;
    // 0.0.0.0/8 (Broadcast/Local)
    if (b1 === 0) return true;
    // 10.0.0.0/8 (Private)
    if (b1 === 10) return true;
    // 127.0.0.0/8 (Loopback)
    if (b1 === 127) return true;
    // 169.254.0.0/16 (Link-local & Cloud Metadata 169.254.169.254)
    if (b1 === 169 && b2 === 254) return true;
    // 172.16.0.0/12 (Private)
    if (b1 === 172 && b2 >= 16 && b2 <= 31) return true;
    // 192.168.0.0/16 (Private)
    if (b1 === 192 && b2 === 168) return true;
    // 224.0.0.0/4 (Multicast)
    if (b1 >= 224) return true;
  }

  // IPv6 checks
  const lowerIp = ip.toLowerCase();
  if (
    lowerIp === '::1' ||
    lowerIp === '::' ||
    lowerIp.startsWith('fc') ||
    lowerIp.startsWith('fd') ||
    lowerIp.startsWith('fe80')
  ) {
    return true;
  }

  return false;
}

/**
 * Validates a target URL against SSRF vulnerabilities before fetching.
 * Returns the validated URL or throws an error.
 */
export async function validateSafeUrl(rawUrl: string): Promise<URL> {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error('URL format is invalid.');
  }

  // Scheme must be strictly http or https
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error('Only HTTP and HTTPS URLs are allowed.');
  }

  const hostname = parsed.hostname.toLowerCase();

  // Block localhost and common metadata hostnames
  if (
    hostname === 'localhost' ||
    hostname.endsWith('.localhost') ||
    hostname === 'metadata.google.internal' ||
    hostname === 'metadata'
  ) {
    throw new Error('Access to local/internal network hosts is prohibited.');
  }

  // Check if hostname is directly an IP
  if (isPrivateIp(hostname)) {
    throw new Error('Access to private/internal IP addresses is prohibited.');
  }

  // Resolve DNS to verify the underlying IPs
  try {
    const addresses = await dns.lookup(hostname, { all: true });
    for (const addr of addresses) {
      if (isPrivateIp(addr.address)) {
        throw new Error(`Hostname resolved to a restricted IP (${addr.address}).`);
      }
    }
  } catch (err: unknown) {
    if (err instanceof Error && err.message.includes('restricted IP')) {
      throw err;
    }
    // DNS resolution failure
    throw new Error(`Failed to resolve host ${hostname}: DNS lookup failed.`);
  }

  return parsed;
}

/**
 * Safely fetches an untrusted web page with SSRF safeguards, timeout, and response size limits.
 */
export async function safeFetchHtml(rawUrl: string): Promise<string> {
  const safeUrl = await validateSafeUrl(rawUrl);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000); // 12 seconds timeout

  try {
    const response = await fetch(safeUrl.toString(), {
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 JobSearchAssistantBot/1.0',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9,id;q=0.8',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('text/html') && !contentType.includes('text/plain')) {
      throw new Error(`Unsupported content type: ${contentType}. Expected HTML or text.`);
    }

    // Limit maximum response size to 3MB
    const text = await response.text();
    if (text.length > 3 * 1024 * 1024) {
      return text.slice(0, 3 * 1024 * 1024);
    }
    return text;
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    if (err instanceof Error) {
      if (err.name === 'AbortError') {
        throw new Error('Connection timed out while fetching the job posting URL.');
      }
      throw err;
    }
    throw new Error('Unknown error fetching job posting.');
  }
}
