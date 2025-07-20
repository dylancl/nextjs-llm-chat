import { NextRequest, NextResponse } from 'next/server';
import { createBonzaiClient } from '@/lib/api/bonzaiClient';
import { generateConversationTitle } from '@/lib/titleGenerationService';

export async function POST(request: NextRequest) {
  try {
    const { message, apiKey } = await request.json();

    if (!message || !apiKey) {
      return NextResponse.json(
        { error: 'Message and API key are required' },
        { status: 400 }
      );
    }

    const bonzai = createBonzaiClient(apiKey);
    const title = await generateConversationTitle(message, bonzai);

    return NextResponse.json({ title });
  } catch (error) {
    console.error('Error generating conversation title:', error);
    return NextResponse.json(
      { error: 'Failed to generate conversation title' },
      { status: 500 }
    );
  }
}
