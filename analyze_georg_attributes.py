#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Analysiert die Attribute im Blatt Georg (Zeilen 9-30)"""
import zipfile
import xml.etree.ElementTree as ET
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

def analyze_georg_sheet(filepath):
    with zipfile.ZipFile(filepath, 'r') as z:
        content = z.read('content.xml')
    
    root = ET.fromstring(content)
    
    # Finde Blatt "Georg"
    georg_sheet = None
    for sheet in root.findall('.//{urn:oasis:names:tc:opendocument:xmlns:table:1.0}table'):
        name = sheet.get('{urn:oasis:names:tc:opendocument:xmlns:table:1.0}name')
        if name == 'Georg':
            georg_sheet = sheet
            break
    
    if not georg_sheet:
        print("Blatt 'Georg' nicht gefunden!")
        return
    
    rows = georg_sheet.findall('.//{urn:oasis:names:tc:opendocument:xmlns:table:1.0}table-row')
    
    print("=== Attribute im Blatt Georg (Zeilen 9-30) ===\n")
    
    attributes = []
    
    for row_idx in range(9, min(31, len(rows))):
        row = rows[row_idx]
        cells = row.findall('.//{urn:oasis:names:tc:opendocument:xmlns:table:1.0}table-cell')
        
        row_data = []
        actual_col = 0
        
        for cell in cells:
            if actual_col >= 10:
                break
            repeated = int(cell.get('{urn:oasis:names:tc:opendocument:xmlns:table:1.0}number-columns-repeated') or '1')
            text = get_text_from_cell(cell)
            
            for _ in range(repeated):
                if actual_col >= 10:
                    break
                row_data.append(text)
                actual_col += 1
        
        # Zeige Zeilen mit Inhalt
        if any(row_data):
            attr_name = row_data[0] if len(row_data) > 0 else ''
            base_value = row_data[1] if len(row_data) > 1 else ''
            bonus_value = row_data[2] if len(row_data) > 2 else ''
            total_value = row_data[4] if len(row_data) > 4 else ''
            
            # Prüfe ob es ein Attribut ist (hat einen Namen und einen Wert)
            if attr_name and (base_value or total_value):
                attr_info = {
                    'row': row_idx,
                    'name': attr_name,
                    'base': base_value,
                    'bonus': bonus_value,
                    'total': total_value
                }
                attributes.append(attr_info)
                print(f"Zeile {row_idx:2d}: {attr_name:20s} | Basis: {base_value:5s} | Bonus: {bonus_value:5s} | Gesamt: {total_value}")
    
    print(f"\nGefundene Attribute: {len(attributes)}")
    
    # Speichere als JSON
    import json
    with open('georg_attributes.json', 'w', encoding='utf-8') as f:
        json.dump(attributes, f, ensure_ascii=False, indent=2)
    
    print("Attribute in georg_attributes.json gespeichert")
    
    return attributes

if __name__ == "__main__":
    filepath = "P&P V2 22_05_2021.ods"
    analyze_georg_sheet(filepath)

