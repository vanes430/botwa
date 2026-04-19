/**
 * Jeda eksekusi selama ms milidetik.
 */
export async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Menghasilkan angka acak antara min dan max.
 */
export function getRandomDelay(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1) + min);
}
