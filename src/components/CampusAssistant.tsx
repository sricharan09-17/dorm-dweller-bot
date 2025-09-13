import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Send, Bot, User, Calendar, MapPin, UtensilsCrossed, BookOpen, FileText, Sparkles } from 'lucide-react';
import campusHero from '@/assets/campus-hero.jpg';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
  category?: string;
}

const CAMPUS_KNOWLEDGE = {
  schedules: {
    keywords: ['schedule', 'class', 'time', 'semester', 'calendar', 'when'],
    responses: [
      "📅 **Fall 2024 Semester Schedule:**\n\n• **Classes Begin:** August 28, 2024\n• **Labor Day Holiday:** September 2 (No Classes)\n• **Midterm Exams:** October 14-18\n• **Thanksgiving Break:** November 25-29\n• **Final Exams:** December 9-13\n• **Winter Break:** December 14 - January 15\n\nNeed specific class schedules? Check your student portal or ask for your department's timetable!",
      "🕒 **Library Hours:**\n\n• **Monday-Thursday:** 7:00 AM - 11:00 PM\n• **Friday:** 7:00 AM - 8:00 PM\n• **Saturday:** 9:00 AM - 6:00 PM\n• **Sunday:** 11:00 AM - 11:00 PM\n\n📚 Extended hours during finals week!"
    ]
  },
  facilities: {
    keywords: ['facility', 'building', 'location', 'where', 'find', 'gym', 'library', 'lab'],
    responses: [
      "🏛️ **Main Campus Facilities:**\n\n🏢 **Academic Buildings:**\n• Science Hall - Labs & Research\n• Liberal Arts Center - Humanities Classes\n• Business Complex - MBA & Undergraduate Programs\n• Engineering Building - Tech Labs & Workshops\n\n🏃 **Recreation:**\n• Campus Gym - Full fitness center\n• Pool Complex - Olympic-size pool\n• Tennis Courts - 6 courts available\n• Running Track - 400m outdoor track",
      "📍 **Campus Map Highlights:**\n\n• **Student Center** - Main hub for dining & services\n• **Health Center** - Medical services & counseling\n• **Career Services** - Job placement & internships\n• **IT Help Desk** - Technology support\n• **Parking Decks** - A, B, C (visitor parking available)\n\nNeed directions? I can help you navigate between buildings!"
    ]
  },
  dining: {
    keywords: ['food', 'dining', 'eat', 'meal', 'restaurant', 'cafe', 'hungry'],
    responses: [
      "🍽️ **Campus Dining Options:**\n\n🏪 **Main Dining Hall:**\n• Breakfast: 7:00 AM - 10:00 AM\n• Lunch: 11:30 AM - 2:00 PM\n• Dinner: 5:00 PM - 8:00 PM\n\n☕ **Campus Cafés:**\n• Central Café (Student Center) - Open 24/7\n• Library Café - 8:00 AM - 10:00 PM\n• Engineering Café - 7:00 AM - 6:00 PM",
      "🥗 **Today's Specials:**\n\n• **Grill Station:** Burgers & sandwiches\n• **International:** Asian stir-fry bar\n• **Healthy Choice:** Fresh salads & wraps\n• **Pizza Corner:** Fresh made-to-order pizzas\n• **Dessert Bar:** Daily fresh pastries\n\n💳 Meal plans and dining dollars accepted at all locations!"
    ]
  },
  library: {
    keywords: ['library', 'book', 'study', 'research', 'quiet', 'computer'],
    responses: [
      "📚 **Library Services:**\n\n🔍 **Research Support:**\n• Librarian consultations available\n• Database access (24/7 online)\n• Interlibrary loan services\n• Citation help & writing support\n\n💻 **Study Spaces:**\n• 200+ computer stations\n• Group study rooms (bookable online)\n• Silent study floors (3rd & 4th)\n• 24/7 study lounge",
      "📖 **Library Resources:**\n\n• **Physical Collection:** 500,000+ books\n• **Digital Access:** E-books & journals\n• **Special Collections:** Rare books & archives\n• **Equipment Loans:** Laptops, chargers, calculators\n• **Printing Services:** Black & white, color printing\n\n🎧 Need a quiet space? Try our meditation pods on the 2nd floor!"
    ]
  },
  administration: {
    keywords: ['admin', 'office', 'registration', 'transcript', 'financial', 'aid', 'tuition'],
    responses: [
      "🏛️ **Administrative Services:**\n\n📋 **Registrar's Office:**\n• Transcript requests\n• Enrollment verification\n• Grade changes & appeals\n• Graduation applications\n• **Hours:** Mon-Fri 8:00 AM - 5:00 PM\n\n💰 **Financial Aid:**\n• FAFSA assistance\n• Scholarship information\n• Payment plan options\n• Emergency financial assistance",
      "📞 **Important Contacts:**\n\n• **Admissions:** (555) 123-4567\n• **Financial Aid:** (555) 123-4568\n• **Registrar:** (555) 123-4569\n• **IT Support:** (555) 123-4570\n• **Campus Safety:** (555) 123-4571\n\n🌐 Most services also available online through the student portal!"
    ]
  }
};

const QUICK_ACTIONS = [
  { icon: Calendar, label: 'Class Schedule', category: 'schedules' },
  { icon: MapPin, label: 'Campus Map', category: 'facilities' },
  { icon: UtensilsCrossed, label: 'Dining Hours', category: 'dining' },
  { icon: BookOpen, label: 'Library Info', category: 'library' },
  { icon: FileText, label: 'Admin Services', category: 'administration' },
];

export default function CampusAssistant() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: "👋 Hello! I'm your Smart Campus Assistant. I'm here to help you with information about schedules, facilities, dining, library services, and administrative procedures. What would you like to know about campus today?",
      sender: 'assistant',
      timestamp: new Date(),
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const findBestResponse = (userMessage: string): { content: string; category: string } => {
    const normalizedMessage = userMessage.toLowerCase();
    
    // Find matching category
    for (const [category, data] of Object.entries(CAMPUS_KNOWLEDGE)) {
      if (data.keywords.some(keyword => normalizedMessage.includes(keyword))) {
        const randomResponse = data.responses[Math.floor(Math.random() * data.responses.length)];
        return { content: randomResponse, category };
      }
    }
    
    // Default response for unmatched queries
    return {
      content: "🤔 I'd be happy to help you with that! I specialize in information about:\n\n📅 **Class Schedules & Academic Calendar**\n🏛️ **Campus Facilities & Locations**\n🍽️ **Dining Services & Hours**\n📚 **Library Resources & Services**\n📋 **Administrative Procedures**\n\nCould you please ask me something more specific about any of these topics?",
      category: 'general'
    };
  };

  const handleSendMessage = async (message?: string) => {
    const messageText = message || inputValue.trim();
    if (!messageText) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: messageText,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Simulate AI processing delay
    setTimeout(() => {
      const { content, category } = findBestResponse(messageText);
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content,
        sender: 'assistant',
        timestamp: new Date(),
        category,
      };

      setMessages(prev => [...prev, assistantMessage]);
      setIsTyping(false);
    }, 1500);
  };

  const handleQuickAction = (category: string) => {
    const categoryData = CAMPUS_KNOWLEDGE[category as keyof typeof CAMPUS_KNOWLEDGE];
    if (categoryData) {
      const randomResponse = categoryData.responses[Math.floor(Math.random() * categoryData.responses.length)];
      handleSendMessage(`Tell me about ${category}`);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Hero Section */}
      <div className="relative bg-gradient-hero overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src={campusHero} 
            alt="University Campus" 
            className="w-full h-full object-cover opacity-20"
          />
        </div>
        <div className="relative z-10 container mx-auto px-6 py-16 text-center">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-white">
              Smart Campus Assistant
            </h1>
          </div>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Your intelligent guide to campus life. Get instant answers about schedules, 
            facilities, dining, library services, and administrative procedures.
          </p>
          
          {/* Quick Action Buttons */}
          <div className="flex flex-wrap justify-center gap-4">
            {QUICK_ACTIONS.map((action) => (
              <Button
                key={action.category}
                variant="chat"
                className="bg-white/20 text-white border-white/30 hover:bg-white/30 backdrop-blur-sm"
                onClick={() => handleQuickAction(action.category)}
              >
                <action.icon className="h-4 w-4" />
                {action.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Chat Interface */}
      <div className="container mx-auto px-6 py-12">
        <Card className="max-w-4xl mx-auto shadow-elegant border-0">
          <CardHeader className="border-b bg-gradient-subtle">
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Bot className="h-6 w-6 text-primary" />
              </div>
              Campus Assistant Chat
            </CardTitle>
          </CardHeader>
          
          <CardContent className="p-0">
            <ScrollArea ref={scrollAreaRef} className="h-96 p-6">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {message.sender === 'assistant' && (
                      <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        <Bot className="h-4 w-4 text-primary" />
                      </div>
                    )}
                    
                    <div
                      className={`max-w-[80%] p-4 rounded-2xl ${
                        message.sender === 'user'
                          ? 'bg-primary text-primary-foreground ml-auto'
                          : 'bg-muted'
                      }`}
                    >
                      <div className="whitespace-pre-wrap text-sm leading-relaxed">
                        {message.content}
                      </div>
                      {message.category && message.sender === 'assistant' && (
                        <Badge variant="secondary" className="mt-2 text-xs">
                          {message.category}
                        </Badge>
                      )}
                    </div>
                    
                    {message.sender === 'user' && (
                      <div className="flex-shrink-0 w-8 h-8 bg-accent/10 rounded-full flex items-center justify-center">
                        <User className="h-4 w-4 text-accent" />
                      </div>
                    )}
                  </div>
                ))}
                
                {isTyping && (
                  <div className="flex gap-3 justify-start">
                    <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                    <div className="bg-muted p-4 rounded-2xl">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                        <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
            
            {/* Input Area */}
            <div className="p-6 border-t bg-gradient-subtle">
              <div className="flex gap-3">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me about campus schedules, facilities, dining, library, or admin services..."
                  className="flex-1 bg-background border-border"
                  disabled={isTyping}
                />
                <Button
                  onClick={() => handleSendMessage()}
                  disabled={!inputValue.trim() || isTyping}
                  variant="campus"
                  size="icon"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}