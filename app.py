import os
import json
import re
import io
from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
from dotenv import load_dotenv
import google.generativeai as genai
from PIL import Image


load_dotenv()


app = Flask(__name__)
CORS(app)

#api
try:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("GEMINI_API_KEY not found in environment variables.")
    genai.configure(api_key=api_key)
except Exception as e:
    print(f"Error configuring Gemini API: {e}")

#maximum file size for uploads
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024
MAX_IMAGE_DIMENSION = 1024  

def resize_image(image_file):
    """
    Resizes an image if its dimensions exceed MAX_IMAGE_DIMENSION.
    This reduces API processing time and costs.
    """
    try:
        img = Image.open(image_file)
        if img.width > MAX_IMAGE_DIMENSION or img.height > MAX_IMAGE_DIMENSION:
            img.thumbnail((MAX_IMAGE_DIMENSION, MAX_IMAGE_DIMENSION))
            
           
            byte_arr = io.BytesIO()
            img.save(byte_arr, format='JPEG', quality=90)
            byte_arr.seek(0)
            
            print(f"Image resized to {img.size}")
            return byte_arr, 'image/jpeg'
        

        image_file.seek(0)
        return image_file, image_file.mimetype
    except Exception as e:
        print(f"Could not process image for resizing: {e}")
        image_file.seek(0)
        return image_file, image_file.mimetype


@app.route('/')
def index():
    """Serves the main HTML page."""
    return render_template('index.html')

@app.route('/api/analyze', methods=['POST'])
def analyze_image():
    """Analyzes the uploaded food image and returns per-gram nutritional info."""
    if 'image' not in request.files:
        return jsonify({'error': 'No image file provided.'}), 400

    file = request.files['image']

    if file.filename == '':
        return jsonify({'error': 'No image file selected.'}), 400

    try:
        
        image_stream, mime_type = resize_image(file)

        model = genai.GenerativeModel('models/gemini-2.5-flash')

#prompt
        system_prompt = """
        Analyze this food image and provide nutritional information for each identified food item.
        Your response MUST be a valid JSON object with a "foods" array.
        For each item in "foods", provide the "name" and nutritional values ("protein", "carbs", "fat", "fiber") per 100g.
        The values should be in grams, like "31g" or "3.6g".
        Example: {"foods": [{"name": "Grilled Chicken", "protein": "31g", "carbs": "0g", "fat": "3.6g", "fiber": "0g"}]}
        If you cannot identify food, return a JSON with a "message" key explaining why.
        """

        response = model.generate_content(
            contents=[
                {
                    "role": "user",
                    "parts": [
                        {"text": system_prompt},
                        {
                            "inline_data": {
                                "mime_type": mime_type,
                                "data": image_stream.read()
                            }
                        }
                    ]
                }
            ]
        )

        result_text = response.text.strip()
        result_text = re.sub(r'```json\s*', '', result_text)
        result_text = re.sub(r'```\s*', '', result_text)
        
        data = json.loads(result_text)
        
#calculate per 1 gram 
        if 'foods' in data:
            for food in data['foods']:
                for nutrient in ['protein', 'carbs', 'fat', 'fiber']:
                    if nutrient in food and isinstance(food[nutrient], str):
                        try:
                            value_match = re.search(r'(\d+\.?\d*)', food[nutrient])
                            if value_match:
                                value_100g = float(value_match.group(1))
                                food[nutrient] = f"{value_100g / 100:.2f}g"
                        except (ValueError, TypeError):
                            food[nutrient] = "N/A"

        return jsonify(data), 200

    except json.JSONDecodeError:
        return jsonify({'error': 'Failed to parse the response from the AI model.', 'raw_response': result_text}), 500
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
        return jsonify({'error': f'An unexpected error occurred: {str(e)}'}), 500

if __name__ == '__main__':
    port = int(os.getenv('FLASK_PORT', 5000))
    debug = os.getenv('FLASK_DEBUG', 'False').lower() == 'true'
    app.run(host='0.0.0.0', port=port, debug=debug)
