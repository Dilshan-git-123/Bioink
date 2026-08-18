import urllib.request
import json
import time

url = 'http://localhost:8000/api/protocol/generate'
data = {
    'tissue': 'Cartilage',
    'materials': [{'name': 'Alginate', 'concentration': 3.0}],
    'crosslinking': 'CaCl2',
    'parameters': {'temperature': 25, 'rpm': 250, 'time': 10}
}
req = urllib.request.Request(url, data=json.dumps(data).encode('utf-8'), headers={'Content-Type': 'application/json'})

print("Sending POST request to generate protocol...")
try:
    with urllib.request.urlopen(req) as response:
        result = json.loads(response.read().decode())
        
        print('HTTP 200: Yes')
        llm_meta = result.get('llm_metadata', {})
        print('llm_meta.used:', llm_meta.get('used'))
        print('fallback:', llm_meta.get('fallback'))
        print('evidence count:', len(result.get('evidence', [])))
        
        print('\n--- Crosslinker Evidence Items ---')
        for ev in result.get('evidence', []):
            param = ev.get('parameter', '')
            if 'crosslink' in param.lower():
                print("parameter: " + str(param))
                print("value: " + str(ev.get('value')))
                print("evidence_type: " + str(ev.get('evidence_type')))
                print("applicability: " + str(ev.get('applicability')))
                print("source_location: " + str(ev.get('source_location')))
                print('-'*40)
except Exception as e:
    print('Error:', e)
