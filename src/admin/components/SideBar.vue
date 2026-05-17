<template>
  <div class="sidebar">
    <el-row class="tac">
      <el-col :span="14">
        <el-menu
          default-active="MainPage"
          :default-active="$route.path"
          router
          @open="handleOpen"
          @close="handleClose"
        >
          <el-menu-item index="MainPage">首页</el-menu-item>
          <el-sub-menu index="1">
            <template #title>
              <span>个人管理</span>
            </template>
            <el-menu-item index="ManageMent">我的</el-menu-item>
            <el-menu-item index="MessageLog">好友</el-menu-item>
            <el-menu-item index="PrivateMessage">私信</el-menu-item>
          </el-sub-menu>
        </el-menu>
      </el-col>
    </el-row>
  </div>
</template>
<script setup lang="ts">
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
  height: 300px;
  margin-top: 7%;
}

.tac {
  width: 200px;
}
</style>
