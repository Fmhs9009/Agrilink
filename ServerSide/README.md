# AgriLink Server Setup

## Email Configuration for Password Reset

For the password reset feature to work correctly, you need to configure email settings in your `.env` file:

1. Create a `.env` file in the ServerSide directory if it doesn't exist already
2. Add the following email configuration:

```
MAIL_HOST=smtp.gmail.com
MAIL_USER=youremail@gmail.com
MAIL_PASS=your-app-password
FRONTEND_URL=http://localhost:3000
```

### Setting up Gmail for sending emails:

1. **Create an App Password (recommended for Gmail)**:
   - Go to your Google Account settings
   - Navigate to Security
   - Under "Signing in to Google", select "App passwords" (you may need to enable 2-Step Verification first)
   - Select "Mail" as the app and your device
   - Click "Generate"
   - Use the generated 16-character password as your `MAIL_PASS` in the .env file

2. **Alternative: Allow less secure apps**:
   - This is not recommended for security reasons
   - Go to your Google Account
   - Navigate to Security
   - Turn on "Less secure app access"

### Frontend URL Configuration

Make sure the `FRONTEND_URL` in your .env file points to your actual frontend URL. This is used to generate the password reset link that's sent in the email.

For local development, it's typically:
```
FRONTEND_URL=http://localhost:3000
```

For production, it should be your deployed frontend URL:
```
FRONTEND_URL=https://your-website.com
``` 