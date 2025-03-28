from flask import Flask, request, jsonify
import requests
import pickle
import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler
from sklearn.impute import SimpleImputer
import logging
from functools import lru_cache

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = Flask(__name__)

file_path = "medicine_quality_model.pkl"  # Ensure the correct path

# Load the model and preprocessing components
with open(file_path, "rb") as model_file:
    model, ingredient_encoder, scaler, imputer, features = pickle.load(model_file)

@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.get_json()
        
        # Extract features from request
        input_data = {}
        for feature in features:
            input_data[feature] = data.get(feature, None)
        
        # Convert to DataFrame
        input_df = pd.DataFrame([input_data])
        
        # Return helpful error if missing features
        missing_features = [f for f in features if f not in data]
        if missing_features:
            return jsonify({
                'error': f'Missing features: {", ".join(missing_features)}',
                'required_features': features
            }), 400
        
        # Encode the Active Ingredient
        if 'Active Ingredient' in input_df.columns:
            # Handle unseen active ingredients
            if input_df["Active Ingredient"][0] not in ingredient_encoder.classes_:
                # Use the most frequent class as fallback
                input_df["Active Ingredient"] = ingredient_encoder.transform([ingredient_encoder.classes_[0]])[0]
            else:
                input_df["Active Ingredient"] = ingredient_encoder.transform(input_df["Active Ingredient"])
        
        # Apply imputation to handle any missing numerical values
        preprocessed_data = pd.DataFrame(imputer.transform(input_df), columns=features)
        
        # Apply scaling to normalize the data
        preprocessed_data = pd.DataFrame(scaler.transform(preprocessed_data), columns=features)
        
        # Predict
        prediction = model.predict(preprocessed_data)[0]
        
        # Get prediction probabilities
        try:
            prediction_proba = model.predict_proba(preprocessed_data)[0].tolist()
        except:
            prediction_proba = [0, 1] if prediction == 1 else [1, 0]
        
        # Convert numeric prediction back to label (Safe/Not Safe)
        # Note: Your model seems to use 1 for "Safe" and 0 for "Not Safe" based on your example function
        result = "Safe" if prediction == 1 else "Not Safe"
        
        return jsonify({
            'prediction': result,
            'prediction_value': int(prediction),
            'confidence': prediction_proba,
            'features_received': input_data
        })
        
    except Exception as e:
        import traceback
        traceback.print_exc()  # Print the full traceback for debugging
        return jsonify({'error': str(e)}), 500
    
class MedicineSafetyChecker:

    def __init__(self, timeout=10):
        """
        Initialize the safety checker.
        
        Args:
            timeout: Timeout for API requests in seconds
        """
        self.timeout = timeout
        self.sources = {
            "openfda": {"url": "https://api.fda.gov/drug/label.json", "enabled": True}
        }
    
    @lru_cache(maxsize=128)
    def get_drug_safety_from_openfda(self, medicine_name):
        """
        Fetch safety warnings & side effects from OpenFDA API.
        Uses multiple search strategies to find medications.
        """
        # Define common alternative names for medications
        alternative_names = {
            # Common pain relievers
            "paracetamol": ["acetaminophen", "tylenol"],
            "acetaminophen": ["paracetamol", "tylenol"],
            "ibuprofen": ["advil", "motrin", "nurofen"],
            "aspirin": ["acetylsalicylic acid", "asa"],
            
            # Common antibiotics
            "amoxicillin": ["amox", "amoxil"],
            "azithromycin": ["zithromax", "z-pak"],
            "ciprofloxacin": ["cipro"],
            
            # Common antidepressants
            "fluoxetine": ["prozac"],
            "sertraline": ["zoloft"],
            "escitalopram": ["lexapro"],
            
            # Common blood pressure medications
            "lisinopril": ["prinivil", "zestril"],
            "amlodipine": ["norvasc"],
            "losartan": ["cozaar"],
            
            # Common antihistamines
            "loratadine": ["claritin"],
            "cetirizine": ["zyrtec"],
            "fexofenadine": ["allegra"],
            
            # Common statins
            "atorvastatin": ["lipitor"],
            "simvastatin": ["zocor"],
            "rosuvastatin": ["crestor"],
            
            # Common diabetes medications
            "metformin": ["glucophage"],
            "glipizide": ["glucotrol"],
            "insulin": ["lantus", "humalog", "novolog"],
            
            # Common asthma medications
            "albuterol": ["salbutamol", "ventolin", "proair"],
            "salbutamol": ["albuterol", "ventolin", "proair"],
            "fluticasone": ["flonase", "flovent"],
            
            # Common heartburn medications
            "omeprazole": ["prilosec"],
            "esomeprazole": ["nexium"],
            "ranitidine": ["zantac"],
            
            # Add more as needed...
        }
        
        # List of search strategies to try in order
        search_strategies = [
            # First try exact brand name match
            lambda name: f"{self.sources['openfda']['url']}?search=openfda.brand_name:\"{name}\"",
            # Then try exact generic name match
            lambda name: f"{self.sources['openfda']['url']}?search=openfda.generic_name:\"{name}\"",
            # Then try substring in brand name
            lambda name: f"{self.sources['openfda']['url']}?search=openfda.brand_name:{name}",
            # Then try substring in generic name
            lambda name: f"{self.sources['openfda']['url']}?search=openfda.generic_name:{name}",
            # Then try active ingredient field
            lambda name: f"{self.sources['openfda']['url']}?search=active_ingredient:{name}",
            # Then try a general search
            lambda name: f"{self.sources['openfda']['url']}?search={name}"
        ]
        
        # Names to try - start with the original name
        names_to_try = [medicine_name]
        
        # Add alternative names if available
        med_name_lower = medicine_name.lower()
        if med_name_lower in alternative_names:
            names_to_try.extend(alternative_names[med_name_lower])
        
        # Try each name with each search strategy
        for name in names_to_try:
            for strategy in search_strategies:
                try:
                    url = strategy(name)
                    logger.info(f"Trying URL: {url}")
                    response = requests.get(url, timeout=self.timeout)
                    
                    if response.status_code == 200 and response.json().get('results'):
                        logger.info(f"Found data for {medicine_name} using search strategy: {url}")
                        return {
                            "source": "OpenFDA", 
                            "status": "success",
                            "data": response.json()
                        }
                    else:
                        logger.debug(f"No results for {name} with URL: {url}")
                except Exception as e:
                    logger.error(f"Error fetching data for {name} with URL {url}: {str(e)}")
        
        # If all strategies failed, return None
        logger.warning(f"No data found for {medicine_name} after trying all search strategies")
        return None


    def format_results(self, results):
        """Format the results into a simplified structure."""
        formatted = {
            "medicine_name": results["medicine_name"],
            "disease": results.get("disease", "Not specified"),
            "found_data": results.get("found_data", False)
        }
        
        if "results" in results and "openfda" in results["results"] and "data" in results["results"]["openfda"]:
            focused_info = self._extract_focused_info(results["results"]["openfda"]["data"])
            formatted.update(focused_info)
        
        return formatted
    

    def check_medicine_safety(self, medicine_name, disease=None):
        """
        Check medicine safety using OpenFDA.
        """
        results = {
            "medicine_name": medicine_name,
            "disease": disease,
            "results": {}
        }
        
        data = self.get_drug_safety_from_openfda(medicine_name)
        if data:
            results["results"]["openfda"] = data
            results["found_data"] = True
        else:
            results["found_data"] = False
            results["message"] = "No data found"
            
        return results
    
    def _extract_focused_info(self, data):
        """Extract only the essential information from OpenFDA data."""
        extracted = {
            "medicine_name": "Unknown",
            "used_for": "Information not available",
            "safety_tips": "Information not available",
            "medical_advice": "Information not available"
        }
        
        try:
            results = data.get("results", [])
            if not results:
                return extracted
                
            result = results[0]
            openfda = result.get("openfda", {})
            
            # Get medicine name - try multiple sources
            # 1. First check openfda fields
            if "brand_name" in openfda and openfda["brand_name"]:
                extracted["medicine_name"] = openfda["brand_name"][0]
            elif "generic_name" in openfda and openfda["generic_name"]:
                extracted["medicine_name"] = openfda["generic_name"][0]
            else:
                # 2. Try active_ingredient field
                if "active_ingredient" in result and result["active_ingredient"]:
                    active = result["active_ingredient"][0]
                    # The active ingredient is often in format like "Active ingredient NAME XXX mg"
                    parts = active.split()
                    if len(parts) > 2:
                        # Extract the name part - usually after "ingredient" or "ingredients"
                        ingredient_index = -1
                        for i, part in enumerate(parts):
                            if part.lower() in ["ingredient", "ingredients"]:
                                ingredient_index = i
                                break
                        
                        if ingredient_index >= 0 and ingredient_index + 1 < len(parts):
                            extracted["medicine_name"] = parts[ingredient_index + 1].capitalize()
                
                # 3. Try spl_product_data_elements which often contains the drug name
                if extracted["medicine_name"] == "Unknown" and "spl_product_data_elements" in result and result["spl_product_data_elements"]:
                    elements = result["spl_product_data_elements"][0].split()
                    if len(elements) > 2:
                        # Extract the first capitalized word that might be the drug name
                        for word in elements:
                            if word[0].isupper() and len(word) > 2 and word.lower() not in ["l-oral"]:
                                extracted["medicine_name"] = word.capitalize()
                                break
            
            # Get what it's used for
            if "indications_and_usage" in result and result["indications_and_usage"]:
                extracted["used_for"] = result["indications_and_usage"][0]
            
            # Get safety tips
            safety_sections = []
            if "boxed_warnings" in result and result["boxed_warnings"]:
                safety_sections.append("BOXED WARNING: " + result["boxed_warnings"][0])
            if "warnings" in result and result["warnings"]:
                safety_sections.append(result["warnings"][0])
            if "precautions" in result and result["precautions"]:
                safety_sections.append(result["precautions"][0])
            
            if safety_sections:
                extracted["safety_tips"] = "\n\n".join(safety_sections)
            
            # Get medical advice
            advice_sections = []
            if "dosage_and_administration" in result and result["dosage_and_administration"]:
                advice_sections.append("DOSAGE: " + result["dosage_and_administration"][0])
            if "drug_interactions" in result and result["drug_interactions"]:
                advice_sections.append("INTERACTIONS: " + result["drug_interactions"][0])
            if "pregnancy" in result and result["pregnancy"]:
                advice_sections.append("PREGNANCY: " + result["pregnancy"][0])
            
            if advice_sections:
                extracted["medical_advice"] = "\n\n".join(advice_sections)
            
        except Exception as e:
            logger.error(f"Error extracting focused info: {str(e)}")
            
        return extracted
    
    def get_simplified_medicine_info(self, medicine_name, disease=None):
        """Get simplified medicine information."""
        # Get raw results
        results = self.check_medicine_safety(medicine_name, disease)
        
        # Format results
        formatted_results = self.format_results(results)
        
        # Return formatted results
        return formatted_results

# Initialize the checker
medicine_checker = MedicineSafetyChecker()

# API endpoints that can be called from your Node.js application
@app.route('/api/medicine/<medicine_name>', methods=['GET'])
def medicine_api(medicine_name):
    disease = request.args.get('disease', None)
    medicine_info = medicine_checker.get_simplified_medicine_info(medicine_name, disease)
    return jsonify(medicine_info)

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy'})

@app.after_request
def add_cors_headers(response):
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
    return response

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)