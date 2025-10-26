import { headers } from 'next/headers';

/**
 * Gets the IP address of the incoming request.
 * Tries to read from common proxy headers first, falling back to the direct connection IP.
 * @returns The IP address string or null if not found.
 */
export function getRequestIp(): string | null {
  const headersList = headers();
  
  // List of headers to check in order of preference
  const ipHeaderOrder = [
    'x-forwarded-for',
    'x-real-ip',
    'cf-connecting-ip', // Cloudflare
    'fastly-client-ip', // Fastly
    'true-client-ip',   // Akamai
    'x-client-ip',
    'x-cluster-client-ip',
    'forwarded-for',
    'forwarded',
    'via',
    'remote-addr'
  ];

  for (const header of ipHeaderOrder) {
    const ip = headersList.get(header);
    if (ip) {
      // The 'x-forwarded-for' header can contain a comma-separated list of IPs.
      // The client's IP is typically the first one.
      return ip.split(',')[0].trim();
    }
  }

  return null;
} 