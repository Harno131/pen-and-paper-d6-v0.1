#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Extrahiert alle Attribute aus den V2-Blättern"""
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
    if not value:
        return ''
    result = re.sub(r'(\d+)W', r'\1D', str(value), flags=re.IGNORECASE)
    return result.upper()

def extract_character_complete(sheet_name, sheet_data):
    char = {
        'name': '',
        'playerName': sheet_name.replace('_V2', '').replace('__V2', '').replace('Korbi', 'Kobi'),
        'class': '',
        'race': '',
        'level': '',
        'attributes': {},
        'inventory': [],
    }
    
    # Attribute-Mapping
    attr_map = {
        'stärke': 'Stärke',
        'geschicklichkeit': 'Geschicklichkeit',
        'intelligenz': 'Intelligenz',
        'weisheit': 'Weisheit',
        'charisma': 'Charisma',
        'konstitution': 'Konstitution',
    }
    
    # Durchsuche alle Zeilen
    for i, row in enumerate(sheet_data):
        if not row:
            continue
        
        # Erste Spalte für Attributname, vierte Spalte für D6-Wert
        first_cell = str(row[0] if len(row) > 0 else '').strip().lower()
        
        # Prüfe auf Attributnamen
        for attr_key, attr_name in attr_map.items():
            if attr_key in first_cell:
                # Suche D6-Wert in Spalte 4 (Index 4)
                if len(row) > 4 and row[4]:
                    dice_value = convert_w_to_d(str(row[4]))
                    if re.match(r'^\d+D(\+\d+)?$', dice_value):
                        char['attributes'][attr_name] = dice_value
                        print(f"  {attr_name}: {dice_value} (Zeile {i})")
        
        # Name, Klasse, Rasse aus Original-Blättern holen
        row_str = ' '.join(str(cell).lower() for cell in row[:8] if cell)
        
        if 'name' in row_str and 'karakter' in row_str:
            if len(row) > 1 and row[1]:
                char['name'] = row[1]
            if len(row) > 7 and row[7]:
                char['playerName'] = row[7]
        
        if 'klasse' in row_str and len(row) > 1:
            char['class'] = row[1]
        
        if 'rasse' in row_str and len(row) > 4:
            char['race'] = row[4]
        
        if 'stufe' in row_str and len(row) > 7:
            char['level'] = row[7]
    
    return char

def merge_character_data(base_char, v2_char):
    """Fügt V2-Daten zu Basis-Charakter hinzu"""
    merged = base_char.copy()
    
    # V2 hat Vorrang für Attribute
    if v2_char.get('attributes'):
        merged['attributes'] = {**merged.get('attributes', {}), **v2_char['attributes']}
    
    # V2 hat Vorrang für andere Felder, wenn vorhanden
    for key in ['class', 'race', 'level']:
        if v2_char.get(key):
            merged[key] = v2_char[key]
    
    return merged

if __name__ == "__main__":
    filepath = "P&P V2 22_05_2021.ods"
    with zipfile.ZipFile(filepath, 'r') as z:
        content = z.read('content.xml')
    
    root = ET.fromstring(content)
    
    # Sammle alle Blätter
    all_sheets = {}
    for sheet in root.findall('.//{urn:oasis:names:tc:opendocument:xmlns:table:1.0}table'):
        name = sheet.get('{urn:oasis:names:tc:opendocument:xmlns:table:1.0}name')
        if name and name != 'Spielleiter' and not name.startswith('.'):
            all_sheets[name] = sheet
    
    # Extrahiere Basis-Charaktere
    base_chars = {}
    v2_chars = {}
    
    for sheet_name, sheet in all_sheets.items():
        sheet_data = read_sheet_data(sheet)
        char = extract_character_complete(sheet_name, sheet_data)
        
        if '_V2' in sheet_name or '__V2' in sheet_name:
            base_name = sheet_name.replace('_V2', '').replace('__V2', '').replace('Korbi', 'Kobi')
            v2_chars[base_name] = char
        else:
            base_chars[sheet_name] = char
    
    # Merge Basis und V2
    characters = []
    all_names = set(list(base_chars.keys()) + list(v2_chars.keys()))
    
    for name in all_names:
        base_char = base_chars.get(name, {})
        v2_char = v2_chars.get(name, {})
        
        if v2_char:
            merged = merge_character_data(base_char, v2_char)
        else:
            merged = base_char
        
        if merged.get('name') or merged.get('attributes'):
            characters.append(merged)
    
    print(f"\nGefundene Charaktere: {len(characters)}\n")
    
    for char in characters:
        print(f"Name: {char.get('name', 'Unbekannt')}")
        print(f"Spieler: {char.get('playerName', 'Unbekannt')}")
        print(f"Klasse: {char.get('class', 'Unbekannt')}")
        print(f"Rasse: {char.get('race', 'Unbekannt')}")
        print(f"Attribute: {char.get('attributes', {})}")
        print()
    
    with open('characters_final.json', 'w', encoding='utf-8') as f:
        json.dump(characters, f, ensure_ascii=False, indent=2)
    
    print("Charaktere in characters_final.json gespeichert")

