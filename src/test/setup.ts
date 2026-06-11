import { vi } from 'vitest'
import { config } from '@vue/test-utils'

// Mock Pinia stores
vi.mock('@/stores/user', () => ({
  useUserStore: vi.fn(() => ({
    token: 'test-token',
    user: { id: 1, nickname: 'TestUser', email: 'test@example.com' },
    isLoggedIn: true,
    logout: vi.fn(),
    updateUser: vi.fn(),
    login: vi.fn(),
    register: vi.fn(),
    fetchUser: vi.fn()
  }))
}))

vi.mock('@/stores/app', () => ({
  useAppStore: vi.fn(() => ({
    loading: false,
    loadingText: '加载中...',
    setLoading: vi.fn()
  }))
}))

// Mock vue-router
vi.mock('vue-router', async () => {
  const actual = await vi.importActual('vue-router')
  return {
    ...actual,
    useRouter: vi.fn(() => ({
      push: vi.fn(),
      replace: vi.fn()
    })),
    useRoute: vi.fn(() => ({
      path: '/',
      query: {},
      params: {}
    }))
  }
})

// Mock Element Plus
vi.mock('element-plus', () => {
  const mockEl = (name: string) => ({
    name,
    setup: () => ({}),
    render: () => null
  })
  return {
    ElMessage: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() },
    ElMessageBox: { confirm: vi.fn() },
    ElNotification: { success: vi.fn(), error: vi.fn() },
    ElDropdown: mockEl('ElDropdown'),
    ElDropdownMenu: mockEl('ElDropdownMenu'),
    ElDropdownItem: mockEl('ElDropdownItem'),
    ElAvatar: mockEl('ElAvatar'),
    ElButton: mockEl('ElButton'),
    ElInput: mockEl('ElInput'),
    ElSkeleton: mockEl('ElSkeleton'),
    ElSkeletonItem: mockEl('ElSkeletonItem'),
    ElIcon: mockEl('ElIcon'),
    ElDrawer: mockEl('ElDrawer'),
    default: {}
  }
})

// Mock @unhead/vue
vi.mock('@unhead/vue', () => ({
  useHead: vi.fn(),
  createHead: vi.fn(() => ({ install: vi.fn() }))
}))

// Mock @/router (prevent actual router creation)
vi.mock('@/router', () => ({
  default: {
    push: vi.fn(),
    replace: vi.fn(),
    beforeEach: vi.fn()
  }
}))

// Mock axios
vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => ({
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      interceptors: {
        request: { use: vi.fn() },
        response: { use: vi.fn() }
      }
    }))
  }
}))

// Mock EventSource (SSE) for NotificationBell
class MockEventSource {
  static readonly CONNECTING = 0
  static readonly OPEN = 1
  static readonly CLOSED = 2
  readyState: number = MockEventSource.CONNECTING
  onopen: ((event: Event) => void) | null = null
  onmessage: ((event: MessageEvent) => void) | null = null
  onerror: ((event: Event) => void) | null = null
  private listeners: Record<string, Array<(event: Event) => void>> = {}

  constructor(_url: string | URL, _eventSourceInitDict?: EventSourceInit) {
    setTimeout(() => {
      this.readyState = MockEventSource.OPEN
      this.onopen?.(new Event('open'))
    }, 0)
  }

  addEventListener(type: string, listener: (event: Event) => void) {
    if (!this.listeners[type]) this.listeners[type] = []
    this.listeners[type].push(listener)
  }

  removeEventListener(type: string, listener: (event: Event) => void) {
    if (this.listeners[type]) {
      this.listeners[type] = this.listeners[type].filter(l => l !== listener)
    }
  }

  dispatchEvent(event: Event): boolean {
    const handlers = this.listeners[event.type]
    if (handlers) handlers.forEach(h => h(event))
    return true
  }

  close() {
    this.readyState = MockEventSource.CLOSED
  }
}

globalThis.EventSource = MockEventSource as unknown as typeof EventSource

// Suppress vue warnings in tests
config.global.stubs = {
  'router-link': {
    props: ['to'],
    template: '<a :href="to"><slot /></a>'
  },
  'router-view': {
    template: '<div><slot /></div>'
  },
  'transition': {
    template: '<slot />'
  },
  'transition-group': {
    template: '<slot />'
  }
}
