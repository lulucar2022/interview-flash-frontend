import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import CommentItem from '@/views/community/CommentItem.vue'

const mockComment = {
  id: 1,
  content: 'This is a test comment',
  authorId: 1,
  authorNickname: 'TestUser',
  authorAvatarUrl: '',
  createdAt: '2026-06-11T10:00:00',
  likeCount: 3,
  liked: false,
  articleId: 1,
  parentId: null,
  children: []
}

describe('CommentItem.vue', () => {
  it('displays comment content', () => {
    const wrapper = mount(CommentItem, {
      props: {
        comment: mockComment,
        articleId: 1,
        depth: 0
      }
    })
    expect(wrapper.text()).toContain('This is a test comment')
  })

  it('displays author nickname', () => {
    const wrapper = mount(CommentItem, {
      props: {
        comment: mockComment,
        articleId: 1,
        depth: 0
      }
    })
    expect(wrapper.text()).toContain('TestUser')
  })

  it('displays like count', () => {
    const wrapper = mount(CommentItem, {
      props: {
        comment: mockComment,
        articleId: 1,
        depth: 0
      }
    })
    expect(wrapper.text()).toContain('3')
  })

  it('renders child comments when present', () => {
    const commentWithChildren = {
      ...mockComment,
      children: [
        { ...mockComment, id: 2, content: 'Child comment', parentId: 1 }
      ]
    }
    const wrapper = mount(CommentItem, {
      props: {
        comment: commentWithChildren,
        articleId: 1,
        depth: 0
      }
    })
    expect(wrapper.text()).toContain('Child comment')
  })

  it('applies margin for nested comments', () => {
    const wrapper = mount(CommentItem, {
      props: {
        comment: mockComment,
        articleId: 1,
        depth: 1
      }
    })
    const item = wrapper.find('.comment-item')
    expect(item.attributes('style')).toContain('margin-left: 48px')
  })
})
