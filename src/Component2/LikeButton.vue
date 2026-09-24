<template>
  <!-- 点赞按钮 -->
  <div class="action-item" @click="toggleLike">
    <el-badge :value="likeCount" :hidden="likeCount === 0">
      <icon />
    </el-badge>
  </div>
  <!-- 评论按钮 -->
  <Popover v-if="post" v-model:comment="post.comment" :shuId="post.id"/>
</template>

<script setup>
import { ref, computed } from 'vue'
import icon from '../icon/icon.vue'
import Popover from './Popover.vue'
import { Star, StarFilled } from '@element-plus/icons-vue'

const post = ref({
  id: 1,
  title: '示例帖子',
  comment: 0, // 评论数
})
// ========== Props ==========
const props = defineProps({
  // 初始点赞数
  initialLikeCount: {
    type: Number,
    default: 0,
  },
})
const updateComment = (newComment) => {
  post.value.comment = newComment // 关键：.value
}
// ========== Emits ==========
const emit = defineEmits(['like-change', 'comment-click'])

// ========== 点赞逻辑 ==========
const isLiked = ref(false)
const likeCount = ref(props.initialLikeCount)

const likeIcon = computed(() => (isLiked.value ? StarFilled : Star))

const toggleLike = () => {
  if (isLiked.value) {
    likeCount.value -= 1
  } else {
    likeCount.value += 1
  }
  isLiked.value = !isLiked.value
  // 向父组件通知点赞数量变化（可用于同步到后端）
  emit('like-change', likeCount.value, isLiked.value)
}
</script>

<style scoped>
.post-actions {
  display: flex;
  align-items: center;
}

.action-item {
  display: flex;
  margin-top: auto; /* 将图标推到列表项的底部 */
  gap: 7px;
  cursor: pointer;
  user-select: none;
  transition: all 0.2s;
}

.action-icon {
  font-size: 22px;
  color: #8a8a8a;
  transition:
    color 0.2s,
    transform 0.1s;
}

.action-item:hover .action-icon {
  transform: scale(1.1);
}

/* 点赞激活态颜色 */
.action-icon.is-liked {
  color: #f56c6c;
}

/* 评论悬停颜色 */
.action-item:last-child:hover .action-icon {
  color: #409eff;
}

.divider {
  width: 1px;
  height: 24px;
  background: #e4e7ed;
  margin: 0 24px;
}

/* 响应式 */
@media (max-width: 480px) {
  .divider {
    margin: 0 16px;
  }
  .action-icon {
    font-size: 20px;
  }
  .action-text {
    font-size: 13px;
  }
}
</style>
