import os
import yaml
import shutil
import datetime
import re
import json

# ------------------------------------------------------------------------------
# CORE YAML PARSER AND COMMENT-PRESERVING MERGE ENGINE
# ------------------------------------------------------------------------------

def parse_line(line):
    """
    Parses a single line of YAML to extract its indentation level, key (if any),
    whether it is a comment, and whether it is empty.
    """
    stripped = line.strip()
    if not stripped:
        return 0, None, False, True
    if stripped.startswith('#'):
        indent = len(line) - len(line.lstrip())
        return indent, None, True, False
    
    # Matches "Key: Value" or "Key:"
    match = re.match(r'^(\s*)([^#:]+):', line)
    if match:
        indent = len(match.group(1))
        key = match.group(2).strip().strip("'\"")
        return indent, key, False, False
        
    indent = len(line) - len(line.lstrip())
    return indent, None, False, False

def parse_yaml_lines(text):
    """
    Parses the full text of a YAML file line-by-line into structured metadata dicts.
    """
    raw_lines = text.split('\n')
    parsed = []
    for idx, line in enumerate(raw_lines):
        indent, key, is_comment, is_empty = parse_line(line)
        parsed.append({
            "idx": idx,
            "raw": line,
            "indent": indent,
            "key": key,
            "is_comment": is_comment,
            "is_empty": is_empty
        })
    return parsed

def find_key_block(parsed_lines, path):
    """
    Finds the start and end line indices of a key path in the parsed lines.
    Returns (start_idx, end_idx) or None if path is not found.
    - start_idx: the index of the line containing the key at the end of the path.
    - end_idx: the first line index outside the key's block (exclusive).
    """
    current_start = 0
    current_end = len(parsed_lines)
    current_indent = -1
    found_idx = -1
    
    for depth, k in enumerate(path):
        candidate_idx = -1
        candidate_indent = 999999
        
        # Search for key 'k' at the shallowest level > current_indent inside current search range
        for i in range(current_start, current_end):
            line = parsed_lines[i]
            if line["is_comment"] or line["is_empty"]:
                continue
            if line["key"] == k and line["indent"] > current_indent:
                if line["indent"] < candidate_indent:
                    candidate_idx = i
                    candidate_indent = line["indent"]
                    
        if candidate_idx == -1:
            return None
            
        found_idx = candidate_idx
        found_indent = candidate_indent
        
        # Determine the end of the block for this key
        block_end = len(parsed_lines)
        for i in range(found_idx + 1, current_end):
            line = parsed_lines[i]
            if line["is_empty"]:
                # Look ahead to see if the next non-empty line has indent <= found_indent
                next_non_empty = None
                for j in range(i + 1, current_end):
                    if not parsed_lines[j]["is_empty"]:
                        next_non_empty = parsed_lines[j]
                        break
                if next_non_empty and next_non_empty["indent"] <= found_indent:
                    block_end = i
                    break
                continue
                
            if line["indent"] <= found_indent:
                block_end = i
                break
                
        current_start = found_idx + 1
        current_end = block_end
        current_indent = found_indent
        
    if current_indent == -1:
        return 0, len(parsed_lines)
        
    return found_idx, current_end

def get_block_lines_with_comments(parsed_lines, start_idx, end_idx):
    """
    Extends the start of the block backwards to include any immediately preceding
    comment lines that belong to the key block.
    """
    first_idx = start_idx
    while first_idx > 0:
        prev = parsed_lines[first_idx - 1]
        if prev["is_comment"]:
            first_idx -= 1
        else:
            break
    return first_idx, end_idx

def shift_indent(line_str, diff):
    """
    Shifts the indentation of a raw line string by 'diff' spaces.
    """
    if diff == 0:
        return line_str
    if not line_str.strip():
        return line_str
    if diff > 0:
        return " " * diff + line_str
    else:
        leading_spaces = len(line_str) - len(line_str.lstrip())
        to_remove = min(leading_spaces, -diff)
        return line_str[to_remove:]

def compare_dicts(template_val, target_val, path, sections_missing, fields_missing, nested_fields_missing):
    """
    Recursively compares the template dict and target dict to find missing keys.
    Populates sections_missing, fields_missing, and nested_fields_missing.
    """
    if isinstance(template_val, dict):
        target_dict = target_val if isinstance(target_val, dict) else {}
        for k, v in template_val.items():
            if k not in target_dict:
                full_path = path + [k]
                if len(full_path) == 1:
                    if isinstance(v, dict):
                        sections_missing.append(k)
                    else:
                        fields_missing.append(k)
                else:
                    nested_fields_missing.append(" -> ".join(full_path))
            else:
                compare_dicts(v, target_dict[k], path + [k], sections_missing, fields_missing, nested_fields_missing)

def merge_missing_path(template_text, target_text, path):
    """
    Inserts a missing path from template_text into target_text.
    Preserves comments and indentation styles.
    """
    try:
        target_dict = yaml.safe_load(target_text) or {}
    except Exception:
        return target_text
        
    # Double check if it already exists in the target dictionary
    curr = target_dict
    exists = True
    for key in path:
        if isinstance(curr, dict) and key in curr:
            curr = curr[key]
        else:
            exists = False
            break
    if exists:
        return target_text
        
    template_lines = parse_yaml_lines(template_text)
    target_lines = parse_yaml_lines(target_text)
    
    # Find path block in template
    temp_block = find_key_block(template_lines, path)
    if not temp_block:
        return target_text
        
    t_start, t_end = temp_block
    t_start, t_end = get_block_lines_with_comments(template_lines, t_start, t_end)
    extracted_lines = [template_lines[i]["raw"] for i in range(t_start, t_end)]
    
    # Find parent block in target
    parent_path = path[:-1]
    
    if not parent_path:
        insert_idx = len(target_lines)
        indent_diff = 0
        p_start = -1
    else:
        parent_block = find_key_block(target_lines, parent_path)
        if not parent_block:
            return target_text
        p_start, p_end = parent_block
        
        # Calculate indentation difference
        temp_parent_block = find_key_block(template_lines, parent_path)
        t_p_start, _ = temp_parent_block
        parent_indent_template = template_lines[t_p_start]["indent"]
        parent_indent_target = target_lines[p_start]["indent"]
        
        indent_diff = parent_indent_target - parent_indent_template
        insert_idx = p_end
        
        # Adjust insertion index to be before trailing empty lines of the parent block
        while insert_idx > p_start + 1 and target_lines[insert_idx - 1]["is_empty"]:
            insert_idx -= 1
            
    # Shift indentation of template lines to match target style
    shifted_lines = [shift_indent(line, indent_diff) for line in extracted_lines]
    
    # Assemble the new target string
    raw_target_lines = [line["raw"] for line in target_lines]
    new_target_lines = raw_target_lines[:insert_idx] + shifted_lines + raw_target_lines[insert_idx:]
    return "\n".join(new_target_lines)


# ------------------------------------------------------------------------------
# SHARED COORDINATOR UTILITIES
# ------------------------------------------------------------------------------

TARGET_FOLDERS = ["materials", "crosslinkers", "tissues", "protocols", "combinations"]

def get_active_folders_and_templates(kb_path):
    """
    Scans the TARGET_FOLDERS list and maps existing folders to their templates.
    Returns a list of dicts: [{"folder": folder, "path": path, "template": template_path}]
    """
    active = []
    for folder in TARGET_FOLDERS:
        folder_path = os.path.join(kb_path, folder)
        if not os.path.isdir(folder_path):
            continue
            
        singular = folder[:-1] if folder.endswith('s') else folder
        template_name = f"{singular}_template.yaml"
        template_path = os.path.join(kb_path, "master", template_name)
        
        if os.path.exists(template_path):
            active.append({
                "folder": folder,
                "path": folder_path,
                "template": template_path
            })
    return active


# ------------------------------------------------------------------------------
# EXPOSED API FUNCTIONS
# ------------------------------------------------------------------------------

def preview_migration_engine():
    kb_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'knowledge_base'))
    active_targets = get_active_folders_and_templates(kb_path)
    
    preview_data = []
    
    for target in active_targets:
        folder = target["folder"]
        folder_path = target["path"]
        template_path = target["template"]
        
        # Load template
        try:
            with open(template_path, 'r', encoding='utf-8') as f:
                template_text = f.read()
                template_dict = yaml.safe_load(template_text) or {}
        except Exception as e:
            # If the template itself is corrupt, skip this folder
            continue
            
        # Scan target folder for YAML files
        for filename in os.listdir(folder_path):
            if not filename.endswith('.yaml'):
                continue
                
            target_file_path = os.path.join(folder_path, filename)
            display_name = f"{folder}/{filename}"
            
            # Load target file
            try:
                with open(target_file_path, 'r', encoding='utf-8') as f:
                    target_text = f.read()
                target_dict = yaml.safe_load(target_text) or {}
            except Exception as e:
                # Corrupt target file
                preview_data.append({
                    "file": display_name,
                    "status": "error",
                    "errors": [str(e)],
                    "File Name": display_name,
                    "Sections Missing": [],
                    "Fields Missing": [],
                    "Nested Fields Missing": []
                })
                continue
                
            # Perform recursive comparison
            sections_missing = []
            fields_missing = []
            nested_fields_missing = []
            
            compare_dicts(template_dict, target_dict, [], sections_missing, fields_missing, nested_fields_missing)
            
            if sections_missing or fields_missing or nested_fields_missing:
                # Build added_fields for frontend display
                added_fields_for_frontend = []
                for s in sections_missing:
                    added_fields_for_frontend.append(f"Section: {s}")
                for f in fields_missing:
                    added_fields_for_frontend.append(f"Field: {f}")
                for n in nested_fields_missing:
                    added_fields_for_frontend.append(n)
                    
                preview_data.append({
                    "file": display_name,
                    "status": "will_update",
                    "added_fields": added_fields_for_frontend,
                    
                    # Requirement 9 keys
                    "File Name": display_name,
                    "Sections Missing": sections_missing,
                    "Fields Missing": fields_missing,
                    "Nested Fields Missing": nested_fields_missing
                })
            else:
                preview_data.append({
                    "file": display_name,
                    "status": "up_to_date",
                    "added_fields": [],
                    
                    # Requirement 9 keys
                    "File Name": display_name,
                    "Sections Missing": [],
                    "Fields Missing": [],
                    "Nested Fields Missing": []
                })
                
    return {"preview": preview_data}


def run_migration_engine():
    kb_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'knowledge_base'))
    backups_path = os.path.join(kb_path, 'backups')
    logs_path = os.path.join(kb_path, 'migration_logs')

    os.makedirs(backups_path, exist_ok=True)
    os.makedirs(logs_path, exist_ok=True)

    active_targets = get_active_folders_and_templates(kb_path)

    files_scanned = 0
    files_updated = 0
    files_skipped = 0
    backups_created = 0
    start_time = datetime.datetime.now()
    log_entries = []

    # ── DEBUG ──────────────────────────────────────────────────────────────────
    print("\n" + "=" * 60)
    print("DEBUG: run_migration_engine() started")
    print(f"  kb_path        : {kb_path}")
    print(f"  backups_path   : {backups_path}")
    print(f"  Active targets : {[t['folder'] for t in active_targets]}")
    print("=" * 60)
    # ──────────────────────────────────────────────────────────────────────────

    total_files_found = 0

    for target in active_targets:
        folder = target["folder"]
        folder_path = target["path"]
        template_path = target["template"]

        # ── DEBUG ──────────────────────────────────────────────────────────────
        print(f"\nDEBUG: Processing folder '{folder}'")
        print(f"  Folder path   : {folder_path}")
        print(f"  Template path : {template_path}")
        print(f"  Template exists: {os.path.exists(template_path)}")
        # ──────────────────────────────────────────────────────────────────────

        try:
            with open(template_path, 'r', encoding='utf-8') as f:
                template_text = f.read()
                template_dict = yaml.safe_load(template_text) or {}
            # ── DEBUG ────────────────────────────────────────────────────────
            print(f"  Template loaded OK. Top-level keys: {list(template_dict.keys())[:5]} ...")
            # ────────────────────────────────────────────────────────────────
        except Exception as e:
            # ── DEBUG ────────────────────────────────────────────────────────
            print(f"  ERROR loading template: {e}  → skipping folder '{folder}'")
            # ────────────────────────────────────────────────────────────────
            continue

        all_yaml_files = [f for f in os.listdir(folder_path) if f.endswith('.yaml')]
        total_files_found += len(all_yaml_files)

        # ── DEBUG ──────────────────────────────────────────────────────────────
        print(f"  YAML files found in '{folder}': {all_yaml_files}")
        # ──────────────────────────────────────────────────────────────────────

        for filename in all_yaml_files:
            files_scanned += 1
            target_file_path = os.path.join(folder_path, filename)
            display_name = f"{folder}/{filename}"

            # ── DEBUG ────────────────────────────────────────────────────────
            print(f"\n  Scanning: {filename}")
            print(f"    Full path: {target_file_path}")
            # ────────────────────────────────────────────────────────────────

            try:
                with open(target_file_path, 'r', encoding='utf-8') as f:
                    target_text = f.read()
                target_dict = yaml.safe_load(target_text) or {}
                # ── DEBUG ──────────────────────────────────────────────────
                print(f"    YAML parsed OK. Top-level keys: {list(target_dict.keys())[:5]} ...")
                # ──────────────────────────────────────────────────────────
            except Exception as e:
                files_skipped += 1
                # ── DEBUG ──────────────────────────────────────────────────
                print(f"    Skipping {filename} because:")
                print(f"      YAML parsing failed => {e}")
                # ──────────────────────────────────────────────────────────
                log_entries.append({
                    "file": display_name,
                    "status": "skipped",
                    "errors": [str(e)]
                })
                continue

            # Perform recursive comparison
            sections_missing = []
            fields_missing = []
            nested_fields_missing = []

            compare_dicts(template_dict, target_dict, [], sections_missing, fields_missing, nested_fields_missing)

            # ── DEBUG ────────────────────────────────────────────────────────
            print(f"    Missing Fields:")
            if sections_missing:
                for s in sections_missing:
                    print(f"      - [Section] {s}")
            if fields_missing:
                for f in fields_missing:
                    print(f"      - [Field]   {f}")
            if nested_fields_missing:
                for n in nested_fields_missing:
                    print(f"      - [Nested]  {n}")
            if not (sections_missing or fields_missing or nested_fields_missing):
                print(f"      (none)")
            print(f"    Errors: None")
            # ────────────────────────────────────────────────────────────────

            if not (sections_missing or fields_missing or nested_fields_missing):
                # ── DEBUG ──────────────────────────────────────────────────
                print(f"    Skipping {filename} because:")
                print(f"      No missing fields detected => file is up to date")
                # ──────────────────────────────────────────────────────────
                log_entries.append({
                    "file": display_name,
                    "status": "unchanged"
                })
                continue

            # Back up target file first
            timestamp = datetime.datetime.now().strftime("%Y_%m_%d_%H%M%S")
            backup_filename = f"{folder}_{filename.replace('.yaml', '')}_{timestamp}.yaml"
            backup_file_path = os.path.join(backups_path, backup_filename)
            shutil.copy2(target_file_path, backup_file_path)
            backups_created += 1

            # ── DEBUG ────────────────────────────────────────────────────────
            print(f"    Backup created:")
            print(f"      {backup_filename}")
            # ────────────────────────────────────────────────────────────────

            # Merge missing paths (sort by length so parents come before children)
            missing_paths = []
            for s in sections_missing:
                missing_paths.append([s])
            for f in fields_missing:
                missing_paths.append([f])
            for n in nested_fields_missing:
                missing_paths.append(n.split(" -> "))

            missing_paths.sort(key=len)

            modified_text = target_text
            for path in missing_paths:
                modified_text = merge_missing_path(template_text, modified_text, path)

            # Save the modified YAML content
            with open(target_file_path, 'w', encoding='utf-8') as f:
                f.write(modified_text)

            # ── DEBUG ────────────────────────────────────────────────────────
            print(f"    Writing updated file:")
            print(f"      {filename}")
            # ────────────────────────────────────────────────────────────────

            files_updated += 1
            log_entries.append({
                "file": display_name,
                "status": "updated",
                "added_sections": sections_missing,
                "added_fields": fields_missing,
                "added_nested_fields": nested_fields_missing
            })

    end_time = datetime.datetime.now()
    duration = (end_time - start_time).total_seconds()

    # ── DEBUG ──────────────────────────────────────────────────────────────────
    print("\n" + "=" * 60)
    print("DEBUG: run_migration_engine() FINAL SUMMARY")
    print(f"  Total Files Found   : {total_files_found}")
    print(f"  Total Files Scanned : {files_scanned}")
    print(f"  Files Updated       : {files_updated}")
    print(f"  Files Skipped       : {files_skipped}")
    print(f"  Backups Created     : {backups_created}")
    print("=" * 60 + "\n")
    # ──────────────────────────────────────────────────────────────────────────

    log_summary = {
        "Migration Version": "2.0",
        "Date": start_time.isoformat(),
        "Files Scanned": files_scanned,
        "Files Updated": files_updated,
        "Files Skipped": files_skipped,
        "Backups Created": backups_created,
        "Duration Seconds": duration,
        "Details": log_entries
    }

    log_filename = f"migration_{start_time.strftime('%Y_%m_%d_%H%M%S')}.json"
    with open(os.path.join(logs_path, log_filename), 'w', encoding='utf-8') as f:
        json.dump(log_summary, f, indent=4)

    return log_summary


def get_migration_logs():
    kb_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'knowledge_base'))
    logs_path = os.path.join(kb_path, 'migration_logs')
    os.makedirs(logs_path, exist_ok=True)
    
    logs = []
    for filename in sorted(os.listdir(logs_path), reverse=True):
        if filename.endswith('.json'):
            try:
                with open(os.path.join(logs_path, filename), 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    logs.append({"filename": filename, "data": data})
            except Exception:
                pass
    return {"logs": logs}


def restore_backup(backup_filename):
    kb_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'knowledge_base'))
    backups_path = os.path.join(kb_path, 'backups')
    
    backup_path = os.path.join(backups_path, backup_filename)
    if not os.path.exists(backup_path):
        return {"success": False, "error": "Backup file not found."}
        
    # Extract destination folder from backup filename prefix
    target_folder = None
    for folder in TARGET_FOLDERS:
        if backup_filename.startswith(f"{folder}_"):
            target_folder = folder
            break
            
    if not target_folder:
        target_folder = "materials"
        prefix_len = 0
    else:
        prefix_len = len(target_folder) + 1
        
    # Extract original filename
    rest = backup_filename[prefix_len:]
    match = re.match(r'(.+)_\d{4}_\d{2}_\d{2}_\d{6}\.yaml', rest)
    if match:
        original_filename = f"{match.group(1)}.yaml"
    else:
        original_filename = rest.split('_202')[0] + '.yaml'
        
    target_path = os.path.join(kb_path, target_folder, original_filename)
    shutil.copy2(backup_path, target_path)
    
    return {"success": True, "restored_file": f"{target_folder}/{original_filename}"}


def get_backups_list():
    kb_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'knowledge_base'))
    backups_path = os.path.join(kb_path, 'backups')
    os.makedirs(backups_path, exist_ok=True)
    backups = sorted([f for f in os.listdir(backups_path) if f.endswith('.yaml')], reverse=True)
    return {"backups": backups}
