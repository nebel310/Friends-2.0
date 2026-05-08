import { useState, useCallback } from 'react'

export function useModal() {
  const [modal, setModal] = useState(null)

  const confirm = useCallback((message, title = 'Подтверждение') => {
    return new Promise((resolve) => {
      setModal({
        title,
        message,
        onConfirm: () => { setModal(null); resolve(true) },
        onCancel: () => { setModal(null); resolve(false) },
      })
    })
  }, [])

  const alert = useCallback((message, title = 'Уведомление') => {
    return new Promise((resolve) => {
      setModal({
        title,
        message,
        singleButton: true,
        confirmText: 'OK',
        onConfirm: () => { setModal(null); resolve() },
        onCancel: () => { setModal(null); resolve() },
      })
    })
  }, [])

  return { modal, confirm, alert }
}
