import asyncio
import httpx
import sys




BASE_URL = "http://localhost:3001"




class APITester:
    def __init__(self):
        self.client = httpx.AsyncClient(base_url=BASE_URL)
        self.tokens = {}
        self.test_data = {}
        
    
    async def log_request(self, method, url, data=None):
        print(f"\n--- Вызываю {method} {url}")
        if data:
            print(f"Данные: {data}")
    
    
    async def log_response(self, response):
        print(f"Ответ: {response.status_code}")
        if response.status_code >= 400:
            print(f"ОШИБКА: {response.text}")
            return False
        else:
            print(f"УСПЕХ: {response.json()}")
            return True
    
    
    async def sleep(self, seconds=2):
        print(f"Ожидание {seconds} секунд...")
        await asyncio.sleep(seconds)
    
    
    async def register_user(self, username, email, password):
        url = "/auth/register"
        data = {
            "username": username,
            "email": email,
            "password": password,
            "password_confirm": password
        }
        
        await self.log_request("POST", url, data)
        response = await self.client.post(url, json=data)
        success = await self.log_response(response)
        
        if success:
            self.test_data[email] = {
                "user_id": response.json().get("user_id"),
                "username": username,
                "password": password
            }
        return success
    
    
    async def login_user(self, email, password):
        url = "/auth/login"
        data = {
            "email": email,
            "password": password
        }
        
        await self.log_request("POST", url, data)
        response = await self.client.post(url, json=data)
        success = await self.log_response(response)
        
        if success:
            self.tokens[email] = response.json()["access_token"]
        return success
    
    
    async def get_headers(self, email):
        token = self.tokens.get(email)
        return {"Authorization": f"Bearer {token}"} if token else {}
    
    
    async def send_friend_request(self, from_email, to_username):
        url = "/friends/send_requests"
        data = {
            "username_or_email": to_username
        }
        
        await self.log_request("POST", url, data)
        headers = await self.get_headers(from_email)
        response = await self.client.post(url, json=data, headers=headers)
        return await self.log_response(response)
    
    
    async def get_friend_requests(self, email):
        url = "/friends/get_requests"
        
        await self.log_request("GET", url)
        headers = await self.get_headers(email)
        response = await self.client.get(url, headers=headers)
        success = await self.log_response(response)
        
        if success:
            requests = response.json()
            if requests:
                self.test_data["friend_requests"] = requests
                return requests[0]["id"]  # Возвращаем ID первой заявки
        return None
    
    
    async def accept_friend_request(self, email, friendship_id):
        url = f"/friends/requests/{friendship_id}/accept"
        
        await self.log_request("PATCH", url)
        headers = await self.get_headers(email)
        response = await self.client.patch(url, headers=headers)
        return await self.log_response(response)
    
    
    async def get_friends(self, email):
        url = "/friends/?limit=20&offset=0"
        
        await self.log_request("GET", url)
        headers = await self.get_headers(email)
        response = await self.client.get(url, headers=headers)
        success = await self.log_response(response)
        
        if success:
            friends = response.json()
            if friends:
                self.test_data["friends"] = friends
                return friends[0]["friendship_id"]
        return None
    
    
    async def create_challenge(self, email, friendship_id, title, description=None):
        url = "/challenges"
        data = {
            "friendship_id": friendship_id,
            "title": title,
            "description": description
        }
        
        await self.log_request("POST", url, data)
        headers = await self.get_headers(email)
        response = await self.client.post(url, json=data, headers=headers)
        success = await self.log_response(response)
        
        if success:
            challenge_id = response.json()["id"]
            self.test_data["challenge_id"] = challenge_id
            return challenge_id
        return None
    
    
    async def get_challenges(self, email):
        url = "/challenges"
        
        await self.log_request("GET", url)
        headers = await self.get_headers(email)
        response = await self.client.get(url, headers=headers)
        return await self.log_response(response)
    
    
    async def get_challenge_detail(self, email, challenge_id):
        url = f"/challenges/{challenge_id}"
        
        await self.log_request("GET", url)
        headers = await self.get_headers(email)
        response = await self.client.get(url, headers=headers)
        return await self.log_response(response)
    
    
    async def accept_challenge(self, email, challenge_id):
        url = f"/challenges/{challenge_id}/accept"
        
        await self.log_request("POST", url)
        headers = await self.get_headers(email)
        response = await self.client.post(url, headers=headers)
        return await self.log_response(response)
    
    
    async def complete_challenge(self, email, challenge_id):
        url = f"/challenges/{challenge_id}/complete"
        
        await self.log_request("POST", url)
        headers = await self.get_headers(email)
        response = await self.client.post(url, headers=headers)
        return await self.log_response(response)
    
    
    async def add_proof(self, email, challenge_id, file_url, file_type):
        url = f"/challenges/{challenge_id}/proofs"
        data = {
            "file_url": file_url,
            "file_type": file_type
        }
        
        await self.log_request("POST", url, data)
        headers = await self.get_headers(email)
        response = await self.client.post(url, json=data, headers=headers)
        success = await self.log_response(response)
        
        if success:
            proof_id = response.json()["id"]
            self.test_data["proof_id"] = proof_id
            return proof_id
        return None
    
    
    async def delete_proof(self, email, challenge_id, proof_id):
        url = f"/proofs/{proof_id}"
        
        await self.log_request("DELETE", url)
        headers = await self.get_headers(email)
        response = await self.client.delete(url, headers=headers)
        return await self.log_response(response)
    
    
    async def create_review(self, email, challenge_id, approved, comment=None):
        url = f"/challenges/{challenge_id}/review"
        data = {
            "approved": approved,
            "comment": comment
        }
        
        await self.log_request("POST", url, data)
        headers = await self.get_headers(email)
        response = await self.client.post(url, json=data, headers=headers)
        return await self.log_response(response)
    
    
    async def run_full_test(self):
        print("=== ЗАПУСК ПОЛНОГО ТЕСТИРОВАНИЯ API ===")
        
        try:
            # 1. Регистрация пользователей
            print("\n=== ЭТАП 1: Регистрация пользователей ===")
            if not await self.register_user("test_user_1", "test1@example.com", "password123"):
                return False
            await self.sleep(2)
            
            if not await self.register_user("test_user_2", "test2@example.com", "password123"):
                return False
            await self.sleep(2)
            
            if not await self.register_user("test_user_3", "test3@example.com", "password123"):
                return False
            await self.sleep(2)
            
            # 2. Логин пользователей
            print("\n=== ЭТАП 2: Логин пользователей ===")
            if not await self.login_user("test1@example.com", "password123"):
                return False
            await self.sleep(2)
            
            if not await self.login_user("test2@example.com", "password123"):
                return False
            await self.sleep(2)
            
            if not await self.login_user("test3@example.com", "password123"):
                return False
            await self.sleep(2)
            
            # 3. Отправка заявок в друзья
            print("\n=== ЭТАП 3: Система друзей ===")
            if not await self.send_friend_request("test1@example.com", "test_user_2"):
                return False
            await self.sleep(2)
            
            if not await self.send_friend_request("test1@example.com", "test_user_3"):
                return False
            await self.sleep(2)
            
            # 4. Получение и принятие заявок
            friendship_id = await self.get_friend_requests("test2@example.com")
            if not friendship_id:
                print("ОШИБКА: Не удалось получить заявки в друзья")
                return False
            await self.sleep(2)
            
            if not await self.accept_friend_request("test2@example.com", friendship_id):
                return False
            await self.sleep(2)
            
            # 5. Получение списка друзей
            friendship_id_for_challenge = await self.get_friends("test1@example.com")
            if not friendship_id_for_challenge:
                print("ОШИБКА: Не удалось получить список друзей")
                return False
            await self.sleep(2)
            
            # 6. Работа с челленджами
            print("\n=== ЭТАП 4: Система челленджей ===")
            challenge_id = await self.create_challenge(
                "test1@example.com", 
                friendship_id_for_challenge, 
                "Тестовый челлендж", 
                "Описание тестового челленджа"
            )
            if not challenge_id:
                return False
            await self.sleep(2)
            
            if not await self.get_challenges("test1@example.com"):
                return False
            await self.sleep(2)
            
            if not await self.get_challenge_detail("test1@example.com", challenge_id):
                return False
            await self.sleep(2)
            
            if not await self.accept_challenge("test2@example.com", challenge_id):
                return False
            await self.sleep(2)
            
            if not await self.complete_challenge("test2@example.com", challenge_id):
                return False
            await self.sleep(2)
            
            # 7. Работа с доказательствами
            print("\n=== ЭТАП 5: Система доказательств ===")
            proof_id = await self.add_proof(
                "test2@example.com", 
                challenge_id, 
                "https://example.com/proof1.jpg", 
                "image"
            )
            if not proof_id:
                return False
            await self.sleep(2)
            
            # 8. Модерация - ИСПРАВЛЕНИЕ: создатель челленджа не может его ревьювить
            # Ревью должен делать противоположный участник дружбы
            print("\n=== ЭТАП 6: Система модерации ===")
            if not await self.create_review(
                "test1@example.com",  # Создатель челленджа ревьювит - это должно работать
                challenge_id, 
                True, 
                "Отличная работа! Челлендж выполнен идеально."
            ):
                return False
            await self.sleep(2)
            
            # 9. Финальные проверки
            print("\n=== ЭТАП 7: Финальные проверки ===")
            if not await self.get_challenge_detail("test1@example.com", challenge_id):
                return False
            await self.sleep(2)
            
            print("\n=== ТЕСТИРОВАНИЕ УСПЕШНО ЗАВЕРШЕНО! ===")
            return True
            
        except Exception as e:
            print(f"\nКРИТИЧЕСКАЯ ОШИБКА: {str(e)}")
            return False
        finally:
            await self.client.aclose()




async def main():
    tester = APITester()
    success = await tester.run_full_test()
    
    if not success:
        print("\nТЕСТИРОВАНИЕ ЗАВЕРШИЛОСЬ С ОШИБКАМИ!")
        sys.exit(1)
    else:
        print("\nВсе тесты пройдены успешно!")
        sys.exit(0)




if __name__ == "__main__":
    asyncio.run(main())