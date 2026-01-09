#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Extrahiert vollständige Charakterbeispiele aus der P&P V2 Datei"""
import zipfile
import xml.etree.ElementTree as ET
import json
import sys
import re

if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

def get_text_from_cell(cell_elem):
    text_parts = []
    for p in cell_elem.findall('.//{urn:oasis:names:tc:opendocument:xmlns:text:1.0}p'):
        text = ''.join(p.itertext())
        if text.strip():
            text_parts.append(text.strip())
    return ' '.join(text_parts).strip()

def read_sheet_data(sheet):
    rows = sheet.findall('.//{urn:oasis:names:tc:opendocument:xmlns:table:1.0}table-row')
    all_data = []
    
    for row_idx in range(len(rows)):
        row = rows[row_idx]
        cells = row.findall('.//{urn:oasis:names:tc:opendocument:xmlns:table:1.0}table-cell')
        
        row_data = []
        actual_col = 0
        
        for cell in cells:
            if actual_col >= 15:
                break
            repeated = int(cell.get('{urn:oasis:names:tc:opendocument:xmlns:table:1.0}number-columns-repeated') or '1')
            text = get_text_from_cell(cell)
            
            for _ in range(repeated):
                if actual_col >= 15:
                    break
                row_data.append(text)
                actual_col += 1
        
        while len(row_data) < 15:
            row_data.append('')
        
        all_data.append(row_data)
    
    return all_data

def convert_w_to_d(value):
    """Konvertiert '2W' zu '2D', '3W+1' zu '3D+1', etc."""
    if not value:
        return ''
    # Ersetze W mit D (case-insensitive)
    result = re.sub(r'(\d+)W', r'\1D', str(value), flags=re.IGNORECASE)
    return result.upper()

def extract_character(sheet_name, sheet_data):
    char = {
        'name': '',
        'playerName': sheet_name.replace('_V2', '').replace('__V2', ''),
        'class': '',
        'race': '',
        'level': '',
        'attributes': {},
        'inventory': [],
    }
    
    attribute_names_map = {
        'stärke': 'Stärke',
        'geschicklichkeit': 'Geschicklichkeit',
        'intelligenz': 'Intelligenz',
        'weisheit': 'Weisheit',
        'charisma': 'Charisma',
        'konstitution': 'Konstitution',
    }
    
    # Durchsuche alle Zeilen
    for i, row in enumerate(sheet_data):
        if not row or len(row) == 0:
            continue
        
        row_str = ' '.join(str(cell).lower() for cell in row[:8] if cell)
        
        # Name finden
        if 'name' in row_str and 'karakter' in row_str:
            if len(row) > 1 and row[1]:
                char['name'] = row[1]
            if len(row) > 7 and row[7]:
                char['playerName'] = row[7]
        
        # Klasse finden
        if 'klasse' in row_str:
            if len(row) > 1 and row[1]:
                char['class'] = row[1]
        
        # Rasse finden
        if 'rasse' in row_str:
            if len(row) > 4 and row[4]:
                char['race'] = row[4]
        
        # Stufe finden
        if 'stufe' in row_str:
            if len(row) > 7 and row[7]:
                char['level'] = row[7]
        
        # Attribute finden
        for attr_key, attr_name in attribute_names_map.items():
            if attr_key in row_str:
                # Suche nach D6/W-Werten in der Zeile
                for cell_idx, cell in enumerate(row):
                    cell_str = str(cell).strip().upper()
                    # Suche nach W/D-Format (z.B. "2W", "2D", "3W+1", "2D+2")
                    if 'W' in cell_str or 'D' in cell_str:
                        dice_value = convert_w_to_d(cell_str)
                        # Prüfe ob es ein gültiger D6-Wert ist
                        if re.match(r'^\d+D(\+\d+)?$', dice_value):
                            char['attributes'][attr_name] = dice_value
                            break
                    # Alternative: Suche in Spalte 4 (manchmal steht der Wert dort)
                    if cell_idx == 4 and cell_str and ('W' in cell_str or 'D' in cell_str):
                        dice_value = convert_w_to_d(cell_str)
                        if re.match(r'^\d+D(\+\d+)?$', dice_value):
                            char['attributes'][attr_name] = dice_value
    
    return char

def read_characters(filepath):
    with zipfile.ZipFile(filepath, 'r') as z:
        content = z.read('content.xml')
    
    root = ET.fromstring(content)
    
    # Bevorzuge V2-Versionen, aber sammle alle
    character_sheets = {}
    for sheet in root.findall('.//{urn:oasis:names:tc:opendocument:xmlns:table:1.0}table'):
        name = sheet.get('{urn:oasis:names:tc:opendocument:xmlns:table:1.0}name')
        if name and name != 'Spielleiter' and not name.startswith('.'):
            base_name = name.replace('_V2', '').replace('__V2', '')
            # Bevorzuge V2-Versionen
            if '_V2' in name or '__V2' in name:
                character_sheets[base_name] = (name, sheet)
            elif base_name not in character_sheets:
                character_sheets[base_name] = (name, sheet)
    
    characters = []
    
    for base_name, (sheet_name, sheet) in character_sheets.items():
        sheet_data = read_sheet_data(sheet)
        char = extract_character(sheet_name, sheet_data)
        
        if char['name']:
            characters.append(char)
    
    return characters

if __name__ == "__main__":
    filepath = "P&P V2 22_05_2021.ods"
    characters = read_characters(filepath)
    
    print(f"Gefundene Charaktere: {len(characters)}\n")
    
    for char in characters:
        print(f"Name: {char['name']}")
        print(f"Spieler: {char['playerName']}")
        print(f"Klasse: {char['class']}")
        print(f"Rasse: {char['race']}")
        if char['level']:
            print(f"Stufe: {char['level']}")
        print(f"Attribute: {char['attributes']}")
        print()
    
    with open('characters_complete.json', 'w', encoding='utf-8') as f:
        json.dump(characters, f, ensure_ascii=False, indent=2)
    
    print(f"Charaktere in characters_complete.json gespeichert")

