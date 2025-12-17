import sys
import os
import importlib.util


def test_imports():
    """Test that we can import main modules without errors"""
    try:
        # Добавляем backend в путь
        sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))
        
        # Пробуем импортировать основные модули
        from main import app
        from database import Model
        
        print("✅ All imports successful")
        return True
    except Exception as e:
        print(f"❌ Import error: {e}")
        return False


def test_health_check_route_exists():
    """Test that health check route is defined"""
    try:
        sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))
        from main import app
        
        # Проверяем, что есть route для /
        routes = [route for route in app.routes if getattr(route, "path", None) == "/"]
        if routes:
            print("✅ Health check route exists")
            return True
        else:
            print("❌ Health check route not found")
            return False
    except Exception as e:
        print(f"❌ Error checking routes: {e}")
        return False


if __name__ == "__main__":
    import_ok = test_imports()
    route_ok = test_health_check_route_exists()
    
    if import_ok and route_ok:
        print("\n✅ All tests passed!")
        sys.exit(0)
    else:
        print("\n❌ Tests failed")
        sys.exit(1)