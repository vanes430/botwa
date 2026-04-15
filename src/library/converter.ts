function toUpperCase(text: string): string {
  return text.toUpperCase();
}

function toLowerCase(text: string): string {
  return text.toLowerCase();
}

function toTitleCase(text: string): string {
  return text
    .split(" ")
    .map((word: string): string => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function reverseString(text: string): string {
  return text.split("").reverse().join("");
}

function randomElement<T>(array: T[]): T {
  if (array.length === 0) {
    throw new Error("Array must not be empty");
  }
  const index = Math.floor(Math.random() * array.length);
  const element = array[index];
  if (element === undefined) {
    throw new Error("Unexpected empty slot in array");
  }
  return element;
}

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  }
  return `${seconds}s`;
}

function formatNumber(num: number): string {
  return new Intl.NumberFormat("id-ID").format(num);
}

function parseMention(text: string): string[] {
  const mentions = text.match(/@(\d+)/g);
  if (mentions === null) {
    return [];
  }
  return mentions.map((mention: string): string => `${mention.replace("@", "")}@s.whatsapp.net`);
}

export const converter = {
  toUpperCase,
  toLowerCase,
  toTitleCase,
  reverseString,
  randomElement,
  formatDuration,
  formatNumber,
  parseMention,
};
