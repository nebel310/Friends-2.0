import { useEffect } from 'react'

export default function Modal({ title = 'Подтверждение', message, onConfirm, onCancel, confirmText = 'Подтвердить', cancelText = 'Отмена', singleButton = false }) {
  useEffect(() => {
    const handleEsc = (e) => { if (e.key === 'Escape') onCancel() }
    document.addEventListener('keydown', handleEsc)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleEsc)
      document.body.style.overflow = ''
    }
  }, [onCancel])

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onCancel() }}>
      <div className="modal-content">
        <button className="modal-close" onClick={onCancel}>&times;</button>
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
        </div>
        <div className="modal-body">{message}</div>
        <div className="modal-actions">
          {!singleButton && (
            <button className="btn btn-danger" onClick={onCancel}>{cancelText}</button>
          )}
          <button className="btn btn-success" onClick={onConfirm}>{confirmText}</button>
        </div>
      </div>
    </div>
  )
}
