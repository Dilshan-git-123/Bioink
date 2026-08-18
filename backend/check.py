import json
import io

try:
    with io.open('response.json', 'r', encoding='utf-16') as f:
        data = json.load(f)
        for e in data.get('evidence', []):
            param = e.get('parameter', '')
            if 'crosslink' in param.lower():
                print(param)
                print(e.get('value'))
                print(e.get('applicability', {}).get('same_crosslinker'))
                print('---')
except Exception as e:
    print('Error:', e)
