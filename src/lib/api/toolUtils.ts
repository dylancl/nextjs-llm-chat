import { ChatCompletionTool } from 'openai/resources/chat/completions';
import { ToolDefinition } from '@/types/tools';

/**
 * Convert our tool definition format to OpenAI's ChatCompletionTool format
 */
export function convertToOpenAITool(tool: ToolDefinition): ChatCompletionTool {
  return {
    type: 'function',
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters,
    },
  };
}

/**
 * Convert an array of tool definitions to OpenAI format
 */
export function convertToolsToOpenAIFormat(
  tools: ToolDefinition[]
): ChatCompletionTool[] {
  return tools.map(convertToOpenAITool);
}
