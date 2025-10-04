# A more robust version of the parser

def parse_raw_text(text: str) -> dict:
    """A smarter parser that handles multi-line and imperfect OCR output."""
    lines = [line.strip() for line in text.split('\n') if line.strip()]
    data = {}
    
    keywords = {
        'name': ['name', 'first name', 'first mame'],
        'last_name': ['last name'],
        'age': ['age', 'aget'],
        'gender': ['gender', 'grender'],
        'address': ['address', 'adebress linet'],
        'country': ['country'],
        'phone_number': ['phone number', 'phone', 'phonemumber'],
        'email_id': ['email id', 'email'],
    }

    # Pass 1: Find lines with a ':' separator
    remaining_lines = []
    for line in lines:
        found_on_line = False
        if ':' in line:
            parts = [p.strip() for p in line.split(':', 1)]
            if len(parts) == 2:
                key, value = parts
                for field, keys in keywords.items():
                    # Check if the field hasn't been parsed yet to avoid overwrites
                    if field not in data and any(k in key.lower() for k in keys):
                        data[field] = value
                        found_on_line = True
                        break
        if not found_on_line:
            remaining_lines.append(line)

    # Pass 2: Find keywords where the value is on the next line
    i = 0
    while i < len(remaining_lines):
        line_lower = remaining_lines[i].lower()
        if i + 1 < len(remaining_lines):
            for field, keys in keywords.items():
                # Check if the field hasn't been parsed yet
                if field not in data and any(k in line_lower for k in keys):
                    data[field] = remaining_lines[i+1]
                    i += 1 # Skip the next line as it's been consumed
                    break
        i += 1
    
    # Consolidate and Clean Up Data
    if data.get('address') and data.get('country'):
        data['address'] = f"{data.get('address')}, {data.get('country')}"

    if data.get('name') and data.get('last_name'):
        data['name'] = f"{data['name']} {data['last_name']}"

    if data.get('email_id'):
        data['email_id'] = re.sub(r'\s+', '', data['email_id']).replace('cem', 'com').replace('aail', 'gmail')

    return data