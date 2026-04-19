# SnoreShift Deployment Guide

## Project Structure
```
snoreshift/
├── backend/
│   ├── app.py              # Your Python backend
│   ├── requirements.txt    # Python dependencies
│   ├── Procfile           # For Heroku/Railway
│   └── .env               # Environment variables
└── frontend/              # This current directory
    ├── src/
    ├── package.json
    └── .env.production
```

## Step 1: Prepare Backend Directory

1. **Create backend directory**:
   ```bash
   mkdir ../backend
   cd ../backend
   ```

2. **Copy your app.py file** to the backend directory

3. **Create requirements.txt**:
   ```txt
   flask==2.3.3
   flask-socketio==5.3.6
   python-socketio==5.8.0
   python-engineio==4.7.1
   numpy==1.24.3
   scipy==1.11.2
   sounddevice==0.4.6
   pyserial==3.5
   python-dotenv==1.0.0
   tensorflow==2.13.0
   tensorflow-hub==0.14.0
   ```

4. **Create Procfile**:
   ```
   web: python app.py
   ```

5. **Update app.py for production** - Change the last few lines:
   ```python
   if __name__ == "__main__":
       # ... existing code ...
       
       # Get port from environment for deployment
       port = int(os.environ.get("PORT", 5000))
       print(f"\n[READY] 🚀 http://0.0.0.0:{port}\n")
       
       socketio.run(app, host="0.0.0.0", port=port,
                   debug=False, use_reloader=False, allow_unsafe_werkzeug=True)
   ```

## Step 2: Deploy Backend

### Option A: Railway (Recommended)

1. **Install Railway CLI**:
   ```bash
   npm install -g @railway/cli
   ```

2. **Login and deploy**:
   ```bash
   cd ../backend
   railway login
   railway new
   railway up
   ```

3. **Set environment variables** in Railway dashboard:
   - `SECRET_KEY`: Generate a secure key
   - `SERIAL_PORT`: Your Arduino port  
   - `MIC_DEVICE_INDEX`: Your microphone index

4. **Get your backend URL** from Railway dashboard (e.g., `https://your-app.railway.app`)

### Option B: Heroku

1. **Install Heroku CLI** and login:
   ```bash
   heroku login
   ```

2. **Create and deploy**:
   ```bash
   cd ../backend
   git init
   git add .
   git commit -m "Initial commit"
   heroku create your-snoreshift-backend
   git push heroku main
   ```

3. **Set environment variables**:
   ```bash
   heroku config:set SECRET_KEY=your_secret_key_here
   heroku config:set SERIAL_PORT=COM5
   heroku config:set MIC_DEVICE_INDEX=1
   ```

## Step 3: Deploy Frontend

1. **Update production environment**:
   ```bash
   cd ../frontend  # Back to this directory
   ```

2. **Edit `.env.production`** with your backend URL:
   ```
   VITE_API_URL=https://your-backend-url.com
   ```

3. **Deploy to Vercel**:
   ```bash
   npm install -g vercel
   vercel --prod
   ```

4. **Or deploy to Netlify**:
   ```bash
   npm run build
   # Upload dist/ folder to Netlify
   ```

## Step 4: Test Connection

1. **Visit your frontend URL**
2. **Check connection status** - should show "Live" when backend is running
3. **Test features**:
   - FFT chart should display
   - Test buttons should work
   - Logs should populate

## Environment Variables Summary

**Backend (.env)**:
```
SECRET_KEY=your_secret_key_here
SERIAL_PORT=COM5
MIC_DEVICE_INDEX=1
PORT=5000
```

**Frontend (.env.production)**:
```
VITE_API_URL=https://your-backend-domain.com
```

## Troubleshooting

1. **CORS Issues**: Backend already has `cors_allowed_origins="*"`
2. **Connection Failed**: Check if backend URL is correct in frontend
3. **Build Errors**: Ensure all dependencies are installed
4. **Socket.IO Issues**: Verify both frontend and backend are using compatible versions

## Local Testing

Before deploying, test locally:

1. **Start backend**:
   ```bash
   cd ../backend
   python app.py
   ```

2. **Start frontend**:
   ```bash
   cd ../frontend
   npm run dev
   ```

3. **Visit**: http://localhost:3000 (or your dev server port)