import { NextRequest } from "next/server";
import { handleChatRequest } from "../../../lib/api/chatService";

export async function POST(request: NextRequest) {
  return handleChatRequest(request);
}
