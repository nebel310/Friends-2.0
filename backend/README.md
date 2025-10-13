# Friends-2.0
# Тех. задание проекта

1. Структура БД

Users

· id (Integer, Primary Key, Auto-increment)
· username (String, Unique, Not Null)
· email (String, Unique, Not Null)
· hashed_password (String, Not Null)
· created_at (DateTime, Default=now())
· updated_at (DateTime, Default=now(), onupdate=now())

Friendships

· id (Integer, Primary Key, Auto-increment)
· user1_id (Integer, ForeignKey('users.id'), Not Null)
· user2_id (Integer, ForeignKey('users.id'), Not Null)
· status (Enum('pending','accepted','blocked'), Default='pending')
· created_at (DateTime, Default=now())
· updated_at (DateTime, Default=now(), onupdate=now())

Challenges

· id (Integer, Primary Key, Auto-increment)
· friendship_id (Integer, ForeignKey('friendships.id'), Not Null)
· created_by_id (Integer, ForeignKey('users.id'), Not Null)
· title (String, Not Null)
· description (Text, Nullable)
· status (Enum('pending','accepted','completed','approved','rejected'), Default='pending')
· rejection_reason (Text, Nullable)
· created_at (DateTime, Default=now())
· updated_at (DateTime, Default=now(), onupdate=now())
· completed_at (DateTime, Nullable)

Proofs

· id (Integer, Primary Key, Auto-increment)
· challenge_id (Integer, ForeignKey('challenges.id'), Not Null)
· file_url (String, Not Null)
· file_type (Enum('image','video'), Not Null)
· created_at (DateTime, Default=now())

Reviews

· id (Integer, Primary Key, Auto-increment)
· challenge_id (Integer, ForeignKey('challenges.id'), Not Null)
· reviewer_id (Integer, ForeignKey('users.id'), Not Null)
· approved (Boolean, Not Null)
· comment (Text, Nullable)
· reviewed_at (DateTime, Default=now())

---

2. Роуты с JSON схемами

Блок: Auth

```json
{
  "POST /auth/register": {
    "request": {
      "username": "string, min=3, max=50",
      "email": "string, email", 
      "password": "string, min=6"
    },
    "response": {
      "id": "integer",
      "username": "string",
      "email": "string"
    }
  },
  "POST /auth/login": {
    "request": {
      "username": "string",
      "password": "string"
    },
    "response": {
      "access_token": "string",
      "refresh_token": "string",
      "token_type": "string"
    }
  },
  "POST /auth/refresh": {
    "request": {
      "refresh_token": "string"
    },
    "response": {
      "access_token": "string",
      "token_type": "string"
    }
  },
  "GET /auth/me": {
    "response": {
      "id": "integer",
      "username": "string",
      "email": "string"
    }
  }
}
```

Блок: Friends

```json
{
  "GET /friends": {
    "response": [{
      "id": "integer",
      "user1": {"id": "integer", "username": "string"},
      "user2": {"id": "integer", "username": "string"},
      "status": "string",
      "created_at": "string"
    }]
  },
  "POST /friends/request": {
    "request": {
      "username_or_email": "string"
    },
    "response": {
      "friendship_id": "integer",
      "status": "string"
    }
  },
  "GET /friends/requests": {
    "response": [{
      "id": "integer", 
      "user1": {"id": "integer", "username": "string"},
      "status": "string",
      "created_at": "string"
    }]
  },
  "POST /friends/{friendship_id}/accept": {
    "response": {
      "status": "string"
    }
  },
  "POST /friends/{friendship_id}/reject": {
    "response": {
      "status": "string"
    }
  },
  "DELETE /friends/{friendship_id}": {
    "response": {
      "status": "string"
    }
  }
}
```

Блок: Challenges

```json
{
  "POST /challenges": {
    "request": {
      "friendship_id": "integer",
      "title": "string, min=1, max=100",
      "description": "string, optional"
    },
    "response": {
      "id": "integer",
      "title": "string",
      "status": "string"
    }
  },
  "GET /challenges": {
    "query_params": {
      "friendship_id": "integer, optional",
      "status": "string, optional"
    },
    "response": [{
      "id": "integer",
      "title": "string",
      "status": "string",
      "friendship_id": "integer",
      "created_by": {"id": "integer", "username": "string"},
      "created_at": "string"
    }]
  },
  "GET /challenges/{challenge_id}": {
    "response": {
      "id": "integer",
      "title": "string",
      "description": "string",
      "status": "string",
      "friendship_id": "integer",
      "created_by": {"id": "integer", "username": "string"},
      "created_at": "string",
      "completed_at": "string",
      "proofs": [{
        "id": "integer", 
        "file_url": "string",
        "file_type": "string"
      }],
      "review": {
        "approved": "boolean",
        "comment": "string",
        "reviewed_at": "string"
      }
    }
  },
  "POST /challenges/{challenge_id}/accept": {
    "response": {
      "status": "string"
    }
  },
  "POST /challenges/{challenge_id}/reject": {
    "response": {
      "status": "string"
    }
  },
  "POST /challenges/{challenge_id}/complete": {
    "response": {
      "status": "string"
    }
  }
}
```

Блок: Proofs

```json
{
  "POST /challenges/{challenge_id}/proofs": {
    "request": "form-data: file (image/jpeg, image/png, video/mp4)",
    "response": {
      "id": "integer",
      "file_url": "string", 
      "file_type": "string"
    }
  },
  "DELETE /proofs/{proof_id}": {
    "response": {
      "status": "string"
    }
  }
}
```

Блок: Reviews

```json
{
  "POST /challenges/{challenge_id}/review": {
    "request": {
      "approved": "boolean",
      "comment": "string, optional"
    },
    "response": {
      "review_id": "integer",
      "status": "string"
    }
  }
}
```

---

3. Карта сайта

```
/
├── /login
├── /register
├── /friends (мои пары)
├── /friends/:id (конкретная пара)
│   ├── /challenges (мои задания - по умолчанию)
│   ├── /moderation (на модерации)
│   └── /archive (архив пары)
├── /challenges/:id (страница задания)
└── /archive (общий архив)
```

---

4. User-Flow

Регистрация/Логин

· POST /auth/register → POST /auth/login → сохранить токены

Работа с друзьями

· GET /friends → просмотр пар и заявок
· POST /friends/request → отправить заявку по username/email
· GET /friends/requests → просмотр входящих заявок
· POST /friends/{id}/accept → принять заявку
· DELETE /friends/{id} → удалить пару

Работа с заданиями в паре

· GET /friends/{id}/challenges → список заданий (status: pending, accepted)
· POST /challenges → создать задание для пары
· GET /challenges/{id} → детали задания
· POST /challenges/{id}/accept → принять вызов
· POST /challenges/{id}/reject → отклонить вызов
· POST /challenges/{id}/complete → отметить как выполненное
· POST /challenges/{id}/proofs → загрузить пруфы

Модерация заданий

· GET /friends/{id}/moderation → задания на проверке (status: completed)
· POST /challenges/{id}/review → проверить задание (approved: true/false)

Архивы

· GET /friends/{id}/archive → архив пары (status: approved)
· GET /archive → общий архив всех approved заданий

Статусы задания:

· pending - создано, ждет принятия
· accepted - принято, можно выполнять
· completed - выполнено, ждет проверки
· approved - проверено и принято
· rejected - отклонено (с причиной)
