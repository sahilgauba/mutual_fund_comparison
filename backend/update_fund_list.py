import requests
import json
import re
import time

# Define the path to the utils.py file
UTILS_FILE_PATH = 'utils.py'
MFAPI_URL_LATEST = "https://api.mfapi.in/mf/{}/latest"

def get_current_funds(file_path):
    """Extracts the current ALL_FUNDS list from utils.py."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Use regex to find the ALL_FUNDS list definition
        match = re.search(r'ALL_FUNDS\s*=\s*(\[.*?\])', content, re.DOTALL)
        if match:
            # Raw string including comments
            raw_list_str = match.group(1)
            
            # Remove comment lines
            lines = raw_list_str.strip().split('\n')
            cleaned_lines = []
            for line in lines:
                stripped_line = line.strip()
                if not stripped_line.startswith('#'):
                    cleaned_lines.append(stripped_line)
            
            # Join cleaned lines and replace single quotes
            cleaned_list_str = ' '.join(cleaned_lines).replace("'", '"')

            # Remove trailing commas before closing brackets/braces if any exist
            cleaned_list_str = re.sub(r',\s*([}\]])', r'\1', cleaned_list_str)
            
            try:
                current_funds = json.loads(cleaned_list_str)
                print(f"Found {len(current_funds)} funds in current list.")
                return current_funds
            except json.JSONDecodeError as e:
                print(f"Error decoding JSON from cleaned ALL_FUNDS string: {e}")
                print("Cleaned list string attempted:", cleaned_list_str)
                return []
        else:
            print("Could not find ALL_FUNDS list in utils.py")
            return []
    except FileNotFoundError:
        print(f"Error: {file_path} not found.")
        return []
    except Exception as e:
        print(f"An error occurred reading {file_path}: {e}")
        return []

def fetch_fund_name(scheme_code):
    """Fetches the scheme name from MFAPI for a given code."""
    try:
        url = MFAPI_URL_LATEST.format(scheme_code)
        response = requests.get(url, timeout=10) # Added timeout
        response.raise_for_status()
        data = response.json()
        if data.get('status') == 'SUCCESS':
            return data.get('meta', {}).get('scheme_name', 'Unknown Scheme Name')
        else:
            print(f"API status not SUCCESS for {scheme_code}: {data.get('status')}")
            return None
    except requests.exceptions.RequestException as e:
        print(f"Error fetching data for {scheme_code}: {e}")
        return None
    except json.JSONDecodeError:
        print(f"Error decoding JSON response for {scheme_code}. Response: {response.text}")
        return None
    except Exception as e:
        print(f"An unexpected error occurred for {scheme_code}: {e}")
        return None

def update_utils_file(file_path, corrected_funds_list):
    """Replaces the ALL_FUNDS list in utils.py with the corrected one."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        # Format the corrected list into a Python string representation
        # Use indentation for readability
        corrected_list_str = json.dumps(corrected_funds_list, indent=4)
        # Ensure it looks like a Python list assignment
        new_list_definition = f"ALL_FUNDS = {corrected_list_str}"

        # Use regex to replace the old list definition
        # This regex finds 'ALL_FUNDS = [' potentially across multiple lines
        new_content = re.sub(r'ALL_FUNDS\s*=\s*\[.*?\]', new_list_definition, content, count=1, flags=re.DOTALL)

        if new_content == content:
            print("Error: Could not find and replace ALL_FUNDS list in the file.")
            return False

        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Successfully updated {file_path}")
        return True
    except Exception as e:
        print(f"An error occurred writing to {file_path}: {e}")
        return False

if __name__ == "__main__":
    print("Starting fund list update...")
    current_funds = get_current_funds(UTILS_FILE_PATH)
    
    if not current_funds:
        print("Exiting: Could not retrieve current funds.")
    else:
        corrected_funds = []
        print("Fetching updated names from MFAPI...")
        for fund in current_funds:
            scheme_code = fund.get('schemeCode')
            if scheme_code:
                print(f"Checking Scheme Code: {scheme_code}...")
                correct_name = fetch_fund_name(scheme_code)
                if correct_name:
                    corrected_funds.append({
                        'schemeCode': scheme_code,
                        'schemeName': correct_name
                    })
                    print(f"  -> Found: {correct_name}")
                else:
                    print(f"  -> Failed to fetch name for {scheme_code}. Keeping original entry.")
                    # Optionally keep the original entry if API fails
                    corrected_funds.append(fund) 
                time.sleep(0.5) # Add a small delay to avoid overwhelming the API
            else:
                print(f"Skipping entry without schemeCode: {fund}")
                corrected_funds.append(fund) # Keep entries without schemeCode as is

        print("\nUpdate complete. Corrected Fund List:")
        for fund in corrected_funds:
             print(f"  {fund['schemeCode']}: {fund['schemeName']}")

        if update_utils_file(UTILS_FILE_PATH, corrected_funds):
            print("\nSuccessfully updated ALL_FUNDS in utils.py.")
        else:
            print("\nFailed to update utils.py automatically.")
            print("Please manually update the ALL_FUNDS list in utils.py with the corrected list above.")

    print("Script finished.") 