<template>
  <!-- 主页页面 -->
  <div class="main-wai">
    <el-space fill style="height: 50px">
      <div class="main-shua">
        <el-button style="margin-right: 15px" type="primary" plain @click="setLoading"
          >刷新</el-button
        >
        <el-button style="margin-right: 30px" type="danger" plain @click="dialogFormVisible = true"
          >发布</el-button
        >
        <el-dialog class="rc" v-model="dialogFormVisible" title="分享日常" style="width: 650px">
          <el-form :model="form">
            <el-form-item label="主题" :label-width="formLabelWidth">
              <el-input v-model="form.theme" autocomplete="off" style="width: 400px" />
            </el-form-item>
            <el-form-item label="内容" :label-width="formLabelWidth">
              <el-input
                type="textarea"
                v-model="form.content"
                size="large"
                maxlength="300"
                style="width: 400px"
                show-word-limit
                :count-graphemes="true"
                placeholder="内容不超过300字"
              />
            </el-form-item>
            <el-form-item label="图片" :label-width="formLabelWidth">
              <el-upload
                action="#"
                list-type="picture-card"
                :auto-upload="false"
                :file-list="fileList"
                :before-upload="beforeAvatarUpload"
                :on-preview="handlePictureCardPreview"
                :on-remove="handleRemove"
                :on-change="handleFileChange"
                multiple
              >
                <el-icon><Plus /></el-icon>

                <template #file="{ file }">
                  <div>
                    <img class="el-upload-list__item-thumbnail" :src="file.url" alt="" />
                    <span class="el-upload-list__item-actions">
                      <span
                        class="el-upload-list__item-preview"
                        @click="handlePictureCardPreview(file)"
                      >
                        <el-icon><zoom-in /></el-icon>
                      </span>
                      <!-- <span @click="handleDownload(file)">
                        <el-icon><Download /></el-icon>
                      </span> -->
                      <span @click="handleRemove(file)">
                        <el-icon><Delete /></el-icon>
                      </span>
                    </span>
                  </div>
                </template>
              </el-upload>

              <el-dialog v-model="dialogVisible">
                <img w-full :src="dialogImageUrl" alt="Preview Image" />
              </el-dialog>
            </el-form-item>
          </el-form>
          <template #footer>
            <div>
              <el-button type="primary" @click="submitForm" :loading="loading">确认</el-button>
            </div>
          </template>
        </el-dialog>
      </div>
    </el-space>
    <InfiniteScroll @scroll="handleScroll" />
  </div>
</template>

<script lang="ts" setup>
// ========== 1. 导入依赖 ==========
import { ref, reactive, computed, onMounted } from 'vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import request from '../../api/axios'
import InfiniteScroll from '../../Component/InfiniteScroll.vue'
import type { UploadProps, UploadUserFile } from 'element-plus'

// ========== 2. 全局实例 ==========
const store = useStore()
const router = useRouter()

// ========== 3. 响应式数据定义（全部放在顶部）==========

// --- 日常发布相关 ---
const list = ref([]) // ✅ 核心修复：定义列表数据
const dialogFormVisible = ref(false)
const loading = ref(false)
const formLabelWidth = '140px'
const fileList = ref<UploadUserFile[]>([]) // 上传的文件列表
const dialogImageUrl = ref('')
const dialogVisible = ref(false)

const form = reactive({
  theme: '',
  content: '',
  image: '',
})

// --- 评论列表相关 ---
const currentPage = ref(1)
const pageSize = 10
const noMore = ref(false)
const scrollContainer = ref<HTMLElement | null>(null)

// ========== 5. 业务方法 ==========

// --- 刷新按钮 ---
const setLoading = async () => {
  loading.value = true
  await getList()
  setTimeout(() => {
    loading.value = false
  }, 3000)
}

// --- 无限滚动处理 ---
const handleScroll = () => {
  const el = scrollContainer.value
  if (!el) return
  const { scrollTop, scrollHeight, clientHeight } = el
  if (scrollHeight - scrollTop <= clientHeight + 50) {
    getList()
  }
}

// --- 关闭评论面板（如果 panelVisible 未定义，请自行补充）---

// --- 上传相关 ---
// 图片上传前校验
const beforeAvatarUpload = async (options) => {
  const { file, onSuccess, onError } = options

  // 前端大小校验（4MB）
  const maxSize = 4 * 1024 * 1024
  if (file.size > maxSize) {
    ElMessage.error(`图片大小不能超过 ${maxSize / (1024 * 1024)}MB`)
    onError(new Error('图片过大'))
    return
  }

  const formData = new FormData()
  formData.append('image', file) // 字段名必须与后端一致

  try {
    const response = await fetch('/shu/daily/daily_image/', {
      method: 'POST', // 根据后端接口要求选择 POST 或 GET
      headers: {
        Authorization: `Bearer ${localStorage.getItem('access_token')}`,

        // 不要手动设置 Content-Type，让浏览器自动设置
      },
      body: formData,
    })

    const result = await response.json()
    if (response.ok && result.image) {
      // 存储图片 URL，用于后续提交日常
      form.image = result.image

      // 更新 fileList 中的预览 URL
      const target = fileList.value.find((item) => item.uid === file.uid)
      if (target) {
        target.url = result.image
      }

      onSuccess(result)
      ElMessage.success('图片上传成功')
    } else {
      throw new Error(result.error || '上传失败')
    }
  } catch (error) {
    console.error('上传图片失败', error)
    onError(error)
    ElMessage.error(error.message || '图片上传失败')
  }
}

// 移除图片
const handleRemove = (file) => {
  const index = fileList.value.findIndex((item) => item.uid === file.uid)
  if (index !== -1) fileList.value.splice(index, 1)
  if (form.image && file.url === form.image) {
    form.image = ''
  }
}

// 预览图片
const handlePictureCardPreview = (file) => {
  dialogImageUrl.value = file.url
  dialogVisible.value = true
  console.log('上传接口返回的完整结果:', result)
  console.log('提取的图片URL:', imageUrl)
}

// 文件列表变化
const handleFileChange = (file, fileListNew) => {
  fileList.value = fileListNew
}

// 下载文件（可选）
// const handleDownload = (file: UploadUserFile) => {
//   window.open(file.url, '_blank')
// }

// --- 提交发布（日常）---
const getList = async () => {
  currentPage.value = 1
  noMore.value = false
  const res = await request.get('/shu/daily/')
  list.value = [...new Map(res.data.map((item) => [item.id, item])).values()] // 去重
  console.log('去重后列表长度:', list.value.length)
  console.log(
    'id列表:',
    list.value.map((i) => i.id),
  )
}
const submitForm = async () => {
  console.log('准备提交的图片URL:', form.image)
  const token = localStorage.getItem('access_token')
  if (loading.value) return // 正在提交中，直接返回
  if (!token) {
    ElMessage.error('请先登录')
    router.push('/1')
    return
  }
  if (!form.theme || !form.content) {
    ElMessage.error('请填写主题、内容')
    return
  }

  const formData = new FormData()
  formData.append('theme', form.theme)
  formData.append('content', form.content)
  if (fileList.value.length > 0) {
    // el-upload 组件中，每个文件的原始 File 对象在 .raw 属性中
    const imageFile = fileList.value[0].raw // 只取第一张图片（或遍历多张）
    if (imageFile) {
      formData.append('image', imageFile) // 发送文件，不是 URL
    }
  } // 确保字段存在，后端可能需要

  loading.value = true
  try {
    const res = await request.get('/shu/list/public?page=1&size=10', formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data', // 手动指定
      },
      transformRequest: [(data) => data], // 关键：防止 axios 转换 FormData
    })
    if (res.status === 201 || res.status === 200) {
      ElMessage.success('发布成功')
      await getList()
      dialogFormVisible.value = false
      form.theme = ''
      form.content = ''
      form.image = [] // 保留，因为 form 中可能还有 image 字段用于存储 URL
      // 已删除 image.value 和 uploadFile.value 的重置
    } else {
      ElMessage.error(`发布失败：${res.data?.message || '未知错误'}`)
    }
  } catch (err: any) {
    console.error('发布请求失败', err)
    ElMessage.error('发布请求失败')
  } finally {
    loading.value = false
  }
}

// ========== 6. 生命周期 ==========
onMounted(() => {
  getList()
})
</script>
<style scoped>
.avatar-uploader .avatar {
  width: 178px;
  height: 178px;
  display: block;
}

.main-wai {
  display: flex;
  margin-top: 15px;
  width: 100%;
}
.main-shua {
  margin-right: -100px; /* 调整右边距 */
  margin-left: -100px; /* 调整左边距 */
  margin-top: 15px; /*向下移动*/
}
.rc {
  width: 300px;
  height: 600px;
}
</style>
<style>
.avatar-uploader .el-upload {
  border: 1px dashed var(--el-border-color);
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: var(--el-transition-duration-fast);
}

.avatar-uploader .el-upload:hover {
  border-color: var(--el-color-primary);
}

.el-icon.avatar-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 100px;
  height: 100px;
  text-align: center;
}
</style>
