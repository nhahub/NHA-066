
import base64
from pathlib import Path

def image_to_base64(image_path):
    try:
        file_path = Path(image_path)
        
        with open(file_path, 'rb') as image_file:
            base64_encoded = base64.b64encode(image_file.read()).decode('utf-8')
        return f"data:image/jpeg;base64,{base64_encoded}"
    except Exception as e:
        print(f"Error converting image to base64: {e}")
        return None
