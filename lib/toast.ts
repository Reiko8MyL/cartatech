import { toast } from "sonner"

/**
 * Muestra un toast de éxito
 */
export function toastSuccess(message: string, duration: number = 4000) {
  return toast.success(message, {
    duration,
  })
}

/**
 * Muestra un toast de error
 */
export function toastError(message: string, duration: number = 6000) {
  return toast.error(message, {
    duration,
  })
}

/**
 * Muestra un toast de información
 */
export function toastInfo(message: string, duration: number = 4000) {
  return toast.info(message, {
    duration,
  })
}

/**
 * Muestra un toast de advertencia
 */
export function toastWarning(message: string, duration: number = 5000) {
  return toast.warning(message, {
    duration,
  })
}

/**
 * Muestra un toast de confirmación con botones de acción
 * Retorna una promesa que se resuelve con true si el usuario confirma
 */
export function toastConfirm(
  message: string,
  confirmText: string = "Confirmar",
  cancelText: string = "Cancelar"
): Promise<boolean> {
  return new Promise((resolve) => {
    const toastId = toast(message, {
      duration: Infinity, // El toast permanece hasta que el usuario interactúe
      action: {
        label: confirmText,
        onClick: () => {
          toast.dismiss(toastId)
          resolve(true)
        },
      },
      cancel: {
        label: cancelText,
        onClick: () => {
          toast.dismiss(toastId)
          resolve(false)
        },
      },
    })
  })
}

