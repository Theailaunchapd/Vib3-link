<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1dWjpK5wzIJE7yyjpzIaQGGdx3fZn4cZJ

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables:
   Create a `.env.local` file in the root directory with:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   VITE_OPENAI_API_KEY=your_openai_api_key_here
   ```
   
   - `GEMINI_API_KEY`: Required for AI features (bio generation, images, etc.)
   - `VITE_OPENAI_API_KEY`: Optional - for AI theme generation. If not provided, the app will use intelligent fallback theme generation.

3. Run the app:
   ```bash
   npm run dev
   ```

## Features

### AI Theme Generation
The app includes AI-powered theme generation using OpenAI's GPT-4o-mini. Users can describe their desired theme (e.g., "modern tech startup" or "vintage coffee shop"), and the AI will generate:
- Appropriate theme style (modern/retro/glass)
- Color scheme
- Background type and images
- Professional reasoning for the choices

**Fallback Mode:** If no OpenAI API key is provided, the system uses intelligent keyword-based theme generation with curated Unsplash images.
