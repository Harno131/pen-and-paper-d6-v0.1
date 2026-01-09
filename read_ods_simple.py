#!/usr/bin/env python3
"""Liest eine .ods-Datei direkt als ZIP und extrahiert das Gesinnungs-Quadrat"""
import zipfile
import xml.etree.ElementTree as ET
import re

def get_text_from_cell(cell_elem):
    """Extrahiert Text aus einer Zelle"""
    text_parts = []
    for p in cell_elem.findall('.//{urn:oasis:names:tc:opendocument:xmlns:text:1.0}p'):
        text = ''.join(p.itertext())
        text_parts.append(text)
    return ' '.join(text_parts).strip()

def read_gesinnung(filepath):
    """Liest das Gesinnungs-Quadrat aus der .ods-Datei"""
    with zipfile.ZipFile(filepath, 'r') as z:
        # Lese content.xml
        content = z.read('content.xml')
    
    # Parse XML
    root = ET.fromstring(content)
    
    # Namespace-Definitionen
    ns = {
        'table': 'urn:oasis:names:tc:opendocument:xmlns:table:1.0',
        'text': 'urn:oasis:names:tc:opendocument:xmlns:text:1.0',
        'office': 'urn:oasis:names:tc:opendocument:xmlns:office:1.0'
    }
    
    # Suche nach dem Blatt "Gesinnung"
    gesinnung_sheet = None
    for sheet in root.findall('.//{urn:oasis:names:tc:opendocument:xmlns:table:1.0}table'):
        name_attr = sheet.get('{urn:oasis:names:tc:opendocument:xmlns:table:1.0}name')
        if name_attr == 'Gesinnung':
            gesinnung_sheet = sheet
            break
    
    if not gesinnung_sheet:
        print("Blatt 'Gesinnung' nicht gefunden!")
        # Liste alle verfügbaren Blätter
        print("\nVerfügbare Blätter:")
        for sheet in root.findall('.//{urn:oasis:names:tc:opendocument:xmlns:table:1.0}table'):
            print(f"  - {sheet.get('{urn:oasis:names:tc:opendocument:xmlns:table:1.0}name')}")
        return None
    
    # Lese die ersten 3 Zeilen und 3 Spalten
    gesinnungen = {}
    rows = gesinnung_sheet.findall('.//{urn:oasis:names:tc:opendocument:xmlns:table:1.0}table-row')
    
    for row_idx in range(min(3, len(rows))):
        row = rows[row_idx]
        cells = row.findall('.//{urn:oasis:names:tc:opendocument:xmlns:table:1.0}table-cell')
        
        # Berücksichtige wiederholte Zellen (table:number-columns-repeated)
        actual_col = 0
        for cell in cells:
            if actual_col >= 3:
                break
                
            # Prüfe auf wiederholte Zellen
            repeated = int(cell.get('{urn:oasis:names:tc:opendocument:xmlns:table:1.0}number-columns-repeated') or '1')
            
            text = get_text_from_cell(cell)
            
            for _ in range(repeated):
                if actual_col >= 3:
                    break
                key = f"{row_idx}-{actual_col}"
                gesinnungen[key] = text
                actual_col += 1
    
    return gesinnungen

if __name__ == "__main__":
    filepath = "Spielleiter-Infos - geheim!.ods"
    result = read_gesinnung(filepath)
    
    if result:
        print("Gesinnungen gefunden (3x3 Quadrat):\n")
        for row in range(3):
            for col in range(3):
                key = f"{row}-{col}"
                value = result.get(key, "")
                print(f"Zeile {row+1}, Spalte {col+1}: {value}")
    else:
        print("Fehler beim Lesen der Datei")

