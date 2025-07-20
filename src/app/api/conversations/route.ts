import { NextRequest, NextResponse } from 'next/server';
import { ConversationService } from '@/lib/db/conversationService';

export async function GET() {
  try {
    const conversations = await ConversationService.getConversationPreviews();
    return NextResponse.json({ conversations });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversations' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { title, messages } = await request.json();

    if (!title || !messages) {
      return NextResponse.json(
        { error: 'Title and messages are required' },
        { status: 400 }
      );
    }

    const conversationId = await ConversationService.createConversation(
      title,
      messages
    );
    return NextResponse.json({ conversationId });
  } catch (error) {
    console.error('Error creating conversation:', error);
    return NextResponse.json(
      { error: 'Failed to create conversation' },
      { status: 500 }
    );
  }
}
