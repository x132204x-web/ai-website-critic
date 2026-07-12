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

export type JourneyAction = "goto" | "click" | "fill" | "waitFor" | "assertText" | "screenshot";

export interface JourneyStepSpec {
  name: string;
  action: JourneyAction;
  selector?: string;
  value?: string;
  valueFromEnv?: string;
  path?: string;
  text?: string;
  note?: string;
}

export interface JourneySpec {
  name: string;
  persona: string;
  scenario: string;
  goal: string;
  successCriteria: string[];
  viewport?: ViewportName;
  steps: JourneyStepSpec[];
}

export interface JourneyStepResult {
  index: number;
  name: string;
  action: JourneyAction;
  status: "completed" | "failed" | "skipped";
  startedAt: string;
  durationMs: number;
  url: string;
  title?: string;
  screenshot?: string;
  note?: string;
  error?: string;
}

export interface JourneyResult {
  spec: Omit<JourneySpec, "steps">;
  startedAt: string;
  completedAt: string;
  status: "completed" | "failed";
  steps: JourneyStepResult[];
  consoleIssues: ConsoleIssue[];
  requestFailures: RequestFailure[];
}
