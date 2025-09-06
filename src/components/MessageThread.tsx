import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Send, Users, Calendar } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Secret {
  id: string;
  secret_text: string;
  created_at: string;
  similarity?: number;
}

interface MessageThreadProps {
  userSecret: Secret;
  otherSecret: Secret;
  onBack: () => void;
}

export default function MessageThread({ userSecret, otherSecret, onBack }: MessageThreadProps) {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Array<{ id: string; text: string; sender: 'user' | 'other'; timestamp: string }>>([]);

  const handleSendMessage = () => {
    if (!message.trim()) return;
    
    const newMessage = {
      id: Date.now().toString(),
      text: message,
      sender: 'user' as const,
      timestamp: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, newMessage]);
    setMessage("");
  };

  const getSimilarityBadge = (similarity: number) => {
    if (similarity > 0.8) return { label: "Very Similar", color: "bg-gradient-trust text-white" };
    if (similarity > 0.6) return { label: "Similar", color: "bg-gradient-warm text-secondary-foreground" };
    return { label: "Somewhat Similar", color: "bg-muted text-muted-foreground" };
  };

  const badge = getSimilarityBadge(otherSecret.similarity || 0);
  const similarityPercentage = Math.round((otherSecret.similarity || 0) * 100);

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 fade-in">
      {/* Header with back button */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          onClick={onBack}
          className="p-2"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h2 className="text-2xl font-bold">Message Thread</h2>
      </div>

      {/* Both secrets displayed at top */}
      <div className="space-y-4">
        {/* User's secret */}
        <Card className="secret-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <span className="w-3 h-3 bg-primary rounded-full"></span>
              Your Secret
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-foreground leading-relaxed text-base">
              {userSecret.secret_text}
            </p>
            <div className="flex items-center justify-between text-xs text-muted-foreground border-t pt-3 mt-3">
              <div className="flex items-center gap-2">
                <Users className="w-3 h-3" />
                <span>You</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-3 h-3" />
                <span>{formatDistanceToNow(new Date(userSecret.created_at), { addSuffix: true })}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Other person's secret */}
        <Card className="secret-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <span className="w-3 h-3 bg-secondary rounded-full"></span>
              Their Secret
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-foreground leading-relaxed text-base">
              {otherSecret.secret_text}
            </p>
            <div className="flex items-center gap-3 mt-3">
              <Badge className={`${badge.color} text-sm font-medium px-3 py-1`}>
                {similarityPercentage}% Match
              </Badge>
              <span className="text-xs text-muted-foreground">
                {badge.label}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground border-t pt-3 mt-3">
              <div className="flex items-center gap-2">
                <Users className="w-3 h-3" />
                <span>Anonymous</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-3 h-3" />
                <span>{formatDistanceToNow(new Date(otherSecret.created_at), { addSuffix: true })}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Message thread */}
      <Card className="secret-card">
        <CardHeader>
          <CardTitle className="text-lg">Messages</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Messages display */}
          <div className="space-y-3 min-h-[200px] max-h-[400px] overflow-y-auto">
            {messages.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <p>No messages yet. Start the conversation!</p>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg px-4 py-2 ${
                      msg.sender === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    <p className="text-sm">{msg.text}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {formatDistanceToNow(new Date(msg.timestamp), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Message input */}
          <div className="flex gap-2 pt-4 border-t">
            <Input
              placeholder="Type your message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              className="flex-1"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!message.trim()}
              className="btn-primary"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
