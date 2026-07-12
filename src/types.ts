export type ViewportName = "desktop" | "mobile";

export interface ConsoleIssue { type: string; text: string }
export interface RequestFailure { url: string; method: string; error: string }
export interface PageCapture {
  name: ViewportName;
  requestedUrl: string;
  finalUrl?: string;
  title?: string;
  viewport: { width: number; height: number; deviceScaleFactor: number; isMobile: boolean };
  screenshot?: string;
  consoleIssues: ConsoleIssue[];
  requestFailures: RequestFailure[];
  error?: string;
}

export interface LighthouseFinding {
  id: string;
  title: string;
  score: number | null;
  displayValue?: string;
  description?: string;
}

export interface LighthouseSummary {
  requestedUrl: string;
  finalUrl?: string;
  fetchedAt: string;
  scores: Record<string, number | null>;
  findings: LighthouseFinding[];
  error?: string;
}
