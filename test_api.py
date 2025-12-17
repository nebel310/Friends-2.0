import httpx
import sys


def test_health_check():
    """Test health check endpoint"""
    try:
        # Пробуем подключиться к серверу
        response = httpx.get("http://localhost:3001/", timeout=5.0)
        
        if response.status_code == 200:
            print("✅ Health check passed!")
            return True
        else:
            print(f"❌ Health check failed with status: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Cannot connect to server: {e}")
        print("Make sure the backend is running on localhost:3001")
        return False


if __name__ == "__main__":
    success = test_health_check()
    sys.exit(0 if success else 1)