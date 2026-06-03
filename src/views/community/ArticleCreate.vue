<template>
  <div class="page-container">
    <div class="create-card" v-tilt>
      <h2 class="page-title" style="margin-bottom: 24px">{{ isEdit ? '编辑文章' : '发布文章' }}</h2>

      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-position="top"
        @submit.prevent="handleSubmit"
      >
        <el-form-item label="标题" prop="title">
          <el-input
            v-model="form.title"
            placeholder="请输入文章标题（3-200个字符）"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="话题" prop="topicId">
          <el-select
            v-model="form.topicId"
            placeholder="请选择话题"
            style="width: 100%"
          >
            <el-option
              v-for="topic in topics"
              :key="topic.id"
              :label="topic.topicName || topic.name"
              :value="topic.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="内容" prop="content">
          <el-input
            v-model="form.content"
            type="textarea"
            :rows="15"
            placeholder="请输入文章内容（支持HTML）"
          />
        </el-form-item>

        <el-form-item label="标签" prop="tags">
          <el-input
            v-model="form.tags"
            placeholder="多个标签用逗号分隔，如：Java,Spring,MySQL"
          />
        </el-form-item>

        <el-form-item>
          <el-button v-if="!isEdit" :loading="submitting" @click="handleSaveDraft">
            保存草稿
          </el-button>
          <el-button type="primary" :loading="submitting" @click="handleSubmit">
            {{ isEdit ? '保存修改' : '发布文章' }}
          </el-button>
          <el-button @click="$router.push(isEdit ? `/articles/${articleId}` : '/articles')">
            {{ isEdit ? '取消编辑' : '取消' }}
          </el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { articleApi, topicApi } from '@/api'
import { ElMessage } from 'element-plus'

const route = useRoute()
const router = useRouter()
const formRef = ref()
const submitting = ref(false)
const topics = ref([])

const articleId = computed(() => route.params.id)
const isEdit = computed(() => !!articleId.value)

const form = reactive({
  title: '',
  topicId: '',
  content: '',
  tags: ''
})

const rules = {
  title: [
    { required: true, message: '请输入文章标题', trigger: 'blur' },
    { min: 3, max: 200, message: '标题长度在 3 到 200 个字符', trigger: 'blur' }
  ],
  topicId: [
    { required: true, message: '请选择话题', trigger: 'change' }
  ],
  content: [
    { required: true, message: '请输入文章内容', trigger: 'blur' }
  ]
}

const fetchTopics = async () => {
  try {
    const res = await topicApi.getAll()
    topics.value = Array.isArray(res.data) ? res.data : []
  } catch {
    topics.value = []
  }
}

const fetchArticle = async () => {
  try {
    const res = await articleApi.getById(articleId.value)
    const data = res.data
    form.title = data.title || ''
    form.content = data.content || ''
    form.topicId = data.topic?.id || ''
    form.tags = data.tags || ''
  } catch {
    ElMessage.error('加载文章失败')
    router.push('/articles')
  }
}

const doCreate = async (status) => {
  submitting.value = true
  try {
    const payload = {
      title: form.title,
      content: form.content,
      topicId: form.topicId,
      tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      status
    }
    const res = await articleApi.create(payload)
    if (status === 'DRAFT') {
      ElMessage.success('草稿已保存')
      router.push('/articles')
    } else {
      ElMessage.success('文章发布成功')
      router.push(`/articles/${res.data.id}`)
    }
  } catch {
    ElMessage.error(status === 'DRAFT' ? '保存草稿失败，请稍后重试' : '发布失败，请稍后重试')
  } finally {
    submitting.value = false
  }
}

const handleSubmit = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    if (isEdit.value) {
      submitting.value = true
      try {
        const payload = {
          title: form.title,
          content: form.content,
          topicId: form.topicId,
          tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : []
        }
        await articleApi.update(articleId.value, payload)
        ElMessage.success('文章修改成功')
        router.push(`/articles/${articleId.value}`)
      } catch {
        ElMessage.error('修改失败，请稍后重试')
      } finally {
        submitting.value = false
      }
    } else {
      await doCreate('PUBLISHED')
    }
  })
}

const handleSaveDraft = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    await doCreate('DRAFT')
  })
}

onMounted(async () => {
  await fetchTopics()
  if (isEdit.value) {
    await fetchArticle()
  }
})
</script>

<style scoped>
.create-card {
  max-width: 800px;
  margin: 0 auto;
  background: #fff;
  border-radius: 8px;
  padding: 32px;
  box-shadow: 0 0 0 1px var(--color-ring);
}
</style>
