### 1. Структура БД (Дополненная)

**Блок: Users** (уже есть)
```json
{
  "User": {
    "id": "Integer, PK, AutoIncrement",
    "username": "String, Unique, NotNull",
    "email": "String, Unique, NotNull", 
    "hashed_password": "String, NotNull",
    "is_confirmed": "Boolean, Default=False",
    "created_at": "DateTime, Default=now()",
    "updated_at": "DateTime, Default=now(), onupdate=now()"
  }
}
```

**Блок: Friends**
```json
{
  "Friendship": {
    "id": "Integer, PK, AutoIncrement",
    "user1_id": "Integer, FK->User.id, NotNull",
    "user2_id": "Integer, FK->User.id, NotNull",
    "status": "Enum('pending','accepted','blocked'), Default='pending'",
    "created_at": "DateTime, Default=now()",
    "updated_at": "DateTime, Default=now(), onupdate=now()"
  }
}
```

**Блок: Challenges**
```json
{
  "Challenge": {
    "id": "Integer, PK, AutoIncrement",
    "title": "String(100), NotNull",
    "description": "Text",
    "created_by_id": "Integer, FK->User.id, NotNull",
    "created_for_id": "Integer, FK->User.id, NotNull",
    "status": "Enum('pending','accepted','completed','approved','rejected'), Default='pending'",
    "rejection_reason": "Text, Nullable",
    "created_at": "DateTime, Default=now()",
    "updated_at": "DateTime, Default=now(), onupdate=now()",
    "completed_at": "DateTime, Nullable"
  },
  "Proof": {
    "id": "Integer, PK, AutoIncrement",
    "challenge_id": "Integer, FK->Challenge.id, NotNull",
    "file_url": "String(255), NotNull",
    "file_type": "Enum('image','video'), NotNull",
    "created_at": "DateTime, Default=now()",
    "updated_at": "DateTime, Default=now(), onupdate=now()"
  }
}
```

---

### 2. Роуты с JSON схемами

**Блок: Friends**
```json
{
  "GET /friends/requests": {
    "response": [{
      "id": "integer",
      "user": {"id": "integer", "username": "string", "email": "string"},
      "status": "string",
      "created_at": "string"
    }]
  },
  "POST /friends/requests": {
    "request": {
      "username_or_email": "string"
    },
    "response": {
      "friendship_id": "integer",
      "status": "string"
    }
  },
  "POST /friends/requests/{friendship_id}/accept": {
    "response": {
      "status": "string"
    }
  },
  "POST /friends/requests/{friendship_id}/reject": {
    "response": {
      "status": "string"
    }
  },
  "DELETE /friends/{friendship_id}": {
    "response": {
      "status": "string"
    }
  },
  "GET /friends": {
    "response": [{
      "id": "integer",
      "friend": {"id": "integer", "username": "string", "email": "string"},
      "status": "string",
      "created_at": "string"
    }]
  }
}
```

**Блок: Challenges**
```json
{
  "POST /challenges": {
    "request": {
      "title": "string, min=1, max=100",
      "description": "string, optional", 
      "created_for_id": "integer"
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
      "status": "string, optional",
      "type": "string, optional" // 'my_tasks', 'moderation', 'archive'
    },
    "response": [{
      "id": "integer",
      "title": "string",
      "status": "string",
      "created_by": {"id": "integer", "username": "string"},
      "created_for": {"id": "integer", "username": "string"},
      "created_at": "string",
      "proofs": [{"id": "integer", "file_url": "string", "file_type": "string"}]
    }]
  },
  "GET /challenges/{challenge_id}": {
    "response": {
      "id": "integer",
      "title": "string", 
      "description": "string",
      "status": "string",
      "rejection_reason": "string",
      "created_by": {"id": "integer", "username": "string"},
      "created_for": {"id": "integer", "username": "string"},
      "created_at": "string",
      "completed_at": "string",
      "proofs": [{
        "id": "integer", 
        "file_url": "string",
        "file_type": "string"
      }]
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

**Блок: Proofs**
```json
{
  "POST /challenges/{challenge_id}/proofs": {
    "request": "form-data: files[] (multiple files)",
    "response": [{
      "id": "integer",
      "file_url": "string", 
      "file_type": "string"
    }]
  }
}
```

**Блок: Reviews**
```json
{
  "POST /challenges/{challenge_id}/review": {
    "request": {
      "approved": "boolean",
      "rejection_reason": "string, optional"
    },
    "response": {
      "status": "string"
    }
  }
}
```

---

### 3. Карта сайта (Frontend Routes)

```
/
├── /login
├── /register
├── /pairs (Мои пары)
│   └── /:pair_id (Конкретная пара)
│       ├── /my-tasks (Мои задания - по умолчанию)
│       ├── /moderation (На модерации)
│       └── /archive (Архив пары)
├── /archive (Общий архив)
└── /challenge/:id (Детали задания)
```

---

### 4. User-Flow

**Регистрация/Вход**
```
/register -> подтверждение email -> /login -> /pairs
```

**Создание и управление парами**
```
/pairs -> "Добавить друга" (по username/email)
-> У друга: /pairs -> входящие заявки -> принять/отклонить
-> После принятия: появляется в "Мои пары"
```

**Работа с заданиями в паре**

*Страница пары (/pairs/:pair_id):*
- **Мои задания** (задания от друга мне):
  - Карточка задания -> детали -> "Принять"/"Отклонить"
  - Принятое задание -> "Выполнить" -> модалка с drag-nrop файлов -> отправка

- **На модерации** (мои задания другу на проверке):
  - Карточка задания -> детали + пруфы -> "Одобрить"/"Отклонить"
  - При отклонении: модалка с причиной -> задание возвращается другу

- **Архив пары** (одобренные задания в этой паре)

*Общий архив (/archive):*
- Все одобренные задания от всех пар

**Статусы задания:**
- `pending` - создано, ждет принятия
- `accepted` - принято, можно выполнять  
- `completed` - выполнено, ждет проверки
- `approved` - проверено и одобрено
- `rejected` - отклонено (с причиной)

---

### 5. Детализация страниц

**/pairs** - Карточки пар:
- Аватар + username друга
- Кнопка "Удалить пару"
- Ссылка на страницу пары

**/pairs/:pair_id** (вкладки):
- **Мои задания** - задания от друга:
  - Карточка: заголовок, статус, кнопка "Подробнее"
  - В деталях: полное описание, кнопки действий по статусу

- **На модерации** - задания другу на проверке:
  - Карточка: заголовок, "Ожидает проверки"
  - В деталях: описание + пруфы + кнопки модерации

- **Архив пары** - завершенные задания:
  - Карточка: заголовок, дата выполнения
  - В деталях: описание + пруфы (только просмотр)

**Модальные окна:**
- Выполнить задание: drag-n-drop multiple files
- Отклонить выполнение: текстовое поле + подтверждение

Все роуты и схемы готовы для прямой реализации в коде.