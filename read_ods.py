#!/usr/bin/env python3
"""Liest eine .ods-Datei und extrahiert das Gesinnungs-Quadrat"""

try:
    from odf.opendocument import load
    from odf.table import Table, TableRow, TableCell
    from odf.text import P
except ImportError:
    print("Bitte installieren Sie odfpy: pip install odfpy")
    exit(1)

def get_text(cell):
    """Extrahiert Text aus einer Zelle"""
    text = ""
    for paragraph in cell.getElementsByType(P):
        text += "".join(node.data for node in paragraph.childNodes if hasattr(node, 'data'))
    return text.strip()

def read_gesinnung(filepath):
    """Liest das Gesinnungs-Quadrat aus der .ods-Datei"""
    doc = load(filepath)
    
    # Suche nach dem Blatt "Gesinnung"
    gesinnung_sheet = None
    for sheet in doc.spreadsheet.getElementsByType(Table):
        if sheet.getAttribute('name') == 'Gesinnung':
            gesinnung_sheet = sheet
            break
    
    if not gesinnung_sheet:
        print("Blatt 'Gesinnung' nicht gefunden!")
        return None
    
    # Lese die ersten 3 Zeilen und 3 Spalten
    gesinnungen = {}
    rows = gesinnung_sheet.getElementsByType(TableRow)
    
    for row_idx in range(min(3, len(rows))):
        row = rows[row_idx]
        cells = row.getElementsByType(TableCell)
        
        for col_idx in range(min(3, len(cells))):
            cell = cells[col_idx]
            text = get_text(cell)
            
            # Erstelle einen Key für die Position (z.B. "0-0", "0-1", etc.)
            key = f"{row_idx}-{col_idx}"
            gesinnungen[key] = text
    
    return gesinnungen

if __name__ == "__main__":
    filepath = "Spielleiter-Infos - geheim!.ods"
    result = read_gesinnung(filepath)
    
    if result:
        print("Gesinnungen gefunden:")
        for key, value in result.items():
            print(f"{key}: {value}")
    else:
        print("Fehler beim Lesen der Datei")

