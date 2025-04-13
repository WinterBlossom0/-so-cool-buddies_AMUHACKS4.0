import React, { useState, useEffect, useRef, useContext } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  List,
  ListItem,
  CircularProgress,
  Chip,
  useTheme,
  IconButton
} from '@mui/material';
import { Send, MyLocation, Refresh } from '@mui/icons-material';
import api from '../services/api';
import { v4 as uuidv4 } from 'uuid';
import { LocationContext } from '../contexts/LocationContext';

type Message = {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  suggestions?: string[];
  location?: {
    lat: number;
    lon: number;
    city: string;
  };
  contextAware?: boolean;
};

const ChatbotPage: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [suggestedPrompts, setSuggestedPrompts] = useState<string[]>([]);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);
  const locationContext = useContext(LocationContext);
  const theme = useTheme();

  // Get or create a session ID
  useEffect(() => {
    const storedSessionId = localStorage.getItem('chatbot_session_id');
    if (storedSessionId) {
      setSessionId(storedSessionId);
    } else {
      const newSessionId = uuidv4();
      localStorage.setItem('chatbot_session_id', newSessionId);
      setSessionId(newSessionId);
    }
  }, []);

  // Add welcome message
  useEffect(() => {
    if (sessionId && messages.length === 0) {
      setMessages([
        {
          id: uuidv4(),
          text: `Welcome to SmartCityPulse! I'm your AI assistant. How can I help you today?`,
          sender: 'bot',
          timestamp: new Date(),
          suggestions: ['Weather forecast', 'Traffic conditions', 'Air quality']
        }
      ]);
      fetchSuggestedPrompts();
    }
  }, [sessionId, messages.length]);

  // Get suggested prompts
  const fetchSuggestedPrompts = async () => {
    try {
      const response = await api.get('/api/chatbot/suggested-prompts');
      setSuggestedPrompts(response.data.prompts || []);
    } catch (error) {
      console.error('Error fetching suggested prompts:', error);
    }
  };

  // Scroll to bottom of chat when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;
    
    const userMessage: Message = {
      id: uuidv4(),
      text: input,
      sender: 'user',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    
    try {
      // Get location data from context
      const locationData = locationContext?.location || { lat: 0, lon: 0, city: '' };
      
      // Send message to backend
      const response = await api.post('/api/chatbot/chat', {
        user_id: sessionId,
        message: input,
        location: {
          lat: locationData.lat,
          lon: locationData.lon,
          city: locationData.city
        }
      });
      
      // Create bot message with response
      const botMessage: Message = {
        id: uuidv4(),
        text: response.data.message,
        sender: 'bot',
        timestamp: new Date(),
        suggestions: response.data.suggestions || [],
        contextAware: response.data.context_aware || false,
        location: locationData.lat !== 0 ? locationData : undefined
      };
      
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Add error message
      const errorMessage: Message = {
        id: uuidv4(),
        text: 'Sorry, I encountered an error. Please try again later.',
        sender: 'bot',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
    handleSendMessage();
  };

  const handleClearChat = () => {
    // Clear chat history
    setMessages([
      {
        id: uuidv4(),
        text: 'Chat history cleared. How else can I help you today?',
        sender: 'bot',
        timestamp: new Date(),
        suggestions: ['Weather forecast', 'Traffic conditions', 'Air quality']
      }
    ]);
    
    // Reset session on the server
    api.post(`/api/chatbot/reset_context/${sessionId}`).catch(error => {
      console.error('Error resetting context:', error);
    });
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" gutterBottom>
          AI Assistant
        </Typography>
        <Button 
          variant="outlined" 
          startIcon={<Refresh />} 
          onClick={handleClearChat}
          size="small"
        >
          Clear Chat
        </Button>
      </Box>
      
      <Typography variant="body1" paragraph>
        Ask me anything about the city or get personalized recommendations based on your location.
      </Typography>
      
      <Paper 
        elevation={3} 
        sx={{ 
          height: 'calc(100vh - 250px)', 
          display: 'flex', 
          flexDirection: 'column',
          borderRadius: 2,
          overflow: 'hidden'
        }}
      >
        {/* Chat messages area */}
        <Box sx={{ 
          flexGrow: 1, 
          overflow: 'auto', 
          p: 2,
          backgroundColor: theme.palette.background.default
        }}>
          <List>
            {messages.map((message) => (
              <ListItem 
                key={message.id} 
                sx={{ 
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: message.sender === 'user' ? 'flex-end' : 'flex-start',
                  p: 1
                }}
              >
                <Paper 
                  elevation={1} 
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    maxWidth: '80%',
                    backgroundColor: message.sender === 'user' 
                      ? theme.palette.primary.light 
                      : theme.palette.background.paper,
                    color: message.sender === 'user' 
                      ? theme.palette.primary.contrastText 
                      : theme.palette.text.primary
                  }}
                >
                  <Typography variant="body1">{message.text}</Typography>
                  
                  {/* Location indicator for context-aware messages */}
                  {message.contextAware && message.location && (
                    <Box sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
                      <Chip 
                        icon={<MyLocation fontSize="small" />} 
                        label={`Using data from ${message.location.city}`} 
                        size="small" 
                        color="secondary"
                      />
                    </Box>
                  )}
                </Paper>
                
                {/* Timestamp */}
                <Typography 
                  variant="caption" 
                  sx={{ 
                    mt: 0.5, 
                    color: 'text.secondary',
                    alignSelf: message.sender === 'user' ? 'flex-end' : 'flex-start'
                  }}
                >
                  {message.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </Typography>
                
                {/* Suggestion chips */}
                {message.sender === 'bot' && message.suggestions && message.suggestions.length > 0 && (
                  <Box sx={{ 
                    display: 'flex', 
                    flexWrap: 'wrap', 
                    gap: 1, 
                    mt: 1,
                    justifyContent: 'flex-start',
                    maxWidth: '100%'
                  }}>
                    {message.suggestions.map((suggestion, index) => (
                      <Chip
                        key={index}
                        label={suggestion}
                        onClick={() => handleSuggestionClick(suggestion)}
                        clickable
                        size="small"
                        sx={{ mb: 1 }}
                      />
                    ))}
                  </Box>
                )}
              </ListItem>
            ))}
            {loading && (
              <ListItem>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <CircularProgress size={20} />
                  <Typography variant="body2">Thinking...</Typography>
                </Box>
              </ListItem>
            )}
            <div ref={messagesEndRef} />
          </List>
        </Box>
        
        {/* Input area */}
        <Box sx={{ 
          p: 2, 
          borderTop: `1px solid ${theme.palette.divider}`,
          backgroundColor: theme.palette.background.paper,
          display: 'flex',
          alignItems: 'center'
        }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Type your message here..."
            value={input}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            size="small"
            multiline
            maxRows={3}
            sx={{ mr: 1 }}
            InputProps={{
              endAdornment: (
                <IconButton 
                  color="primary"
                  onClick={() => handleSendMessage()}
                  disabled={!input.trim() || loading}
                >
                  <Send />
                </IconButton>
              )
            }}
          />
        </Box>
      </Paper>
      
      {/* Suggested prompts */}
      {suggestedPrompts.length > 0 && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Suggested questions:
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {suggestedPrompts.map((prompt, index) => (
              <Chip
                key={index}
                label={prompt}
                onClick={() => handleSuggestionClick(prompt)}
                clickable
                size="small"
                sx={{ mb: 1 }}
              />
            ))}
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default ChatbotPage;