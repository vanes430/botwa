interface ValidationResult {
  valid: boolean;
  errors: string[];
}

function validatePlugin(plugin: unknown, fileName: string): ValidationResult {
  const errors: string[] = [];

  if (plugin === null || typeof plugin !== "object") {
    return { valid: false, errors: [`${fileName}: export is not an object`] };
  }

  const mod = plugin as Record<string, unknown>;
  const cmd = mod.command;

  if (cmd === undefined) {
    return { valid: false, errors: [`${fileName}: no 'command' export`] };
  }

  if (typeof cmd !== "object" || cmd === null) {
    return { valid: false, errors: [`${fileName}: 'command' is not an object`] };
  }

  const p = cmd as Record<string, unknown>;

  // Required fields
  if (typeof p.name !== "string" || p.name.trim() === "") {
    errors.push("missing or invalid 'name' (must be non-empty string)");
  }

  if (typeof p.category !== "string" || p.category.trim() === "") {
    errors.push("missing or invalid 'category' (must be non-empty string)");
  }

  if (typeof p.description !== "string") {
    errors.push("missing 'description' (must be string)");
  }

  if (typeof p.execute !== "function") {
    errors.push("missing 'execute' (must be function)");
  }

  // Optional field type checks
  if (p.alias !== undefined && !Array.isArray(p.alias)) {
    errors.push("'alias' must be an array if provided");
  }

  if (p.isOwner !== undefined && typeof p.isOwner !== "boolean") {
    errors.push("'isOwner' must be boolean if provided");
  }

  if (p.isGroup !== undefined && typeof p.isGroup !== "boolean") {
    errors.push("'isGroup' must be boolean if provided");
  }

  return { valid: errors.length === 0, errors };
}

export type { ValidationResult };
export { validatePlugin };
