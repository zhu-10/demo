<template>
  <div class="common-layout">
    <el-container>
      <el-header>
        <Header />
      </el-header>
      <el-container>
        <el-aside>
          <Sidebar />
        </el-aside>
        <el-container>
          <router-view />
        </el-container>
      </el-container>
    </el-container>
  </div>
</template>
<script setup>
import Header from './components/HeaderPage.vue'
import Sidebar from './components/SideBar.vue'
</script>
<style scoped>
.common-layout {
  background: rgb(211, 211, 211);
  height: 97vh;
  width: 99vw;
}
.el-header {
  padding: 0;
}
</style>
