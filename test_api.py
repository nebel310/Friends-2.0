import sys
import os


def test_health_check():
    """Просто проверяем что файлы существуют"""
    if not os.path.exists("backend/main.py"):
        print("backend/main.py not found")
        return False

    try:
        with open("backend/main.py", "r", encoding="utf-8") as f:
            content = f.read()
            
        checks = [
            '@app.get("/")',
            'async def health_check',
            'def health_check',
            'GET /"'
        ]
        
        found = any(check in content for check in checks)
        
        if found:
            print("Health check endpoint found in code")
            return True
        else:
            print("Health check endpoint not found in code")
            return False
            
    except Exception as e:
        print(f"Error reading main.py: {e}")
        return False


if __name__ == "__main__":
    success = test_health_check()
    sys.exit(0 if success else 1)