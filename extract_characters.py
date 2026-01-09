#!/usr/bin/env python3
"""Extrahiert Charakterbeispiele aus der P&P V2 Datei"""
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

def read_characters(filepath):
    """Liest Charakterbeispiele aus der .ods-Datei"""
    with zipfile.ZipFile(filepath, 'r') as z:
        content = z.read('content.xml')
    
    root = ET.fromstring(content)
    
    # Liste alle verfügbaren Blätter
    sheets = []
    for sheet in root.findall('.//{urn:oasis:names:tc:opendocument:xmlns:table:1.0}table'):
        name = sheet.get('{urn:oasis:names:tc:opendocument:xmlns:table:1.0}name')
        if name:
            sheets.append(name)
    
    print(f"Verfügbare Blätter: {', '.join(sheets)}\n")
    
    characters = []
    
    # Durchsuche alle Blätter nach Charakterdaten
    for sheet_name in sheets:
        sheet = None
        for s in root.findall('.//{urn:oasis:names:tc:opendocument:xmlns:table:1.0}table'):
            if s.get('{urn:oasis:names:tc:opendocument:xmlns:table:1.0}name') == sheet_name:
                sheet = s
                break
        
        if sheet is None:
            continue
        
        print(f"\n=== Blatt: {sheet_name} ===")
        rows = sheet.findall('.//{urn:oasis:names:tc:opendocument:xmlns:table:1.0}table-row')
        
        # Lese alle Zeilen
        all_data = []
        for row_idx in range(min(50, len(rows))):  # Erste 50 Zeilen
            row = rows[row_idx]
            cells = row.findall('.//{urn:oasis:names:tc:opendocument:xmlns:table:1.0}table-cell')
            
            row_data = []
            actual_col = 0
            
            for cell in cells:
                if actual_col >= 10:  # Maximal 10 Spalten
                    break
                repeated = int(cell.get('{urn:oasis:names:tc:opendocument:xmlns:table:1.0}number-columns-repeated') or '1')
                text = get_text_from_cell(cell)
                
                for _ in range(repeated):
                    if actual_col >= 10:
                        break
                    row_data.append(text)
                    actual_col += 1
            
            if any(row_data):
                all_data.append(row_data)
                # Zeige erste paar Zeilen als Beispiel
                if row_idx < 5:
                    print(f"Zeile {row_idx}: {row_data[:5]}")
        
        # Versuche, Charakterstruktur zu erkennen
        # Suche nach Zeilen mit Namen, Attributen, etc.
        for i, row in enumerate(all_data):
            if len(row) > 0 and row[0]:
                # Wenn die erste Spalte einen Namen enthält und weitere Spalten Daten haben
                if len(row) >= 3 and any(len(str(cell)) > 3 for cell in row[1:] if cell):
                    char_data = {
                        'sheet': sheet_name,
                        'row': i,
                        'data': row
                    }
                    characters.append(char_data)
    
    return characters, sheets

if __name__ == "__main__":
    filepath = "P&P V2 22_05_2021.ods"
    characters, sheets = read_characters(filepath)
    
    print(f"\n\nGefundene potenzielle Charakterzeilen: {len(characters)}")
    
    # Speichere als JSON für weitere Analyse
    with open('characters_raw.json', 'w', encoding='utf-8') as f:
        json.dump({
            'sheets': sheets,
            'characters': characters[:20]  # Erste 20 für Analyse
        }, f, ensure_ascii=False, indent=2)
    
    print("Rohdaten in characters_raw.json gespeichert")

