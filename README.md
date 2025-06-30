# Firebase Studio

This is a NextJS starter in Firebase Studio.

To get started, take a look at `src/app/page.tsx`.

## Running Locally

1.  **Get a Google AI API Key:** Create an API key from [Google AI Studio](https://aistudio.google.com/app/apikey).
2.  **Set up environment variables:** Create a file named `.env` in the root of your project and add your API key:
    ```
    GOOGLE_API_KEY=YOUR_API_KEY_HERE
    ```
3.  **Install dependencies:**
    ```bash
    npm install
    ```
4.  **Run the development server:**
    ```bash
    npm run dev
    ```

## Deployment to Vercel

When you deploy your application to a hosting provider like Vercel, you need to provide your `GOOGLE_API_KEY` as an environment variable in your project's settings on that platform.

1.  Push your code to your GitHub repository.
2.  Import the repository into a new Vercel project.
3.  In your Vercel project's dashboard, go to **Settings > Environment Variables**.
4.  Add a new variable:
    -   **Name:** `GOOGLE_API_KEY`
    -   **Value:** Paste the API key you got from Google AI Studio.
5.  Redeploy your application. Your AI features should now work correctly.
# Sasha-banking
