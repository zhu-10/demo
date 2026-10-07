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

  const maxSize = 4 * 1024 * 1024
  if (file.size > maxSize) {
    ElMessage.error(`图片大小不能超过 ${maxSize / (1024 * 1024)}MB`)
    onError(new Error('图片过大'))
    return
  }

  // 生成本地预览 URL
  const url = URL.createObjectURL(file)
  const target = fileList.value.find((item) => item.uid === file.uid)
  if (target) {
    target.url = url
  }

  // 直接标记为成功，不发送请求
  onSuccess()
  ElMessage.success('图片已选择')
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

// 1. 获取列表（用于页面加载和刷新）
const getList = async () => {
  const token = localStorage.getItem('access_token')
  if (!token) {
    ElMessage.error('请先登录')
    router.push('/1')
    return
  }
  currentPage.value = 1
  noMore.value = false

  try {
    // ✅ 发起 GET 请求，并将响应赋值给 res
    const res = await request.get('/shu/list', {
      params: { page: currentPage.value } // 根据实际传参
    })
    const listData = res.data || []  // 现在 res 已定义
    list.value = [...new Map(listData.map((item) => [item.id, item])).values()]
  } catch (err) {
    console.error('获取列表失败', err)
  }
}

//  提交表单（点击按钮时触发）
const submitForm = async () => {
  const token = localStorage.getItem('access_token')
  if (loading.value) return
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
    const imageFile = fileList.value[0].raw
    if (imageFile) {
      formData.append('image', imageFile)
    }
  }

  loading.value = true
  try {
    const res = await request.post('/shu/daily/', formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': undefined
      }
    })

    if (res.status === 201 || res.status === 200) {
      ElMessage.success('发布成功')
      await getList()  // ✅ 正确：刷新列表数据
      dialogFormVisible.value = false
      form.theme = ''
      form.content = ''
      form.image = ''
      fileList.value = []
    } else {
      ElMessage.error(`发布失败：${res.data?.message || '未知错误'}`)
    }
  } catch (err) {
    console.error('发布请求失败', err)
    ElMessage.error('发布请求失败')
    const uploadRes = await uploadApi(data)
console.log('上传返回:', uploadRes)
  }
  finally {
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
