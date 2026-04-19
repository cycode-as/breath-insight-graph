@echo off
echo Setting up SnoreShift for deployment...

echo.
echo Step 1: Creating backend directory...
cd ..
mkdir backend 2>nul
cd backend

echo.
echo Step 2: Copy your app.py file to this backend directory
echo Then run the following commands:

echo.
echo Step 3: Install Python dependencies
echo pip install -r requirements.txt

echo.
echo Step 4: Test backend locally
echo python app.py

echo.
echo Step 5: Deploy backend to Railway
echo railway login
echo railway new
echo railway up

echo.
echo Step 6: Update frontend environment
cd ..\frontend
echo Edit .env.production with your backend URL

echo.
echo Step 7: Deploy frontend
echo npm run build
echo vercel --prod

echo.
echo Setup complete! Follow the DEPLOYMENT_GUIDE.md for detailed instructions.
pause