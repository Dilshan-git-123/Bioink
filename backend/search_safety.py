import os

def search_files():
    search_dir = 'c:\\Users\\ASUS\\OneDrive\\Desktop\\BioInkAI v2.0'
    for root, dirs, files in os.walk(search_dir):
        if 'node_modules' in root or '.git' in root or '__pycache__' in root:
            continue
        for name in files:
            p = os.path.join(root, name)
            try:
                with open(p, 'r') as f:
                    content = f.read()
                    if 'glutaraldehyde' in content.lower() or 'fume hood' in content.lower():
                        print('Found in: ' + str(p))
            except Exception as e:
                pass

if __name__ == '__main__':
    search_files()
