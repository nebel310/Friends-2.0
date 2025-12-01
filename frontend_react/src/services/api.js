const API_BASE = 'http://localhost:3001';

class ApiService {
  getToken() {
    return localStorage.getItem('token');
  }

  async request(endpoint, options = {}) {
    const token = this.getToken();
    const url = `${API_BASE}${endpoint}`;
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, config);
      
      if (response.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
        throw new Error('Необходима авторизация');
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Ошибка: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Auth
  async login(email, password) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async getCurrentUser() {
    return this.request('/auth/me');
  }

  // Friends
  async getFriends() {
    return this.request('/friends/');
  }

  async getFriendRequests() {
    return this.request('/friends/get_requests');
  }

  async sendFriendRequest(usernameOrEmail) {
    return this.request('/friends/send_requests', {
      method: 'POST',
      body: JSON.stringify({ username_or_email: usernameOrEmail }),
    });
  }

  async acceptFriendRequest(friendshipId) {
    return this.request(`/friends/requests/${friendshipId}/accept`, {
      method: 'PATCH',
    });
  }

  async rejectFriendRequest(friendshipId) {
    return this.request(`/friends/requests/${friendshipId}/delete`, {
      method: 'DELETE',
    });
  }

  // Challenges
  async getChallenges(friendshipId = null, status = null) {
    const params = new URLSearchParams();
    if (friendshipId) params.append('friendship_id', friendshipId);
    if (status) params.append('status', status);
    
    const query = params.toString();
    const endpoint = query ? `/challenges?${query}` : '/challenges';
    
    return this.request(endpoint);
  }

  async getChallengeDetail(challengeId) {
    return this.request(`/challenges/${challengeId}`);
  }

  async createChallenge(friendshipId, title, description = null) {
    return this.request('/challenges', {
      method: 'POST',
      body: JSON.stringify({
        friendship_id: friendshipId,
        title: title,
        description: description
      }),
    });
  }

  async acceptChallenge(challengeId) {
    return this.request(`/challenges/${challengeId}/accept`, {
      method: 'POST',
    });
  }

  async rejectChallenge(challengeId) {
    return this.request(`/challenges/${challengeId}/reject`, {
      method: 'POST',
    });
  }

  async completeChallenge(challengeId) {
    return this.request(`/challenges/${challengeId}/complete`, {
      method: 'POST',
    });
  }

  async deleteChallenge(challengeId) {
    return this.request(`/challenges/${challengeId}`, {
      method: 'DELETE',
    });
  }

  // File Management
  async uploadFile(file) {
    const token = this.getToken();
    const formData = new FormData();
    formData.append('file', file);

    console.log('📤 Uploading file:', file.name, file.type, file.size);

    const response = await fetch(`${API_BASE}/files/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Upload failed:', response.status, errorText);
      throw new Error(`Ошибка загрузки файла: ${response.status}`);
    }

    const result = await response.json();
    console.log('✅ Upload successful:', result);
    return result;
  }

  // Proofs Management (только создание)
  async addChallengeProofs(challengeId, proofs) {
    return this.request(`/challenges/${challengeId}/proofs`, {
      method: 'POST',
      body: JSON.stringify(proofs),
    });
  }

  // Review & Moderation
  async createChallengeReview(challengeId, approved, comment = '') {
    return this.request(`/reviews/challenges/${challengeId}`, {
      method: 'POST',
      body: JSON.stringify({
        approved: approved,
        comment: comment
      }),
    });
  }

  async getChallengeReviews(challengeId) {
    return this.request(`/reviews/challenges/${challengeId}`);
  }

  // Комплексный метод для завершения с доказательствами
  async completeChallengeWithProofs(challengeId, files, description = '') {
    const proofs = [];
    
    // 1. Загружаем файлы
    for (const file of files) {
      try {
        const uploadResult = await this.uploadFile(file);
        proofs.push({
          file_url: uploadResult.file_url,
          file_type: file.type.startsWith('image/') ? 'image' : 
                     file.type.startsWith('video/') ? 'video' : 'document'
        });
      } catch (error) {
        throw new Error(`Не удалось загрузить файл: ${file.name}`);
      }
    }
    
    // 2. Добавляем доказательства
    if (proofs.length > 0) {
      await this.addChallengeProofs(challengeId, proofs);
    }
    
    // 3. Помечаем как завершенный
    return await this.completeChallenge(challengeId);
  }

  // Получение файлового URL через proxy (если нужно)
  async getFileUrl(fileUrl) {
    // Если файл загружен в MinIO напрямую, может потребоваться преобразование URL
    // Проверяем, если это MinIO URL, конвертируем в публичный
    if (fileUrl && fileUrl.includes('minio') || fileUrl.includes('localhost:9000')) {
      // Извлекаем имя файла из URL
      const fileName = fileUrl.split('/').pop();
      return `${API_BASE}/files/download/${fileName}`;
    }
    return fileUrl;
  }
}

export const apiService = new ApiService();