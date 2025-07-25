/**
 * Utility functions for processing template variables in system prompts
 */

export interface PromptVariables {
  date: string;
  time: string;
  datetime: string;
  timestamp: string;
  timezone: string;
  day: string;
  month: string;
  year: string;
  weekday: string;
  hour: string;
  minute: string;
  second: string;
  iso_date: string;
  iso_time: string;
  iso_datetime: string;
  unix_timestamp: string;
  user_agent: string;
  random_uuid: string;
}

/**
 * Generate all available template variables
 */
export function generatePromptVariables(userAgent?: string): PromptVariables {
  const now = new Date();
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  // Format options for different date/time representations
  const dateOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  };

  const timeOptions: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  };

  const datetimeOptions: Intl.DateTimeFormatOptions = {
    ...dateOptions,
    ...timeOptions,
  };

  // Generate a simple UUID v4
  const generateUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(
      /[xy]/g,
      function (c) {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      }
    );
  };

  return {
    date: now.toLocaleDateString('en-US', dateOptions),
    time: now.toLocaleTimeString('en-US', timeOptions),
    datetime: now.toLocaleString('en-US', datetimeOptions),
    timestamp: now.toLocaleString(),
    timezone: timeZone,
    day: now.getDate().toString().padStart(2, '0'),
    month: (now.getMonth() + 1).toString().padStart(2, '0'),
    year: now.getFullYear().toString(),
    weekday: now.toLocaleDateString('en-US', { weekday: 'long' }),
    hour: now.getHours().toString().padStart(2, '0'),
    minute: now.getMinutes().toString().padStart(2, '0'),
    second: now.getSeconds().toString().padStart(2, '0'),
    iso_date: now.toISOString().split('T')[0],
    iso_time: now.toISOString().split('T')[1].split('.')[0],
    iso_datetime: now.toISOString(),
    unix_timestamp: Math.floor(now.getTime() / 1000).toString(),
    user_agent: userAgent || 'Unknown',
    random_uuid: generateUUID(),
  };
}

/**
 * Process a system prompt template by substituting variables
 */
export function processSystemPromptTemplate(
  template: string,
  userAgent?: string
): string {
  if (!template) return template;

  const variables = generatePromptVariables(userAgent);

  // Replace template variables in the format {{ variable_name }}
  let processed = template;

  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
    processed = processed.replace(regex, value);
  });

  return processed;
}

/**
 * Get a list of all available template variables with descriptions
 */
export function getAvailableVariables(): Array<{
  name: string;
  description: string;
  example: string;
}> {
  const variables = generatePromptVariables();

  return [
    {
      name: 'date',
      description: 'Current date in readable format',
      example: variables.date,
    },
    {
      name: 'time',
      description: 'Current time in 24-hour format',
      example: variables.time,
    },
    {
      name: 'datetime',
      description: 'Current date and time',
      example: variables.datetime,
    },
    {
      name: 'timestamp',
      description: 'Current timestamp',
      example: variables.timestamp,
    },
    {
      name: 'timezone',
      description: 'Current timezone',
      example: variables.timezone,
    },
    { name: 'day', description: 'Current day (01-31)', example: variables.day },
    {
      name: 'month',
      description: 'Current month (01-12)',
      example: variables.month,
    },
    { name: 'year', description: 'Current year', example: variables.year },
    {
      name: 'weekday',
      description: 'Current day of the week',
      example: variables.weekday,
    },
    {
      name: 'hour',
      description: 'Current hour (00-23)',
      example: variables.hour,
    },
    {
      name: 'minute',
      description: 'Current minute (00-59)',
      example: variables.minute,
    },
    {
      name: 'second',
      description: 'Current second (00-59)',
      example: variables.second,
    },
    {
      name: 'iso_date',
      description: 'Current date in ISO format',
      example: variables.iso_date,
    },
    {
      name: 'iso_time',
      description: 'Current time in ISO format',
      example: variables.iso_time,
    },
    {
      name: 'iso_datetime',
      description: 'Current datetime in ISO format',
      example: variables.iso_datetime,
    },
    {
      name: 'unix_timestamp',
      description: 'Current Unix timestamp',
      example: variables.unix_timestamp,
    },
    {
      name: 'user_agent',
      description: 'User agent string',
      example: 'Mozilla/5.0...',
    },
    {
      name: 'random_uuid',
      description: 'Random UUID v4',
      example: variables.random_uuid,
    },
  ];
}

/**
 * Validate if a template contains valid variable syntax
 */
export function validateTemplate(template: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  const variableNames = Object.keys(generatePromptVariables());

  // Find all template variables in the format {{ variable_name }}
  const templateVarRegex = /\{\{\s*([^}]+)\s*\}\}/g;
  let match;

  while ((match = templateVarRegex.exec(template)) !== null) {
    const variableName = match[1].trim();
    if (!variableNames.includes(variableName)) {
      errors.push(`Unknown variable: ${variableName}`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
