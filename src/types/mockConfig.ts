export interface MockConfig {
  // Response Generation
  responseLength: "short" | "medium" | "long" | "variable";
  responseStyle:
    | "professional"
    | "casual"
    | "technical"
    | "creative"
    | "concise"
    | "verbose";
  responseTemplate:
    | "random"
    | "technical"
    | "explanation"
    | "listing"
    | "conversation"
    | "custom";
  customTemplate: string;

  // Streaming Behavior
  streamingEnabled: boolean;
  streamingPattern: "steady" | "burst" | "irregular" | "realistic";
  chunkSize: {
    min: number;
    max: number;
  };
  streamingDelay: {
    min: number;
    max: number;
  };

  // Response Timing
  initialDelay: {
    min: number;
    max: number;
  };
  processingDelay: boolean;

  // Error Simulation
  errorSimulationEnabled: boolean;
  errorRate: number; // 0-100 percentage
  errorTypes: {
    timeout: boolean;
    rateLimited: boolean;
    serverError: boolean;
    networkError: boolean;
  };

  // Token Estimation
  tokenEstimationAccuracy: "precise" | "realistic" | "variable";
  averageTokensPerWord: number;

  // Response Variety
  responseVariety: boolean;
  conversationContext: boolean;
  emotionalTone:
    | "neutral"
    | "enthusiastic"
    | "professional"
    | "friendly"
    | "helpful";

  // Advanced Features
  typingIndicator: boolean;
  thinkingTime: boolean;
  multiTurnCoherence: boolean;
  memorySimulation: boolean;
}

export interface ResponseTemplate {
  id: string;
  name: string;
  description: string;
  template: string;
  variables: string[];
  category: "technical" | "general" | "creative" | "explanatory";
}

export interface MockScenario {
  id: string;
  name: string;
  description: string;
  config: Partial<MockConfig>;
  triggers?: string[]; // Keywords that trigger this scenario
}

export const DEFAULT_MOCK_CONFIG: MockConfig = {
  responseLength: "medium",
  responseStyle: "professional",
  responseTemplate: "random",
  customTemplate: "",

  streamingEnabled: true,
  streamingPattern: "realistic",
  chunkSize: { min: 1, max: 3 },
  streamingDelay: { min: 20, max: 100 },

  initialDelay: { min: 100, max: 300 },
  processingDelay: true,

  errorSimulationEnabled: false,
  errorRate: 5,
  errorTypes: {
    timeout: true,
    rateLimited: true,
    serverError: true,
    networkError: false,
  },

  tokenEstimationAccuracy: "realistic",
  averageTokensPerWord: 1.3,

  responseVariety: true,
  conversationContext: true,
  emotionalTone: "helpful",

  typingIndicator: true,
  thinkingTime: false,
  multiTurnCoherence: true,
  memorySimulation: false,
};

export const RESPONSE_TEMPLATES: ResponseTemplate[] = [
  {
    id: "technical-explanation",
    name: "Technical Explanation",
    description: "Detailed technical explanation with examples",
    template: `I'll explain {{topic}} in detail.

{{topic}} is a {{concept_type}} that works by {{mechanism}}. Here are the key aspects:

1. **Core Concept**: {{core_explanation}}
2. **Implementation**: {{implementation_details}}
3. **Best Practices**: {{best_practices}}
4. **Common Pitfalls**: {{common_issues}}

Example:
\`\`\`{{language}}
{{code_example}}
\`\`\`

This approach ensures {{benefits}} while avoiding {{drawbacks}}.`,
    variables: [
      "topic",
      "concept_type",
      "mechanism",
      "core_explanation",
      "implementation_details",
      "best_practices",
      "common_issues",
      "language",
      "code_example",
      "benefits",
      "drawbacks",
    ],
    category: "technical",
  },
  {
    id: "step-by-step",
    name: "Step-by-Step Guide",
    description: "Structured step-by-step instructions",
    template: `Here's how to {{task}}:

## Prerequisites
{{prerequisites}}

## Steps

{{#steps}}
### Step {{step_number}}: {{step_title}}
{{step_description}}

{{#if code_snippet}}
\`\`\`{{language}}
{{code_snippet}}
\`\`\`
{{/if}}

{{#if note}}
> **Note**: {{note}}
{{/if}}

{{/steps}}

## Verification
{{verification_steps}}

You should now have successfully {{completion_state}}.`,
    variables: [
      "task",
      "prerequisites",
      "steps",
      "step_number",
      "step_title",
      "step_description",
      "code_snippet",
      "language",
      "note",
      "verification_steps",
      "completion_state",
    ],
    category: "explanatory",
  },
  {
    id: "creative-response",
    name: "Creative Response",
    description: "Creative and engaging response style",
    template: `{{greeting}} That's an interesting {{question_type}}! 

{{creative_opener}}

{{main_content}}

{{analogy_or_metaphor}}

{{practical_application}}

{{encouraging_closing}}`,
    variables: [
      "greeting",
      "question_type",
      "creative_opener",
      "main_content",
      "analogy_or_metaphor",
      "practical_application",
      "encouraging_closing",
    ],
    category: "creative",
  },
  {
    id: "conversational",
    name: "Conversational",
    description: "Natural conversational flow",
    template: `{{acknowledgment}}

{{response_content}}

{{follow_up_question}}`,
    variables: ["acknowledgment", "response_content", "follow_up_question"],
    category: "general",
  },
];

export const MOCK_SCENARIOS: MockScenario[] = [
  {
    id: "fast-development",
    name: "Fast Development",
    description: "Quick responses for rapid prototyping",
    config: {
      responseLength: "short",
      initialDelay: { min: 50, max: 150 },
      streamingDelay: { min: 10, max: 30 },
      streamingPattern: "steady",
    },
  },
  {
    id: "realistic-api",
    name: "Realistic API",
    description: "Simulates real API with occasional delays and errors",
    config: {
      responseLength: "variable",
      initialDelay: { min: 200, max: 800 },
      errorSimulationEnabled: true,
      errorRate: 10,
      processingDelay: true,
    },
  },
  {
    id: "presentation-demo",
    name: "Presentation Demo",
    description: "Slow, dramatic responses perfect for presentations",
    config: {
      responseLength: "medium",
      streamingDelay: { min: 100, max: 200 },
      streamingPattern: "steady",
      typingIndicator: true,
      thinkingTime: true,
    },
  },
  {
    id: "stress-test",
    name: "Stress Test",
    description: "High error rates and timeouts for testing resilience",
    config: {
      errorSimulationEnabled: true,
      errorRate: 30,
      errorTypes: {
        timeout: true,
        rateLimited: true,
        serverError: true,
        networkError: true,
      },
    },
  },
];
