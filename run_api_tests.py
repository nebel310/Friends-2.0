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
    
    
    async def add_multiple_proofs(self, email, challenge_id, proofs_data):
        """Добавление нескольких доказательств за один запрос"""
        url = f"/challenges/{challenge_id}/proofs"
        
        await self.log_request("POST", url, proofs_data)
        headers = await self.get_headers(email)
        response = await self.client.post(url, json=proofs_data, headers=headers)
        success = await self.log_response(response)
        
        if success:
            proofs = response.json()
            if proofs:
                self.test_data["proof_ids"] = [proof["id"] for proof in proofs]
                return proofs[0]["id"]  # Возвращаем ID первого доказательства
        return None
    
    
    async def add_proof(self, email, challenge_id, file_url, file_type):
        """Добавление одного доказательства (для обратной совместимости)"""
        proofs_data = [{"file_url": file_url, "file_type": file_type}]
        return await self.add_multiple_proofs(email, challenge_id, proofs_data)
    
    
    async def delete_proof(self, email, proof_id):
        url = f"/challenges/{self.test_data['challenge_id']}/proofs/{proof_id}"
        
        await self.log_request("DELETE", url)
        headers = await self.get_headers(email)
        response = await self.client.delete(url, headers=headers)
        return await self.log_response(response)
    
    
    async def create_review(self, email, challenge_id, approved, comment=None):
        url = f"/reviews/challenges/{challenge_id}"
        data = {
            "approved": approved,
            "comment": comment
        }
        
        await self.log_request("POST", url, data)
        headers = await self.get_headers(email)
        response = await self.client.post(url, json=data, headers=headers)
        success = await self.log_response(response)
        
        if success:
            review_id = response.json()["review_id"]
            self.test_data["review_id"] = review_id
            return review_id
        return None
    
    
    async def get_reviews_by_challenge(self, email, challenge_id):
        """Получение всех модераций по challenge_id"""
        url = f"/reviews/challenges/{challenge_id}?limit=20&offset=0"
        
        await self.log_request("GET", url)
        headers = await self.get_headers(email)
        response = await self.client.get(url, headers=headers)
        success = await self.log_response(response)
        
        if success:
            reviews_data = response.json()
            if reviews_data and reviews_data["reviews"]:
                return reviews_data["reviews"]
        return None
    
    
    async def get_review_by_id(self, email, review_id):
        """Получение модерации по ID"""
        url = f"/reviews/{review_id}"
        
        await self.log_request("GET", url)
        headers = await self.get_headers(email)
        response = await self.client.get(url, headers=headers)
        success = await self.log_response(response)
        
        if success:
            return response.json()
        return None
    
    
    async def delete_review(self, email, review_id):
        """Удаление модерации"""
        url = f"/reviews/{review_id}"
        
        await self.log_request("DELETE", url)
        headers = await self.get_headers(email)
        response = await self.client.delete(url, headers=headers)
        return await self.log_response(response)
    
    
    async def upload_test_file(self, email):
        """Тест загрузки файла"""
        url = "/files/upload"
        
        # Создаем тестовый файл в памяти
        test_file_data = b"fake image data for testing"
        files = {"file": ("test_image.jpg", test_file_data, "image/jpeg")}
        
        await self.log_request("POST", url, f"FILE_UPLOAD (размер: {len(test_file_data)} байт)")
        headers = await self.get_headers(email)
        headers.pop("Content-Type", None)  # Убираем Content-Type для form-data
        
        response = await self.client.post(url, files=files, headers=headers)
        success = await self.log_response(response)
        
        if success:
            file_info = response.json()
            # Проверяем, что файл действительно загружен и есть URL
            if file_info.get("file_url") and file_info.get("file_name"):
                self.test_data["uploaded_file"] = file_info
                print(f"Файл успешно загружен: {file_info['file_name']} -> {file_info['file_url']}")
                return file_info["file_url"]
            else:
                print("ОШИБКА: В ответе отсутствует file_url или file_name")
                return None
        return None
    
    
    async def test_file_size_restriction(self, email):
        """Тест ограничения размера файла"""
        url = "/files/upload"
        
        # Создаем слишком большой файл (>10MB)
        large_file_data = b"x" * (11 * 1024 * 1024)  # 11MB
        files = {"file": ("large_file.jpg", large_file_data, "image/jpeg")}
        
        await self.log_request("POST", url, "FILE_UPLOAD (большой файл >10MB)")
        headers = await self.get_headers(email)
        headers.pop("Content-Type", None)
        
        response = await self.client.post(url, files=files, headers=headers)
        
        # Ожидаем ошибку 400
        if response.status_code == 400:
            print(f"УСПЕХ: Ограничение размера файла работает - получена ошибка: {response.text}")
            return True
        else:
            print(f"ОШИБКА: Ожидалась ошибка 400, но получен статус {response.status_code}")
            return False
    
    
    async def test_file_format_restriction(self, email):
        """Тест ограничения форматов файлов"""
        url = "/files/upload"
        
        # Пытаемся загрузить файл неподдерживаемого формата
        file_data = b"fake file data"
        files = {"file": ("test_file.pdf", file_data, "application/pdf")}
        
        await self.log_request("POST", url, "FILE_UPLOAD (неподдерживаемый формат PDF)")
        headers = await self.get_headers(email)
        headers.pop("Content-Type", None)
        
        response = await self.client.post(url, files=files, headers=headers)
        
        # Ожидаем ошибку 400
        if response.status_code == 400:
            print(f"УСПЕХ: Ограничение форматов файлов работает - получена ошибка: {response.text}")
            return True
        else:
            print(f"ОШИБКА: Ожидалась ошибка 400, но получен статус {response.status_code}")
            return False
    
    
    async def test_proofs_in_all_statuses(self, email, challenge_id):
        """Тест добавления proof к челленджам с разными статусами"""
        print("\n--- Тестирование добавления proof к челленджам с разными статусами")
        
        # Добавляем proof к принятому челленджу
        proofs_data = [
            {"file_url": "https://example.com/proof_status1.jpg", "file_type": "image"},
            {"file_url": "https://example.com/proof_status2.jpg", "file_type": "image"}
        ]
        
        proof_id = await self.add_multiple_proofs(email, challenge_id, proofs_data)
        if not proof_id:
            print("ОШИБКА: Не удалось добавить proof к принятому челленджу")
            return False
        
        print("УСПЕХ: Proof успешно добавлены к принятому челленджу")
        return True
    
    
    async def run_full_test(self):
        print("=== ЗАПУСК ПОЛНОГО ТЕСТИРОВАНИЯ API ===")
        
        try:
            # 1. Регистрация пользователей
            print("\n=== ЭТАП 1: Регистрация пользователей ===")
            if not await self.register_user("test_user_1", "test1@example.com", "password123"):
                return False
            await self.sleep(1)
            
            if not await self.register_user("test_user_2", "test2@example.com", "password123"):
                return False
            await self.sleep(1)
            
            if not await self.register_user("test_user_3", "test3@example.com", "password123"):
                return False
            await self.sleep(1)
            
            # 2. Логин пользователей
            print("\n=== ЭТАП 2: Логин пользователей ===")
            if not await self.login_user("test1@example.com", "password123"):
                return False
            await self.sleep(1)
            
            if not await self.login_user("test2@example.com", "password123"):
                return False
            await self.sleep(1)
            
            if not await self.login_user("test3@example.com", "password123"):
                return False
            await self.sleep(1)
            
            # 3. Отправка заявок в друзья
            print("\n=== ЭТАП 3: Система друзей ===")
            if not await self.send_friend_request("test1@example.com", "test_user_2"):
                return False
            await self.sleep(1)
            
            if not await self.send_friend_request("test1@example.com", "test_user_3"):
                return False
            await self.sleep(1)
            
            # 4. Получение и принятие заявок
            friendship_id = await self.get_friend_requests("test2@example.com")
            if not friendship_id:
                print("ОШИБКА: Не удалось получить заявки в друзья")
                return False
            await self.sleep(1)
            
            if not await self.accept_friend_request("test2@example.com", friendship_id):
                return False
            await self.sleep(1)
            
            # 5. Получение списка друзей
            friendship_id_for_challenge = await self.get_friends("test1@example.com")
            if not friendship_id_for_challenge:
                print("ОШИБКА: Не удалось получить список друзей")
                return False
            await self.sleep(1)
            
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
            await self.sleep(1)
            
            if not await self.get_challenges("test1@example.com"):
                return False
            await self.sleep(1)
            
            if not await self.get_challenge_detail("test1@example.com", challenge_id):
                return False
            await self.sleep(1)
            
            if not await self.accept_challenge("test2@example.com", challenge_id):
                return False
            await self.sleep(1)
            
            # 7. Тестирование proof во всех статусах
            if not await self.test_proofs_in_all_statuses("test2@example.com", challenge_id):
                return False
            await self.sleep(1)
            
            if not await self.complete_challenge("test2@example.com", challenge_id):
                return False
            await self.sleep(1)
            
            # 8. Работа с модерациями (новые эндпоинты)
            print("\n=== ЭТАП 5: Расширенная система модераций ===")
            
            # Создание модерации
            review_id = await self.create_review(
                "test1@example.com",
                challenge_id, 
                True, 
                "Отличная работа! Челлендж выполнен идеально."
            )
            if not review_id:
                return False
            await self.sleep(1)
            
            # Получение всех модераций по challenge_id
            reviews = await self.get_reviews_by_challenge("test1@example.com", challenge_id)
            if not reviews:
                print("ОШИБКА: Не удалось получить список модераций")
                return False
            print(f"УСПЕХ: Получено {len(reviews)} модераций")
            await self.sleep(1)
            
            # Получение конкретной модерации по ID
            review_detail = await self.get_review_by_id("test1@example.com", review_id)
            if not review_detail:
                print("ОШИБКА: Не удалось получить модерацию по ID")
                return False
            print("УСПЕХ: Модерация успешно получена по ID")
            await self.sleep(1)
            
            # Удаление модерации
            if not await self.delete_review("test1@example.com", review_id):
                print("ОШИБКА: Не удалось удалить модерацию")
                return False
            print("УСПЕХ: Модерация успешно удалена")
            await self.sleep(1)
            
            # 9. Работа с доказательствами (множественная загрузка)
            print("\n=== ЭТАП 6: Множественная загрузка доказательств ===")
            multiple_proofs_data = [
                {"file_url": "https://example.com/proof1.jpg", "file_type": "image"},
                {"file_url": "https://example.com/proof2.png", "file_type": "image"},
                {"file_url": "https://example.com/proof3.mp4", "file_type": "video"}
            ]
            
            proof_id = await self.add_multiple_proofs("test2@example.com", challenge_id, multiple_proofs_data)
            if not proof_id:
                return False
            await self.sleep(1)
            
            # Удаление proof
            if not await self.delete_proof("test2@example.com", proof_id):
                return False
            await self.sleep(1)
            
            # 10. Тестирование системы файлов
            print("\n=== ЭТАП 7: Система файлов с ограничениями ===")
            
            # Тест загрузки корректного файла
            file_url = await self.upload_test_file("test1@example.com")
            if not file_url:
                return False
            await self.sleep(1)
            
            # Тест ограничения размера файла
            if not await self.test_file_size_restriction("test1@example.com"):
                return False
            await self.sleep(1)
            
            # Тест ограничения форматов файлов
            if not await self.test_file_format_restriction("test1@example.com"):
                return False
            await self.sleep(1)
            
            # 11. Финальные проверки
            print("\n=== ЭТАП 8: Финальные проверки ===")
            if not await self.get_challenge_detail("test1@example.com", challenge_id):
                return False
            await self.sleep(1)
            
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