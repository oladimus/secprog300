

export const getCookie = (name: string): string | null => {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'))
    return match ? match[2] : null
}

export const getCsrfToken = () => {
    return getCookie('csrftoken')?.trim() || ''
  }