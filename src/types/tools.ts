export enum ToolName {
  NONE = '',
  GET_CURRENT_TIME = 'get_current_time',
  CALCULATE = 'calculate',
  SEARCH_WEB = 'search_web',
  SCRAPE_WEBSITE = 'scrape_website',
}

export interface ToolParameter {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description: string;
  enum?: string[];
  items?: ToolParameter;
  properties?: Record<string, ToolParameter>;
  required?: string[];
}

export interface ToolDefinition {
  name: ToolName;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, ToolParameter>;
    required?: string[];
  };
}

export interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: ToolName;
    arguments: string; // JSON string
  };
}

export interface ToolResult {
  toolCallId: string;
  result: unknown;
  error?: string;
}

export interface ToolMessage {
  role: 'tool';
  content: string;
  tool_call_id: string;
  name: string;
}

// Built-in tool definitions
export const BUILT_IN_TOOLS: ToolDefinition[] = [
  {
    name: ToolName.GET_CURRENT_TIME,
    description: 'Get the current date and time',
    parameters: {
      type: 'object',
      properties: {
        timezone: {
          type: 'string',
          description:
            'The timezone to get the time for (e.g., "UTC", "America/New_York")',
        },
      },
      required: [],
    },
  },
  {
    name: ToolName.CALCULATE,
    description: 'Perform mathematical calculations',
    parameters: {
      type: 'object',
      properties: {
        expression: {
          type: 'string',
          description:
            'The mathematical expression to evaluate (e.g., "2 + 2", "sqrt(16)")',
        },
      },
      required: ['expression'],
    },
  },
  {
    name: ToolName.SEARCH_WEB,
    description: 'Search the web for information using the Brave search API',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'The search query to execute',
        },
        count: {
          type: 'number',
          description:
            'The number of search results to return (default: 5, max: 10)',
        },
      },
      required: ['query'],
    },
  },
  {
    name: ToolName.SCRAPE_WEBSITE,
    description: 'Extract content from a website URL',
    parameters: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'The URL of the website to scrape',
        },
      },
      required: ['url'],
    },
  },
];
