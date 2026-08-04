<template>
  <div class="sidebar">
    <el-row class="tac">
      <el-col :span="14">
        <el-menu
          :default-openeds="['1']"
          :default-active="activeMenu"
          router
          @open="handleOpen"
          @close="handleClose"
        >
          <el-menu-item index="MainPage">首页</el-menu-item>
          <el-sub-menu index="1">
            <template #title>
              <span>个人管理</span>
            </template>
            <el-menu-item index="ManageMent">文章</el-menu-item>
            <el-menu-item index="MessageLog">好友</el-menu-item>
            <el-menu-item index="PrivateMessage">私信</el-menu-item>
          </el-sub-menu>
        </el-menu>
      </el-col>
    </el-row>
  </div>
</template>
<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
const route = useRoute()
// 核心2：建立路径到菜单 Index 的映射
const activeMenu = computed(() => {
  const path = route.path
  // 提取路径末尾的名称，例如 /MessageLog 变成 MessageLog
  const indexName = path.substring(path.lastIndexOf('/') + 1)
  // 如果提取出来为空，默认返回首页
  if (!indexName) return 'MainPage'

  // 确保 index 值在你的菜单项里真的存在，如果不存在，也默认返回首页
  const validIndices = ['MainPage', 'ManageMent', 'MessageLog', 'PrivateMessage']
  return validIndices.includes(indexName) ? indexName : 'MainPage'
})

const handleOpen = (key, keyPath) => {
  console.log(key, keyPath)
}
const handleClose = (key, keyPath) => {
  console.log(key, keyPath)
}
</script>
<style scoped>
.sidebar {
  display: flex;
  width: 200px;
  height: 600px;
  margin-top: 7%;
}

.tac {
  width: 200px;
}
</style>
