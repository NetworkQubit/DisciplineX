export type MetricCard = {
  label: string;
  value: string;
  trend: string;
};

export type Profile = {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  bio: string;
  studyGoalMinutes: number;
  totalStudySeconds: number;
  streak: number;
  level: number;
  xp: number;
  preferences: {
    theme: "light" | "dark" | "system";
    websiteBlockingEnabled: boolean;
    pomodoroFocusMinutes: number;
    pomodoroBreakMinutes: number;
  };
};

export type AuthUser = {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  studyGoalMinutes: number;
};

export type AuthResponse = {
  token: string;
  user: AuthUser;
};

export type Subject = {
  id: string;
  _id?: string;
  name: string;
  color: string;
  goalMinutes: number;
  icon?: string;
  studiedMinutes?: number;
};

export type Task = {
  id: string;
  _id?: string;
  title: string;
  completed: boolean;
  priority: "low" | "medium" | "high";
  subject?: {
    _id?: string;
    name: string;
    color: string;
  } | null;
  status?: "todo" | "in_progress" | "done";
  position?: number;
};

export type Session = {
  id: string;
  _id?: string;
  mode: "standard" | "pomodoro" | "focus";
  startedAt: string;
  endedAt?: string | null;
  durationSeconds: number;
  isActive: boolean;
  isPaused: boolean;
  subject?: {
    _id?: string;
    name: string;
    color: string;
  } | null;
};

export type CalendarBlock = {
  id: string;
  _id?: string;
  title: string;
  type: "class" | "study" | "task" | "personal";
  source: "manual" | "auto";
  startAt: string;
  endAt: string;
  recurrence?: {
    frequency: "daily" | "weekly";
    interval: number;
    count: number;
    seriesId: string;
  } | null;
  subject?: {
    _id?: string;
    name: string;
    color: string;
  } | null;
};

export type HeatmapCell = {
  date: string;
  minutes?: number;
  intensity: number;
};

export type WorkspaceAnalytics = {
  overview: {
    todayMinutes: number;
    weekMinutes: number;
    monthMinutes: number;
    focusScore: number;
    productivityScore: number;
    bestStudyTimeLabel: string;
  };
  heatmap: HeatmapCell[];
  subjectBreakdown: Array<{
    name: string;
    minutes: number;
    color: string;
  }>;
  dailyTrend: Array<{ label: string; minutes: number }>;
  weeklyTrend: Array<{ label: string; minutes: number }>;
  monthlyTrend: Array<{ label: string; minutes: number }>;
  weeklyReport: {
    totalHours: number;
    bestDayLabel: string;
    weakestDayLabel: string;
    suggestions: string[];
    days: Array<{ label: string; minutes: number }>;
  };
  focusDna: {
    title: string;
    summary: string;
    bestTimeOfDay: string;
    averageFocusMinutes: number;
    favoriteSubjects: Array<{
      name: string;
      minutes: number;
      color: string;
    }>;
    quote: string;
  };
};

export type WorkspaceData = {
  profile: Profile;
  subjects: Subject[];
  tasks: Task[];
  sessions: Session[];
  calendarBlocks: CalendarBlock[];
  analytics: WorkspaceAnalytics;
  activeSession: Session | null;
};
