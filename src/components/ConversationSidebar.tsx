'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import {
  MessageSquare,
  Plus,
  Trash2,
  Edit2,
  Clock,
  MoreVertical,
  Search,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { useConversations } from '@/hooks/useConversations';
import { cn } from '@/lib/utils';

interface ConversationSidebarProps {
  onConversationSelect: (conversationId: number) => void;
  onNewConversation: () => void;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

interface ConversationPreview {
  id: number;
  title: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
  lastUserMessage?: string;
}

export function ConversationSidebar({
  onConversationSelect,
  onNewConversation,
  isOpen,
  onOpenChange,
}: ConversationSidebarProps) {
  const {
    conversations,
    currentConversationId,
    deleteConversation,
    updateConversationTitle,
    loadConversations,
  } = useConversations();

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Refresh conversations when the sidebar is opened
  useEffect(() => {
    if (isOpen) {
      loadConversations();
    }
  }, [isOpen, loadConversations]);

  // Filter conversations based on search query
  const filteredConversations = conversations.filter(
    (conversation) =>
      conversation.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conversation.lastUserMessage
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase())
  );

  const handleEditStart = (conversation: ConversationPreview) => {
    setEditingId(conversation.id);
    setEditTitle(conversation.title);
  };

  const handleEditSave = async () => {
    if (editingId && editTitle.trim()) {
      await updateConversationTitle(editingId, editTitle.trim());
      setEditingId(null);
      setEditTitle('');
    }
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditTitle('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleEditSave();
    } else if (e.key === 'Escape') {
      handleEditCancel();
    }
  };

  const ConversationItem = ({
    conversation,
  }: {
    conversation: ConversationPreview;
  }) => (
    <div
      className={cn(
        'group relative rounded-lg cursor-pointer transition-all duration-200',
        'border border-border/40 bg-background/80 hover:bg-muted/90',
        'shadow-sm hover:shadow-md backdrop-blur-sm',
        currentConversationId === conversation.id
          ? 'bg-muted/70 border-primary/40 shadow-md ring-1 ring-primary/20'
          : 'hover:border-border/70'
      )}
      onClick={() => onConversationSelect(conversation.id)}
    >
      <div className="p-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            {editingId === conversation.id ? (
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onBlur={handleEditSave}
                onKeyDown={handleKeyPress}
                className="text-sm font-semibold h-8 px-2 -ml-2"
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <h3 className="text-sm font-semibold text-foreground leading-tight line-clamp-2 mb-1">
                {conversation.title}
              </h3>
            )}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button
                variant="ghost"
                size="sm"
                className="opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7 p-0 shrink-0"
              >
                <MoreVertical className="w-3.5 h-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  handleEditStart(conversation);
                }}
                className="flex items-center gap-2"
              >
                <Edit2 className="w-4 h-4" />
                Edit title
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  deleteConversation(conversation.id);
                }}
                className="flex items-center gap-2 text-destructive focus:text-destructive"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {conversation.lastUserMessage && (
          <p className="text-xs text-muted-foreground line-clamp-2 mb-3 leading-relaxed">
            {conversation.lastUserMessage}
          </p>
        )}

        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Badge
              variant="secondary"
              className="text-xs font-normal px-2 py-0.5 h-auto bg-background/80"
            >
              {conversation.messageCount}{' '}
              {conversation.messageCount === 1 ? 'message' : 'messages'}
            </Badge>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
            <Clock className="w-3 h-3" />
            <span>
              {formatDistanceToNow(new Date(conversation.updatedAt), {
                addSuffix: true,
              })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-primary/10">
            <MessageSquare className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Conversations</h2>
            <p className="text-sm text-muted-foreground">
              {filteredConversations.length} conversation
              {filteredConversations.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <Button
            onClick={onNewConversation}
            className="w-full justify-start gap-2 h-10"
            variant="outline"
          >
            <Plus className="w-4 h-4" />
            New Conversation
          </Button>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-9"
            />
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1 p-4 bg-muted/20 max-h-full overflow-y-auto">
        <div className="space-y-3">
          {filteredConversations.length === 0 ? (
            <div className="text-center py-12">
              {searchQuery ? (
                <div className="text-muted-foreground">
                  <Search className="w-12 h-12 mx-auto mb-4 opacity-40" />
                  <p className="text-base font-medium mb-2">
                    No conversations found
                  </p>
                  <p className="text-sm">
                    Try adjusting your search terms or start a new conversation
                  </p>
                </div>
              ) : (
                <div className="text-muted-foreground">
                  <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-40" />
                  <p className="text-base font-medium mb-2">
                    No conversations yet
                  </p>
                  <p className="text-sm">
                    Start chatting to create your first conversation
                  </p>
                </div>
              )}
            </div>
          ) : (
            filteredConversations.map((conversation) => (
              <ConversationItem
                key={conversation.id}
                conversation={conversation}
              />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );

  // If controlled by parent, return just the content
  if (isOpen !== undefined && onOpenChange) {
    return (
      <Sheet open={isOpen} onOpenChange={onOpenChange}>
        <SheetContent side="left" className="w-[420px] p-0">
          {sidebarContent}
        </SheetContent>
      </Sheet>
    );
  }

  // Otherwise, include the trigger
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <MessageSquare className="w-4 h-4" />
          Conversations
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[420px] p-0">
        {sidebarContent}
      </SheetContent>
    </Sheet>
  );
}
