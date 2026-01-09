#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Extrahiert Charakterbeispiele aus der P&P V2 Datei"""
import zipfile
import xml.etree.ElementTree as ET
import json
import sys

# Setze UTF-8 für Output
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

def get_text_from_cell(cell_elem):
    """Extrahiert Text aus einer Zelle"""
    text_parts = []
    for p in cell_elem.findall('.//{urn:oasis:names:tc:opendocument:xmlns:text:1.0}p'):
        text = ''.join(p.itertext())
        if text.strip():
            text_parts.append(text.strip())
    return ' '.join(text_parts).strip()

def read_sheet_data(sheet):
    """Liest alle Daten aus einem Blatt"""
    rows = sheet.findall('.//{urn:oasis:names:tc:opendocument:xmlns:table:1.0}table-row')
    all_data = []
    
    for row_idx in range(len(rows)):
        row = rows[row_idx]
        cells = row.findall('.//{urn:oasis:names:tc:opendocument:xmlns:table:1.0}table-cell')
        
        row_data = []
        actual_col = 0
        
        for cell in cells:
            if actual_col >= 20:  # Maximal 20 Spalten
                break
            repeated = int(cell.get('{urn:oasis:names:tc:opendocument:xmlns:table:1.0}number-columns-repeated') or '1')
            text = get_text_from_cell(cell)
            
            for _ in range(repeated):
                if actual_col >= 20:
                    break
                row_data.append(text)
                actual_col += 1
        
        # Fülle auf 20 Spalten auf
        while len(row_data) < 20:
            row_data.append('')
        
        all_data.append(row_data)
    
    return all_data

def extract_character(sheet_name, sheet_data):
    """Extrahiert Charakterdaten aus einem Blatt"""
    char = {
        'name': '',
        'playerName': sheet_name.replace('_V2', ''),
        'class': '',
        'race': '',
        'attributes': {},
        'inventory': [],
    }
    
    # Suche nach charakteristischen Zeilen
    for i, row in enumerate(sheet_data):
        row_str = ' '.join(str(cell) for cell in row[:5]).lower()
        
        # Name finden
        if 'name' in row_str and 'karakter' in row_str:
            if len(row) > 1 and row[1]:
                char['name'] = row[1]
        
        # Klasse finden
        if 'klasse' in row_str:
            if len(row) > 1 and row[1]:
                char['class'] = row[1]
        
        # Rasse finden
        if 'rasse' in row_str:
            if len(row) > 4 and row[4]:
                char['race'] = row[4]
        
        # Attribute finden (suchen nach typischen Attributnamen)
        attribute_names = ['stärke', 'geschick', 'intelligenz', 'weisheit', 'charisma', 'konstitution']
        for attr_name in attribute_names:
            if attr_name in row_str:
                # Suche nach D6-Werten in der Zeile
                for cell in row:
                    cell_str = str(cell).strip().upper()
                    if 'D' in cell_str and any(c.isdigit() for c in cell_str):
                        # Extrahiere D6-Wert
                        char['attributes'][attr_name.capitalize()] = cell_str
                        break
    
    return char

def read_characters(filepath):
    """Liest alle Charaktere aus der .ods-Datei"""
    with zipfile.ZipFile(filepath, 'r') as z:
        content = z.read('content.xml')
    
    root = ET.fromstring(content)
    
    # Finde alle Blätter (außer "Spielleiter")
    character_sheets = []
    for sheet in root.findall('.//{urn:oasis:names:tc:opendocument:xmlns:table:1.0}table'):
        name = sheet.get('{urn:oasis:names:tc:opendocument:xmlns:table:1.0}name')
        if name and name != 'Spielleiter' and not name.startswith('.'):
            character_sheets.append((name, sheet))
    
    characters = []
    
    for sheet_name, sheet in character_sheets:
        sheet_data = read_sheet_data(sheet)
        char = extract_character(sheet_name, sheet_data)
        
        # Nur wenn Name gefunden wurde
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
        print(f"Attribute: {char['attributes']}")
        print()
    
    # Speichere als JSON
    with open('characters_extracted.json', 'w', encoding='utf-8') as f:
        json.dump(characters, f, ensure_ascii=False, indent=2)
    
    print(f"Charaktere in characters_extracted.json gespeichert")

