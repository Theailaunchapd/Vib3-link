// OpenAI Service for AI Theme Generation

interface ThemeGenerationResult {
  theme: 'modern' | 'retro' | 'glass';
  backgroundColor: string;
  backgroundType: 'color' | 'image' | 'video';
  backgroundUrl?: string;
  reasoning?: string;
}

export const generateThemeWithAI = async (prompt: string): Promise<ThemeGenerationResult> => {
  try {
    // Get API key from environment or use a default for demo
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY || 'demo-key';
    
    if (apiKey === 'demo-key') {
      // Return a simulated response for demo purposes
      return simulateThemeGeneration(prompt);
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a professional web designer. Generate a theme configuration based on the user's request. 
            
You must respond with ONLY valid JSON in this exact format:
{
  "theme": "modern" | "retro" | "glass",
  "backgroundColor": "#hexcolor",
  "backgroundType": "color" | "image",
  "backgroundUrl": "unsplash_url_if_image",
  "reasoning": "brief explanation"
}

Theme options:
- modern: Clean, minimalist, contemporary
- retro: Vintage, nostalgic, 80s/90s vibes
- glass: Glassmorphism, frosted glass effects

For colors:
- Use hex color codes
- Consider the mood and industry
- Ensure good contrast

For images:
- Use Unsplash URLs with appropriate search terms
- Format: https://images.unsplash.com/photo-[id]?w=1920&q=80
- Only suggest images if they truly enhance the theme`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.8,
        max_tokens: 500
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    // Parse the JSON response
    const themeData = JSON.parse(content);
    
    return {
      theme: themeData.theme || 'modern',
      backgroundColor: themeData.backgroundColor || '#ffffff',
      backgroundType: themeData.backgroundType || 'color',
      backgroundUrl: themeData.backgroundUrl,
      reasoning: themeData.reasoning
    };

  } catch (error) {
    console.error('Error generating theme with OpenAI:', error);
    // Fallback to simulated generation
    return simulateThemeGeneration(prompt);
  }
};

// Simulated theme generation for demo/fallback
const simulateThemeGeneration = (prompt: string): ThemeGenerationResult => {
  const lowerPrompt = prompt.toLowerCase();
  
  // Tech/Modern keywords
  if (lowerPrompt.includes('tech') || lowerPrompt.includes('modern') || lowerPrompt.includes('minimal')) {
    return {
      theme: 'glass',
      backgroundColor: '#0f172a',
      backgroundType: 'color',
      reasoning: 'Selected glass theme with dark blue for a modern, tech-forward aesthetic'
    };
  }
  
  // Retro/Vintage keywords
  if (lowerPrompt.includes('retro') || lowerPrompt.includes('vintage') || lowerPrompt.includes('80s') || lowerPrompt.includes('90s')) {
    return {
      theme: 'retro',
      backgroundColor: '#ff6b9d',
      backgroundType: 'color',
      reasoning: 'Selected retro theme with vibrant pink for nostalgic 80s/90s vibes'
    };
  }
  
  // Creative/Artistic keywords
  if (lowerPrompt.includes('creative') || lowerPrompt.includes('artist') || lowerPrompt.includes('design')) {
    return {
      theme: 'modern',
      backgroundColor: '#7c3aed',
      backgroundType: 'image',
      backgroundUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1920&q=80',
      reasoning: 'Selected modern theme with abstract purple background for creative professionals'
    };
  }
  
  // Nature/Wellness keywords
  if (lowerPrompt.includes('nature') || lowerPrompt.includes('wellness') || lowerPrompt.includes('health') || lowerPrompt.includes('yoga')) {
    return {
      theme: 'modern',
      backgroundColor: '#059669',
      backgroundType: 'image',
      backgroundUrl: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1920&q=80',
      reasoning: 'Selected modern theme with nature imagery for wellness and tranquility'
    };
  }
  
  // Business/Professional keywords
  if (lowerPrompt.includes('business') || lowerPrompt.includes('professional') || lowerPrompt.includes('corporate')) {
    return {
      theme: 'modern',
      backgroundColor: '#1e293b',
      backgroundType: 'color',
      reasoning: 'Selected modern theme with professional dark slate for business credibility'
    };
  }
  
  // Music/Entertainment keywords
  if (lowerPrompt.includes('music') || lowerPrompt.includes('entertainment') || lowerPrompt.includes('artist') || lowerPrompt.includes('performer')) {
    return {
      theme: 'glass',
      backgroundColor: '#dc2626',
      backgroundType: 'image',
      backgroundUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1920&q=80',
      reasoning: 'Selected glass theme with vibrant music imagery for entertainment appeal'
    };
  }
  
  // Fitness keywords
  if (lowerPrompt.includes('fitness') || lowerPrompt.includes('gym') || lowerPrompt.includes('workout') || lowerPrompt.includes('training')) {
    return {
      theme: 'modern',
      backgroundColor: '#ea580c',
      backgroundType: 'image',
      backgroundUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1920&q=80',
      reasoning: 'Selected modern theme with energetic fitness imagery for motivation'
    };
  }
  
  // Food/Restaurant keywords
  if (lowerPrompt.includes('food') || lowerPrompt.includes('restaurant') || lowerPrompt.includes('chef') || lowerPrompt.includes('cooking')) {
    return {
      theme: 'modern',
      backgroundColor: '#f97316',
      backgroundType: 'image',
      backgroundUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1920&q=80',
      reasoning: 'Selected modern theme with appetizing food imagery for culinary appeal'
    };
  }
  
  // Default fallback
  return {
    theme: 'modern',
    backgroundColor: '#3b82f6',
    backgroundType: 'color',
    reasoning: 'Selected modern theme with blue color for versatile professional appeal'
  };
};

