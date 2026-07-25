import sqlite3
import json
import os
from typing import List, Dict, Any, Optional

DB_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), 'formulations.db'))

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

# Ensure experiments table exists (init_db will call this)
def init_experiments_table():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS experiments (
            id TEXT PRIMARY KEY,
            timestamp TEXT NOT NULL,
            project_id TEXT NOT NULL,
            project_name TEXT NOT NULL,
            tissue_type TEXT,
            biomaterials TEXT, -- JSON
            final_mixing TEXT, -- JSON
            prediction_results TEXT, -- JSON
            compatibility_analysis TEXT, -- JSON
            generated_protocol TEXT,
            user_notes TEXT,
            is_favorite INTEGER DEFAULT 0
        )
    """)
    conn.commit()
    conn.close()

def serialize(val: Any) -> str:
    return json.dumps(val) if val is not None else json.dumps(None)

def deserialize(val: Optional[str]) -> Any:
    if not val:
        return None
    try:
        return json.loads(val)
    except Exception:
        return val

def db_create_experiment(exp: Dict[str, Any]) -> Dict[str, Any]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        """
        INSERT INTO experiments (
            id, timestamp, project_id, project_name, tissue_type,
            biomaterials, final_mixing, prediction_results,
            compatibility_analysis, generated_protocol, user_notes, is_favorite
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            exp['id'],
            exp['timestamp'],
            exp['project_id'],
            exp['project_name'],
            exp.get('tissue_type'),
            serialize(exp.get('biomaterials')), 
            serialize(exp.get('final_mixing')),
            serialize(exp.get('prediction_results')),
            serialize(exp.get('compatibility_analysis')),
            exp.get('generated_protocol'),
            exp.get('user_notes'),
            1 if exp.get('is_favorite') else 0
        )
    )
    conn.commit()
    conn.close()
    return db_get_experiment_by_id(exp['id'])

def db_get_experiments() -> List[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM experiments")
    rows = cursor.fetchall()
    conn.close()
    return [row_to_dict(row) for row in rows]

def db_get_experiment_by_id(exp_id: str) -> Optional[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM experiments WHERE id = ?", (exp_id,))
    row = cursor.fetchone()
    conn.close()
    if row:
        return row_to_dict(row)
    return None

def db_update_experiment(exp_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    if not updates:
        return db_get_experiment_by_id(exp_id)
    conn = get_db_connection()
    cursor = conn.cursor()
    allowed = {
        'tissue_type', 'biomaterials', 'final_mixing', 'prediction_results',
        'compatibility_analysis', 'generated_protocol', 'user_notes', 'is_favorite'
    }
    parts = []
    params = []
    for key, val in updates.items():
        if key in allowed:
            parts.append(f"{key} = ?")
            if key in ('biomaterials', 'final_mixing', 'prediction_results', 'compatibility_analysis'):
                params.append(serialize(val))
            elif key == 'is_favorite':
                params.append(1 if val else 0)
            else:
                params.append(val)
    if not parts:
        conn.close()
        return db_get_experiment_by_id(exp_id)
    params.append(exp_id)
    cursor.execute(f"UPDATE experiments SET {', '.join(parts)} WHERE id = ?", tuple(params))
    conn.commit()
    conn.close()
    return db_get_experiment_by_id(exp_id)

def db_delete_experiment(exp_id: str) -> bool:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM experiments WHERE id = ?", (exp_id,))
    changed = conn.total_changes > 0
    conn.commit()
    conn.close()
    return changed

def row_to_dict(row: sqlite3.Row) -> Dict[str, Any]:
    d = dict(row)
    # deserialize JSON fields
    for field in ['biomaterials', 'final_mixing', 'prediction_results', 'compatibility_analysis']:
        d[field] = deserialize(d.get(field))
    # convert is_favorite to bool
    d['is_favorite'] = bool(d.get('is_favorite'))
    return d

def db_duplicate_experiment(exp_id: str) -> Optional[Dict[str, Any]]:
    original = db_get_experiment_by_id(exp_id)
    if not original:
        return None
    import uuid, datetime
    new_exp = original.copy()
    new_exp['id'] = str(uuid.uuid4())
    new_exp['timestamp'] = datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=5, minutes=30))).isoformat()
    return db_create_experiment(new_exp)

# No special restore logic; frontend will fetch and load via API.
