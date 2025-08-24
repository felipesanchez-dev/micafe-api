export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: {
    code: string;
    detail?: string;
    requestId?: string;
    suggestions?: string[];
  };
  timestamp: string;
  version: string;
  author: string;
  github: string;
}

export interface ApiMetadata {
  name: string;
  version: string;
  description: string;
  author: string;
  github: string;
  endpoints: {
    [key: string]: string;
  };
  status: string;
  retrySystem: string;
  timestamp: string;
}

export interface ServiceStatus {
  status: string;
  uptime: number;
  timestamp: string;
  version: string;
  lastScrapeAttempt?: string;
  lastSuccessfulScrape?: string;
  cacheStats?: {
    size: number;
    keys: string[];
  };
}
