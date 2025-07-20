import { ChatCompletionMessageParam } from "openai/resources/chat/completions";

export function convertToSimpleMessage(msg: ChatCompletionMessageParam): {
  role: string;
  content: string;
} {
  let content = "";

  if (typeof msg.content === "string") {
    content = msg.content;
  } else if (Array.isArray(msg.content)) {
    const textPart = msg.content.find((part) => "text" in part);
    content = textPart && "text" in textPart ? textPart.text : "";
  }

  return {
    role: msg.role,
    content,
  };
}

export function convertToOpenAIMessage(msg: {
  role: string;
  content: string;
}): ChatCompletionMessageParam {
  switch (msg.role) {
    case "system":
      return { role: "system", content: msg.content };
    case "user":
      return { role: "user", content: msg.content };
    case "assistant":
      return { role: "assistant", content: msg.content };
    case "developer":
      return { role: "developer", content: msg.content };
    default:
      return { role: "user", content: msg.content };
  }
}
