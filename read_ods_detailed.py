#!/usr/bin/env python3
"""Liest eine .ods-Datei und extrahiert das Gesinnungs-Quadrat mit Beschreibungen"""
import zipfile
import xml.etree.ElementTree as ET

def get_text_from_cell(cell_elem):
    """Extrahiert Text aus einer Zelle"""
    text_parts = []
    for p in cell_elem.findall('.//{urn:oasis:names:tc:opendocument:xmlns:text:1.0}p'):
        text = ''.join(p.itertext())
        if text.strip():
            text_parts.append(text.strip())
    return ' '.join(text_parts).strip()

def read_gesinnung_detailed(filepath):
    """Liest das Gesinnungs-Quadrat aus der .ods-Datei"""
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
        print("Blatt 'Gesinnung' nicht gefunden!")
        return None
    
    # Lese alle Zeilen (mehr als 3, um Beschreibungen zu finden)
    all_data = {}
    rows = gesinnung_sheet.findall('.//{urn:oasis:names:tc:opendocument:xmlns:table:1.0}table-row')
    
    print(f"Gefundene Zeilen: {len(rows)}\n")
    
    for row_idx in range(min(10, len(rows))):  # Erste 10 Zeilen
        row = rows[row_idx]
        cells = row.findall('.//{urn:oasis:names:tc:opendocument:xmlns:table:1.0}table-cell')
        
        actual_col = 0
        row_data = []
        
        for cell in cells:
            if actual_col >= 5:  # Mehr Spalten lesen
                break
                
            repeated = int(cell.get('{urn:oasis:names:tc:opendocument:xmlns:table:1.0}number-columns-repeated') or '1')
            text = get_text_from_cell(cell)
            
            for _ in range(repeated):
                if actual_col >= 5:
                    break
                row_data.append(text)
                actual_col += 1
        
        if any(row_data):  # Nur nicht-leere Zeilen
            all_data[row_idx] = row_data
            print(f"Zeile {row_idx}: {row_data}")
    
    # Extrahiere das 3x3 Quadrat
    gesinnungen = {}
    for row in range(3):
        for col in range(3):
            key = f"{row}-{col}"
            if row in all_data and col < len(all_data[row]):
                gesinnungen[key] = all_data[row][col]
            else:
                gesinnungen[key] = ""
    
    return gesinnungen, all_data

if __name__ == "__main__":
    filepath = "Spielleiter-Infos - geheim!.ods"
    result, all_data = read_gesinnung_detailed(filepath)
    
    if result:
        print("\n=== Gesinnungs-Quadrat (3x3) ===\n")
        for row in range(3):
            for col in range(3):
                key = f"{row}-{col}"
                value = result.get(key, "")
                print(f"[{row+1},{col+1}]: {value}")
    else:
        print("Fehler beim Lesen der Datei")

