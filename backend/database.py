import sqlite3
import json
import os
from typing import List, Dict, Any, Optional
from experiment_db import init_experiments_table

DB_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), 'formulations.db'))

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS projects (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT,
            tissue_type TEXT,
            biomaterial_formulation TEXT, -- JSON array
            final_mixing_parameters TEXT, -- JSON object
            prediction_results TEXT,      -- JSON object
            generated_protocol TEXT,      -- JSON object
            created_date TEXT,            -- ISO format
            last_modified_date TEXT,      -- ISO format
            status TEXT                   -- 'Draft' or 'Completed'
        )
    """)
    conn.commit()
    conn.close()
    # Initialize experiments table
    init_experiments_table()

def serialize_field(val: Any) -> str:
    if val is None:
        return json.dumps(None)
    if isinstance(val, (list, dict)):
        return json.dumps(val)
    return json.dumps(val)

def deserialize_field(val: Optional[str]) -> Any:
    if not val:
        return None
    try:
        return json.loads(val)
    except Exception:
        return val

def row_to_dict(row: sqlite3.Row) -> Dict[str, Any]:
    d = dict(row)
    d['biomaterial_formulation'] = deserialize_field(d.get('biomaterial_formulation'))
    d['final_mixing_parameters'] = deserialize_field(d.get('final_mixing_parameters'))
    d['prediction_results'] = deserialize_field(d.get('prediction_results'))
    d['generated_protocol'] = deserialize_field(d.get('generated_protocol'))
    return d

def db_create_project(project: Dict[str, Any]) -> Dict[str, Any]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        """
        INSERT INTO projects (
            id, name, description, tissue_type, 
            biomaterial_formulation, final_mixing_parameters, 
            prediction_results, generated_protocol, 
            created_date, last_modified_date, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            project['id'],
            project['name'],
            project.get('description', ''),
            project.get('tissue_type', ''),
            serialize_field(project.get('biomaterial_formulation', [])),
            serialize_field(project.get('final_mixing_parameters', {})),
            serialize_field(project.get('prediction_results', {})),
            serialize_field(project.get('generated_protocol', {})),
            project['created_date'],
            project['last_modified_date'],
            project.get('status', 'Draft')
        )
    )
    conn.commit()
    conn.close()
    return db_get_project_by_id(project['id'])

def db_get_projects() -> List[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM projects")
    rows = cursor.fetchall()
    conn.close()
    return [row_to_dict(row) for row in rows]

def db_get_project_by_id(project_id: str) -> Optional[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM projects WHERE id = ?", (project_id,))
    row = cursor.fetchone()
    conn.close()
    if row:
        return row_to_dict(row)
    return None

def db_update_project(project_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Select columns to build dynamic UPDATE statement
    allowed_columns = {
        'name', 'description', 'tissue_type', 
        'biomaterial_formulation', 'final_mixing_parameters', 
        'prediction_results', 'generated_protocol', 
        'last_modified_date', 'status'
    }
    
    query_parts = []
    params = []
    
    for key, val in updates.items():
        if key in allowed_columns:
            query_parts.append(f"{key} = ?")
            if key in ('biomaterial_formulation', 'final_mixing_parameters', 'prediction_results', 'generated_protocol'):
                params.append(serialize_field(val))
            else:
                params.append(val)
                
    if not query_parts:
        conn.close()
        return db_get_project_by_id(project_id)
        
    params.append(project_id)
    cursor.execute(
        f"UPDATE projects SET {', '.join(query_parts)} WHERE id = ?",
        tuple(params)
    )
    conn.commit()
    conn.close()
    return db_get_project_by_id(project_id)

def db_delete_project(project_id: str) -> bool:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM projects WHERE id = ?", (project_id,))
    changes = conn.total_changes
    conn.commit()
    conn.close()
    return changes > 0
