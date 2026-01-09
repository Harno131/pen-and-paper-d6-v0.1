#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Analysiert Fertigkeiten im Blatt Georg (Zeilen 32-135)"""
import zipfile
import xml.etree.ElementTree as ET
import sys
import json

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

def analyze_skills(filepath):
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
    
    print("=== Fertigkeiten im Blatt Georg (Zeilen 32-135) ===\n")
    
    skills = []
    current_attribute = None
    
    for row_idx in range(32, min(136, len(rows))):
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
        
        # Fülle auf
        while len(row_data) < 10:
            row_data.append('')
        
        # Prüfe ob es ein Attribut-Header ist (erste Spalte hat Attributname)
        first_cell = str(row_data[0]).strip()
        
        # Attributnamen
        attribute_names = ['Reflexe', 'Koordination', 'Stärke', 'Wissen', 'Wahrnehmung', 'Ausstrahlung', 'Magie']
        
        if first_cell in attribute_names:
            current_attribute = first_cell
            print(f"\n--- {current_attribute} (Zeile {row_idx}) ---")
            continue
        
        # Prüfe ob es eine Fertigkeit ist (hat einen Namen und möglicherweise Werte)
        if current_attribute and first_cell and first_cell not in attribute_names:
            # Suche nach D6/W-Werten
            skill_name = first_cell
            base_value = row_data[1] if len(row_data) > 1 else ''
            bonus_value = row_data[2] if len(row_data) > 2 else ''
            total_value = row_data[4] if len(row_data) > 4 else ''
            
            # Wenn es einen Namen hat und nicht leer ist
            if skill_name and skill_name.strip():
                skill_info = {
                    'row': row_idx,
                    'attribute': current_attribute,
                    'name': skill_name,
                    'base': base_value,
                    'bonus': bonus_value,
                    'total': total_value
                }
                skills.append(skill_info)
                print(f"  Zeile {row_idx:3d}: {skill_name:30s} | Basis: {base_value:5s} | Bonus: {bonus_value:5s} | Gesamt: {total_value}")
    
    print(f"\n\nGefundene Fertigkeiten: {len(skills)}")
    
    # Gruppiere nach Attributen
    skills_by_attribute = {}
    for skill in skills:
        attr = skill['attribute']
        if attr not in skills_by_attribute:
            skills_by_attribute[attr] = []
        skills_by_attribute[attr].append(skill)
    
    print("\n=== Gruppiert nach Attributen ===")
    for attr, attr_skills in skills_by_attribute.items():
        print(f"\n{attr} ({len(attr_skills)} Fertigkeiten):")
        for skill in attr_skills:
            print(f"  - {skill['name']}")
    
    # Speichere als JSON
    with open('skills_structure.json', 'w', encoding='utf-8') as f:
        json.dump({
            'skills': skills,
            'by_attribute': skills_by_attribute
        }, f, ensure_ascii=False, indent=2)
    
    print("\nFertigkeiten in skills_structure.json gespeichert")
    
    return skills, skills_by_attribute

if __name__ == "__main__":
    filepath = "P&P V2 22_05_2021.ods"
    analyze_skills(filepath)

