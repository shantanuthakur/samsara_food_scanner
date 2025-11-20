Food Scanner - AI Nutrition Analyzer
A Flask-based web application that uses Google's Gemini AI to analyze food images and provide detailed nutritional information.
Features

Upload food images and get instant nutritional analysis
Identifies multiple food items in a single image
Provides detailed breakdown: calories, protein, carbs, fat, and fiber
Clean, responsive UI
REST API for easy integration

Project Structure
food-scanner/
├── app.py                  # Flask backend
├── .env                    # Environment variables (create this)
├── requirements.txt        # Python dependencies
├── templates/
│   └── index.html         # Frontend HTML
└── README.md              # This file
Setup Instructions
1. Prerequisites

Python 3.8 or higher
pip (Python package manager)

2. Get Gemini API Key

Visit Google AI Studio
Sign in with your Google account
Click "Create API Key"
Copy the generated API key

3. Installation
bash# Clone or create the project directory
mkdir food-scanner
cd food-scanner

# Install required packages
pip install -r requirements.txt
4. Configuration
Create a .env file in the project root with the following content:
FLASK_PORT=5000
FLASK_DEBUG=True
GEMINI_API_KEY=your_actual_api_key_here
Replace your_actual_api_key_here with your Gemini API key.
5. Create Templates Directory
bashmkdir templates
# Place index.html inside templates folder
6. Run the Application
bashpython app.py
The application will start on http://localhost:5000
Usage

Open your browser and navigate to http://localhost:5000
Click on the upload area or drag and drop a food image
Click "Analyze Food" button
View the detailed nutritional breakdown

API Endpoints
POST /api/analyze
Analyzes food image and returns nutritional information.
Request:

Method: POST
Content-Type: multipart/form-data
Body: image file

Response:
json{
  "foods": [
    {
      "name": "Grilled Chicken",
      "serving_size": "100g",
      "calories": 165,
      "protein": "31g",
      "carbs": "0g",
      "fat": "3.6g",
      "fiber": "0g"
    }
  ],
  "total": {
    "calories": 165,
    "protein": "31g",
    "carbs": "0g",
    "fat": "3.6g",
    "fiber": "0g"
  }
}
GET /api/health
Health check endpoint to verify API configuration.
Response:
json{
  "status": "healthy",
  "gemini_api_configured": true
}
Environment Variables
VariableDescriptionDefaultFLASK_PORTPort number for Flask server5000FLASK_DEBUGEnable debug modeFalseGEMINI_API_KEYGoogle Gemini API keyRequired
Troubleshooting
API Key Issues

Ensure your .env file is in the project root
Verify the API key is correct and active
Check that you have API quota remaining

Image Upload Issues

Maximum file size is 16MB
Supported formats: JPG, PNG
Ensure the image contains visible food items

Port Already in Use
Change the FLASK_PORT in .env to a different port (e.g., 5001, 8000)
Security Notes

Never commit .env file to version control
Add .env to .gitignore
Keep your API key confidential
Use environment variables for sensitive data

Dependencies

Flask: Web framework
flask-cors: CORS support
google-generativeai: Gemini AI integration
python-dotenv: Environment variable management
Pillow: Image processing

License
MIT License - Feel free to use and modify for your projects.
Support
For issues with:

Gemini API: Check Google AI documentation
Flask: Visit Flask documentation
