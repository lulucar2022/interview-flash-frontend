<template>
  <div class="comment-item" :style="{ marginLeft: depth > 0 ? '48px' : '0' }">
    <div class="comment-main">
      <el-avatar :size="32" :src="comment.authorAvatarUrl">
        {{ (comment.authorNickname || 'U')[0] }}
      </el-avatar>
      <div class="comment-body">
        <div class="comment-header">
          <router-link
            class="comment-author"
            :to="'/author/' + comment.authorId"
            @click.stop
          >{{ comment.authorNickname }}</router-link>
          <span class="comment-date">{{ formatDate(comment.createdAt) }}</span>
        </div>

        <div v-if="editing" class="edit-form">
          <el-input
            v-model="editContent"
            type="textarea"
            :rows="2"
            size="small"
          />
          <div class="edit-actions">
            <el-button size="small" type="primary" :loading="editLoading" @click="handleSaveEdit">保存</el-button>
            <el-button size="small" @click="cancelEdit">取消</el-button>
          </div>
        </div>
        <p v-else class="comment-content">{{ comment.content }}</p>

        <div class="comment-actions">
          <span
            class="action-btn like-btn"
            :class="{ liked: comment.liked }"
            @click="handleLike"
          >
            <el-icon><Star /></el-icon> {{ comment.likeCount || 0 }}
          </span>
          <span
            v-if="userStore.isLoggedIn"
            class="action-btn"
            @click="startReply"
          >回复</span>
          <span
            v-if="isOwner"
            class="action-btn"
            @click="startEdit"
          >编辑</span>
          <span
            v-if="isOwner"
            class="action-btn danger"
            @click="handleDelete"
          >删除</span>
        </div>

        <div v-if="replying" class="reply-form">
          <el-input
            v-model="replyContent"
            type="textarea"
            :rows="2"
            :placeholder="'回复 ' + comment.authorNickname + '...'"
            size="small"
          />
          <div class="reply-actions">
            <el-button size="small" type="primary" :loading="replyLoading" @click="submitReply">发送</el-button>
            <el-button size="small" @click="cancelReply">取消</el-button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="comment.children && comment.children.length > 0" class="comment-children">
      <CommentItem
        v-for="child in comment.children"
        :key="child.id"
        :comment="child"
        :depth="depth + 1"
        :article-id="articleId"
        @reply-submitted="$emit('reply-submitted')"
        @comment-updated="$emit('comment-updated')"
        @comment-deleted="$emit('comment-deleted')"
        @like-toggled="$emit('like-toggled')"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useUserStore } from '@/stores/user'
import { commentApi } from '@/api'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Star } from '@element-plus/icons-vue'

const props = defineProps({
  comment: { type: Object, required: true },
  depth: { type: Number, default: 0 },
  articleId: { type: [String, Number], required: true }
})

const emit = defineEmits(['reply-submitted', 'comment-updated', 'comment-deleted', 'like-toggled'])

const userStore = useUserStore()

const replying = ref(false)
const replyContent = ref('')
const replyLoading = ref(false)
const editing = ref(false)
const editContent = ref('')
const editLoading = ref(false)

const isOwner = computed(() => {
  return userStore.isLoggedIn && userStore.user.id === props.comment.authorId
})

const startReply = () => {
  replying.value = true
  replyContent.value = ''
}

const cancelReply = () => {
  replying.value = false
  replyContent.value = ''
}

const submitReply = async () => {
  if (!replyContent.value.trim()) return
  replyLoading.value = true
  try {
    await commentApi.create({
      articleId: props.articleId,
      content: replyContent.value.trim(),
      parentId: props.comment.id
    })
    ElMessage.success('回复成功')
    replying.value = false
    replyContent.value = ''
    emit('reply-submitted')
  } catch {
    ElMessage.error('回复失败')
  } finally {
    replyLoading.value = false
  }
}

const startEdit = () => {
  editing.value = true
  editContent.value = props.comment.content
}

const cancelEdit = () => {
  editing.value = false
  editContent.value = ''
}

const handleSaveEdit = async () => {
  if (!editContent.value.trim()) return
  editLoading.value = true
  try {
    await commentApi.update(props.articleId, props.comment.id, { content: editContent.value.trim() })
    ElMessage.success('编辑成功')
    editing.value = false
    emit('comment-updated')
  } catch {
    ElMessage.error('编辑失败')
  } finally {
    editLoading.value = false
  }
}

const handleDelete = async () => {
  try {
    await ElMessageBox.confirm('确定要删除该评论吗？', '确认删除', {
      type: 'warning',
      confirmButtonText: '确定',
      cancelButtonText: '取消'
    })
    await commentApi.delete(props.articleId, props.comment.id)
    ElMessage.success('评论已删除')
    emit('comment-deleted')
  } catch {
    // cancelled
  }
}

const handleLike = async () => {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录')
    return
  }
  try {
    const res = await commentApi.toggleLike(props.articleId, props.comment.id)
    props.comment.liked = res.data.liked
    props.comment.likeCount += res.data.liked ? 1 : -1
    emit('like-toggled')
  } catch {
    ElMessage.error('操作失败')
  }
}

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}
</script>

<script>
export default {
  name: 'CommentItem'
}
</script>

<style scoped>
.comment-item {
  margin-bottom: 4px;
}

.comment-main {
  display: flex;
  gap: 10px;
  padding: 12px 0;
}

.comment-body {
  flex: 1;
  min-width: 0;
}

.comment-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.comment-author {
  font-size: 13px;
  font-weight: 500;
  color: #409EFF;
  text-decoration: none;
}

.comment-date {
  font-size: 11px;
  color: #bbb;
}

.comment-content {
  font-size: 14px;
  color: #333;
  line-height: 1.5;
  margin: 0 0 6px 0;
}

.comment-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.action-btn {
  font-size: 12px;
  color: #999;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 3px;
}

.action-btn:hover {
  color: #409EFF;
}

.action-btn.danger:hover {
  color: #F56C6C;
}

.like-btn.liked {
  color: #e6a23c;
}

.edit-actions,
.reply-actions {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.edit-form,
.reply-form {
  margin: 8px 0;
}

.comment-children {
  border-left: 2px solid #f0f0f0;
  padding-left: 0;
}
</style>
