import React, { useState, useEffect, useRef, useContext } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  List,
  ListItem,
  Avatar,
  Chip,
  CircularProgress,
  Divider,
  IconButton,
  Menu,
  MenuItem,
  ListItemText
} from '@mui/material';
import {
  Send as SendIcon,
  SmartToy as BotIcon,
  Person as PersonIcon,
  LocationOn,
  MyLocation,
  MoreVert,
  Refresh,
  Info,
  Delete
} from '@mui/icons-material';
import { LocationContext } from '../../contexts/LocationContext';

interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  type?: 'text' | 'location' | 'weather' | 'traffic' | 'services';
  metadata?: any;
}

// Suggested questions for the user
const SUGGESTED_QUESTIONS = [
  "What's the current weather?",
  "Is there any traffic congestion nearby?",
  "Show me the closest public services",
  "Are there any active alerts in my area?",
  "Where is the nearest recycling center?",
  "How do I report a problem in the city?"
];

const SmartCityChat: React.FC = () => {
  const locationContext = useContext(LocationContext);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      text: "Hello! I'm your Smart City Assistant. How can I help you today?",
      sender: 'bot',
      timestamp: new Date(),
      type: 'text'
    }
  ]);
  const [loading, setLoading] = useState(false);
  const [suggestionAnchorEl, setSuggestionAnchorEl] = useState<null | HTMLElement>(null);
  const endOfMessagesRef = useRef<null | HTMLDivElement>(null);
  
  // Scroll to the latest message
  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  const handleSend = () => {
    if (input.trim() === '') return;
    
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: input,
      sender: 'user',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    
    // Process the message and generate a response
    processUserMessage(input);
  };
  
  const processUserMessage = async (message: string) => {
    // Wait a bit to simulate processing
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    let botResponse: ChatMessage = {
      id: Date.now().toString(),
      text: "I'm processing your request...",
      sender: 'bot',
      timestamp: new Date()
    };
    
    // Check message content for different intents
    const lowerMsg = message.toLowerCase();
    
    if (lowerMsg.includes('weather')) {
      botResponse = handleWeatherQuery();
    } else if (lowerMsg.includes('traffic') || lowerMsg.includes('congestion') || lowerMsg.includes('road')) {
      botResponse = handleTrafficQuery();
    } else if (lowerMsg.includes('service') || lowerMsg.includes('facility') || lowerMsg.includes('nearby')) {
      botResponse = handleServicesQuery();
    } else if (lowerMsg.includes('alert') || lowerMsg.includes('warning')) {
      botResponse = handleAlertsQuery();
    } else if (lowerMsg.includes('report') || lowerMsg.includes('problem')) {
      botResponse = {
        id: Date.now().toString(),
        text: "You can report city problems using our incident reporting tool. Would you like to go there now?",
        sender: 'bot',
        timestamp: new Date(),
        type: 'text',
        metadata: {
          action: 'navigate',
          destination: '/report'
        }
      };
    } else if (lowerMsg.includes('hello') || lowerMsg.includes('hi')) {
      botResponse = {
        id: Date.now().toString(),
        text: `Hello there! How can I assist you with Smart City services today? Feel free to ask about weather, traffic, nearby facilities, or city alerts.`,
        sender: 'bot',
        timestamp: new Date()
      };
    } else {
      // Generic response
      botResponse = {
        id: Date.now().toString(),
        text: `I understand you're asking about "${message}". Let me help you find information about that in our city services.`,
        sender: 'bot',
        timestamp: new Date()
      };
    }
    
    setMessages(prev => [...prev, botResponse]);
    setLoading(false);
  };
  
  const handleWeatherQuery = (): ChatMessage => {
    // In a real app, this would fetch from the weather API
    return {
      id: Date.now().toString(),
      text: `Based on your location, the current weather is 22°C and partly cloudy. There's a 10% chance of rain later today.`,
      sender: 'bot',
      timestamp: new Date(),
      type: 'weather',
      metadata: {
        temperature: 22,
        condition: 'Partly Cloudy',
        rainChance: 10,
        location: locationContext?.location.city || 'your city'
      }
    };
  };
  
  const handleTrafficQuery = (): ChatMessage => {
    // In a real app, this would fetch from the traffic API
    return {
      id: Date.now().toString(),
      text: `Traffic is currently moderate in ${locationContext?.location.city || 'your city'}. There's a 10-minute delay on Main Street due to construction work.`,
      sender: 'bot',
      timestamp: new Date(),
      type: 'traffic',
      metadata: {
        congestion: 'moderate',
        incidents: [{
          type: 'construction',
          location: 'Main Street',
          delay: '10 minutes'
        }]
      }
    };
  };
  
  const handleServicesQuery = (): ChatMessage => {
    // In a real app, this would fetch from a city services API
    return {
      id: Date.now().toString(),
      text: `Here are some nearby services based on your location: City Hall (0.5 miles), Public Library (0.8 miles), Community Center (1.2 miles)`,
      sender: 'bot',
      timestamp: new Date(),
      type: 'services',
      metadata: {
        services: [
          { name: 'City Hall', distance: 0.5, type: 'government' },
          { name: 'Public Library', distance: 0.8, type: 'education' },
          { name: 'Community Center', distance: 1.2, type: 'recreation' }
        ]
      }
    };
  };
  
  const handleAlertsQuery = (): ChatMessage => {
    // In a real app, this would fetch from the alerts API
    return {
      id: Date.now().toString(),
      text: `There are currently 2 active alerts in your area: 1) Weather Advisory - Strong winds expected this evening, 2) Traffic Alert - Road construction on Oak Street`,
      sender: 'bot',
      timestamp: new Date(),
      type: 'text',
      metadata: {
        alerts: [
          { type: 'weather', severity: 'advisory', description: 'Strong winds expected this evening' },
          { type: 'traffic', severity: 'info', description: 'Road construction on Oak Street' }
        ]
      }
    };
  };
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  
  const handleSuggestionClick = (event: React.MouseEvent<HTMLElement>) => {
    setSuggestionAnchorEl(event.currentTarget);
  };
  
  const handleSuggestionClose = () => {
    setSuggestionAnchorEl(null);
  };
  
  const handleSuggestionSelect = (question: string) => {
    setInput(question);
    handleSuggestionClose();
  };
  
  const clearChat = () => {
    setMessages([
      {
        id: '1',
        text: "Hello! I'm your Smart City Assistant. How can I help you today?",
        sender: 'bot',
        timestamp: new Date(),
        type: 'text'
      }
    ]);
  };
  
  // Format the message display based on its type
  const renderMessage = (message: ChatMessage) => {
    if (message.type === 'location') {
      return (
        <>
          <Typography variant="body1">{message.text}</Typography>
          <Chip 
            icon={<LocationOn />} 
            label={`${message.metadata.lat.toFixed(6)}, ${message.metadata.lon.toFixed(6)}`} 
            size="small" 
            sx={{ mt: 1 }}
          />
        </>
      );
    } 
    
    // Standard text message
    return <Typography variant="body1">{message.text}</Typography>;
  };

  return (
    <Paper sx={{ display: 'flex', flexDirection: 'column', height: '100%', p: 0, borderRadius: 2, overflow: 'hidden' }}>
      {/* Header */}
      <Box sx={{ 
        p: 2, 
        borderBottom: '1px solid rgba(0, 0, 0, 0.12)',
        backgroundColor: 'primary.main',
        color: 'white',
        display: 'flex',
        justifyContent: 'space-between'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <BotIcon sx={{ mr: 1 }} />
          <Typography variant="h6">Smart City Assistant</Typography>
        </Box>
        <IconButton color="inherit" size="small" onClick={clearChat}>
          <Delete />
        </IconButton>
      </Box>
      
      {/* Messages */}
      <Box sx={{ flexGrow: 1, overflow: 'auto', p: 2 }}>
        <List>
          {messages.map((msg) => (
            <ListItem
              key={msg.id}
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                p: 1
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  maxWidth: '80%',
                  borderRadius: 2,
                  p: 2,
                  backgroundColor: msg.sender === 'user' ? 'primary.light' : 'grey.100',
                  color: msg.sender === 'user' ? 'white' : 'text.primary',
                  alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start'
                }}
              >
                <Avatar
                  sx={{
                    width: 32,
                    height: 32,
                    mr: 1,
                    bgcolor: msg.sender === 'user' ? 'primary.dark' : 'secondary.main'
                  }}
                >
                  {msg.sender === 'user' ? <PersonIcon /> : <BotIcon />}
                </Avatar>
                <Box sx={{ ml: 1 }}>
                  {renderMessage(msg)}
                  <Typography variant="caption" sx={{ display: 'block', mt: 0.5, opacity: 0.7 }}>
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Typography>
                </Box>
              </Box>
            </ListItem>
          ))}
          {loading && (
            <ListItem
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                p: 1
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  borderRadius: 2,
                  p: 2,
                  backgroundColor: 'grey.100'
                }}
              >
                <Avatar
                  sx={{
                    width: 32,
                    height: 32,
                    mr: 1,
                    bgcolor: 'secondary.main'
                  }}
                >
                  <BotIcon />
                </Avatar>
                <CircularProgress size={20} sx={{ ml: 1 }} />
              </Box>
            </ListItem>
          )}
          <div ref={endOfMessagesRef} />
        </List>
      </Box>
      
      {/* Suggestion Chips */}
      <Box sx={{ p: 2, borderTop: '1px solid rgba(0, 0, 0, 0.12)' }}>
        <Typography variant="body2" color="textSecondary" gutterBottom>
          Suggested questions:
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {SUGGESTED_QUESTIONS.slice(0, 3).map((question, index) => (
            <Chip
              key={index}
              label={question}
              size="small"
              onClick={() => handleSuggestionSelect(question)}
              sx={{ cursor: 'pointer' }}
            />
          ))}
          <Chip
            label="More..."
            size="small"
            onClick={handleSuggestionClick}
            sx={{ cursor: 'pointer' }}
          />
        </Box>
        
        <Menu
          anchorEl={suggestionAnchorEl}
          open={Boolean(suggestionAnchorEl)}
          onClose={handleSuggestionClose}
        >
          {SUGGESTED_QUESTIONS.map((question, index) => (
            <MenuItem key={index} onClick={() => handleSuggestionSelect(question)}>
              {question}
            </MenuItem>
          ))}
        </Menu>
      </Box>
      
      {/* Input */}
      <Box sx={{ p: 2, borderTop: '1px solid rgba(0, 0, 0, 0.12)', backgroundColor: 'grey.50' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <TextField
            fullWidth
            placeholder="Ask something about the city..."
            variant="outlined"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            size="small"
            autoFocus
            sx={{ mr: 1 }}
          />
          <Button
            variant="contained"
            color="primary"
            endIcon={<SendIcon />}
            onClick={handleSend}
            disabled={loading || input.trim() === ''}
          >
            Send
          </Button>
        </Box>
      </Box>
    </Paper>
  );
};

export default SmartCityChat; 