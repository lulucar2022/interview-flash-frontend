import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Header from '@/components/Header.vue'

describe('Header.vue', () => {
  const createWrapper = () => {
    return mount(Header, {
      global: {
        mocks: {
          $route: { path: '/' }
        }
      }
    })
  }

  it('renders the logo text', () => {
    const wrapper = createWrapper()
    expect(wrapper.text()).toContain('面试刷题系统')
  })

  it('renders navigation links', () => {
    const wrapper = createWrapper()
    const navLinks = ['首页', '题库', '在线刷题', '错题本', '统计', '社区', '系列']
    for (const link of navLinks) {
      expect(wrapper.text()).toContain(link)
    }
  })

  it('renders user area', () => {
    const wrapper = createWrapper()
    expect(wrapper.find('.user-area').exists()).toBe(true)
  })
})
