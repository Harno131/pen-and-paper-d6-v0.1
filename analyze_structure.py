#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Analysiert die Struktur der Charakterblätter"""
import zipfile
import xml.etree.ElementTree as ET
import sys

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

def analyze_sheet(sheet_name, sheet):
    rows = sheet.findall('.//{urn:oasis:names:tc:opendocument:xmlns:table:1.0}table-row')
    
    print(f"\n{'='*60}")
    print(f"Blatt: {sheet_name}")
    print(f"{'='*60}\n")
    
    for row_idx in range(min(30, len(rows))):
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
        
        if any(row_data):
            # Zeige Zeilen mit interessanten Inhalten
            row_str = ' '.join(str(c) for c in row_data[:5]).lower()
            if any(keyword in row_str for keyword in ['name', 'klasse', 'rasse', 'stärke', 'geschick', 'intelligenz', 'weisheit', 'charisma', 'konstitution', '1d', '2d', '3d']):
                print(f"Zeile {row_idx:2d}: {row_data[:8]}")

if __name__ == "__main__":
    filepath = "P&P V2 22_05_2021.ods"
    with zipfile.ZipFile(filepath, 'r') as z:
        content = z.read('content.xml')
    
    root = ET.fromstring(content)
    
    # Analysiere Charakterblätter
    for sheet in root.findall('.//{urn:oasis:names:tc:opendocument:xmlns:table:1.0}table'):
        name = sheet.get('{urn:oasis:names:tc:opendocument:xmlns:table:1.0}name')
        if name and name not in ['Spielleiter'] and not name.startswith('.'):
            analyze_sheet(name, sheet)

