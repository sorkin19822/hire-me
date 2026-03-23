declare module '#auth-utils' {
  interface User {
    email: string
    name: string | null
    avatar?: string | null
  }
}

export {}
