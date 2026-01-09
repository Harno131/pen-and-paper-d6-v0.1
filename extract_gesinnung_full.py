#!/usr/bin/env python3
"""Extrahiert Gesinnungen mit vollständigen Beschreibungen"""
import zipfile
import xml.etree.ElementTree as ET
import json

def get_text_from_cell(cell_elem):
    """Extrahiert Text aus einer Zelle"""
    text_parts = []
    for p in cell_elem.findall('.//{urn:oasis:names:tc:opendocument:xmlns:text:1.0}p'):
        text = ''.join(p.itertext())
        if text.strip():
            text_parts.append(text.strip())
    return ' '.join(text_parts).strip()

def read_gesinnung_full(filepath):
    """Liest das Gesinnungs-Quadrat und Beschreibungen"""
    with zipfile.ZipFile(filepath, 'r') as z:
        content = z.read('content.xml')
    
    root = ET.fromstring(content)
    
    # Suche nach dem Blatt "Gesinnung"
    gesinnung_sheet = None
    for sheet in root.findall('.//{urn:oasis:names:tc:opendocument:xmlns:table:1.0}table'):
        name_attr = sheet.get('{urn:oasis:names:tc:opendocument:xmlns:table:1.0}name')
        if name_attr == 'Gesinnung':
            gesinnung_sheet = sheet
            break
    
    if gesinnung_sheet is None:
        return None
    
    rows = gesinnung_sheet.findall('.//{urn:oasis:names:tc:opendocument:xmlns:table:1.0}table-row')
    
    # Lese alle Zeilen
    all_data = {}
    for row_idx in range(len(rows)):
        row = rows[row_idx]
        cells = row.findall('.//{urn:oasis:names:tc:opendocument:xmlns:table:1.0}table-cell')
        
        actual_col = 0
        row_data = []
        
        for cell in cells:
            if actual_col >= 3:
                break
            repeated = int(cell.get('{urn:oasis:names:tc:opendocument:xmlns:table:1.0}number-columns-repeated') or '1')
            text = get_text_from_cell(cell)
            
            for _ in range(repeated):
                if actual_col >= 3:
                    break
                row_data.append(text)
                actual_col += 1
        
        if any(row_data):
            all_data[row_idx] = row_data
    
    # Das Gesinnungsquadrat: Zeilen 0, 2, 4
    quadrat_rows = [0, 2, 4]
    gesinnungen = {}
    descriptions = {}
    
    # Extrahiere Namen
    for quad_row_idx, actual_row in enumerate(quadrat_rows):
        if actual_row in all_data:
            for col in range(3):
                if col < len(all_data[actual_row]):
                    key = f"{quad_row_idx}-{col}"
                    gesinnungen[key] = all_data[actual_row][col]
    
    # Suche Beschreibungen - sie könnten in den Zeilen danach sein
    # Zeile 6+ scheinen Beschreibungen zu enthalten
    for row_idx in range(6, min(30, len(rows))):
        if row_idx in all_data and all_data[row_idx][0]:
            text = all_data[row_idx][0]
            # Versuche, den Gesinnungsnamen am Anfang zu finden
            for quad_row_idx, actual_row in enumerate(quadrat_rows):
                if actual_row in all_data:
                    for col in range(3):
                        gesinnung_name = all_data[actual_row][col]
                        if gesinnung_name:
                            # Prüfe verschiedene Varianten
                            name_parts = gesinnung_name.split()
                            if any(part in text for part in name_parts[:2] if len(part) > 3):
                                key = f"{quad_row_idx}-{col}"
                                if key not in descriptions or len(text) > len(descriptions.get(key, "")):
                                    descriptions[key] = text
    
    return gesinnungen, descriptions

if __name__ == "__main__":
    filepath = "Spielleiter-Infos - geheim!.ods"
    gesinnungen, descriptions = read_gesinnung_full(filepath)
    
    if gesinnungen:
        result = {}
        for row in range(3):
            row_data = []
            for col in range(3):
                key = f"{row}-{col}"
                name = gesinnungen.get(key, "")
                desc = descriptions.get(key, "")
                row_data.append({"name": name, "description": desc})
            result[f"row_{row}"] = row_data
        
        with open('gesinnungen.json', 'w', encoding='utf-8') as f:
            json.dump(result, f, ensure_ascii=False, indent=2)
        print("Gesinnungen extrahiert und gespeichert")

