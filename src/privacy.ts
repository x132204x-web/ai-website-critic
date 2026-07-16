const ANSI_PATTERN = /[\u001B\u009B][[\]()#;?]*(?:(?:[a-zA-Z\d]*(?:;[-a-zA-Z\d\/#&.:=?%@~_]+)*)?\u0007|(?:(?:\d{1,4}(?:[;:]\d{0,4})*)?[\dA-PR-TZcf-nq-uy=><~]))/g;

export function stripAnsi(value: string): string { return value.replace(ANSI_PATTERN, ""); }

export class Redactor {
  private readonly secrets = new Set<string>();
  add(value: string | undefined): void { if (value) this.secrets.add(value); }
  redact(value: string | undefined): string | undefined {
    if (value === undefined) return undefined;
    let result = stripAnsi(value);
    for (const secret of [...this.secrets].sort((a, b) => b.length - a.length)) {
      for (const variant of new Set([secret, encodeURIComponent(secret)])) result = result.split(variant).join("[REDACTED]");
    }
    return result;
  }
}

export function explainError(error: unknown, redactor = new Redactor()): string {
  const message = redactor.redact(error instanceof Error ? error.message : String(error)) ?? "Unknown error";
  if (/Timeout .*exceeded|timed out/i.test(message)) return `${message}\nHint: verify the locator and increase --timeout only if the page is genuinely slow.`;
  if (/Missing environment variable/i.test(message)) return `${message}\nHint: export the named variable before running the journey.`;
  if (/browser.*(missing|not found)|executable.*doesn.t exist/i.test(message)) return `${message}\nHint: run npx playwright install chromium.`;
  return message;
}
