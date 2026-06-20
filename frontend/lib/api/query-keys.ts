export const qk = {
  me: ["me"] as const,
  dashboard: ["dashboard"] as const,
  patients: {
    list: () => ["patients"] as const,
    detail: (id: string) => ["patients", id] as const,
  },
  appointments: {
    list: () => ["appointments"] as const,
    detail: (id: string) => ["appointments", id] as const,
  },
  reports: {
    list: () => ["reports"] as const,
    detail: (id: string) => ["reports", id] as const,
  },
  templates: {
    list: () => ["templates"] as const,
    detail: (id: string) => ["templates", id] as const,
  },
  transcripts: {
    list: (patientId?: string) =>
      patientId ? (["transcripts", patientId] as const) : (["transcripts"] as const),
    detail: (id: string) => ["transcripts", "detail", id] as const,
  },
  notifications: ["notifications"] as const,
};
