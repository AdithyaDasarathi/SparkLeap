# SparkLeap Backend Functions

This is a [Next.js](https://nextjs.org) project for KPI tracking and task management with integrated AI capabilities.

## Setup Instructions

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd sparkleap-tasks
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Variables Setup
**Important: You must set up environment variables before the app will work properly.**

1. Copy the environment template:
   ```bash
   cp env.example .env
   ```

2. Edit the `.env` file and fill in your actual API keys:

   **Required Variables:**
   - `NEXT_PUBLIC_OPENAI_API_KEY`: Get from [OpenAI](https://platform.openai.com/api-keys)
   - `ENCRYPTION_KEY`: Generate a secure 32+ character string

   **Optional Variables:**
   - `NEXT_PUBLIC_OPENAI_API_BASE_URL`: Defaults to OpenAI's API (only change if using a proxy)

### 4. API Keys You'll Need

- **OpenAI API Key**: Required for AI chat functionality
  - Sign up at [OpenAI](https://platform.openai.com/)
  - Go to API Keys section
  - Create a new secret key
  - Add it to your `.env` file

- **Data Source API Keys** (optional, for KPI integrations):
  - **Stripe**: For payment/subscription data
  - **Google Analytics**: For website traffic data
  - **Airtable**: For custom metrics

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Features

- **KPI Dashboard**: Track key business metrics
- **Task Management**: AI-powered task tracking
- **Data Source Integrations**: Connect to Stripe, Google Analytics, Airtable
- **AI Chat**: Get insights and answers about your business data

## Project Structure

- `/app` - Next.js 13+ app directory
- `/src/components` - React components
- `/src/types` - TypeScript type definitions
- `/src/utils` - Utility functions and integrations

## Troubleshooting

### "Environment variable X is not set" errors
- Make sure you've created a `.env` file from `env.example`
- Verify all required variables are filled in
- Restart the development server after changing environment variables

### OpenAI API errors
- Check that your API key is valid and has available credits
- Ensure the API key starts with `sk-`

## Security Note

- Never commit your `.env` file to version control
- The `.gitignore` file is configured to exclude environment files
- Share the `env.example` file instead of your actual `.env` file

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
