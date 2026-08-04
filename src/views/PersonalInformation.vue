<!-- 个人详情 -->
<template>
  <el-descriptions title="用户信息" direction="vertical" :column="4" :size="size" border>
    <el-descriptions-item label="Username">kooriookami</el-descriptions-item>
    <el-descriptions-item label="Telephone">18100000000</el-descriptions-item>
    <el-descriptions-item label="Place" :span="2">Suzhou</el-descriptions-item>
    <el-descriptions-item label="Remarks">
      <el-tag size="small">School</el-tag>
    </el-descriptions-item>
    <el-descriptions-item label="Address">
      No.1188, Wuzhong Avenue, Wuzhong District, Suzhou, Jiangsu Province
    </el-descriptions-item>
  </el-descriptions>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const size = ref('default')
</script>
<style scoped>
.el-descriptions {
  margin-top: 20px;
}
.wai {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 1020px;
  width: 1873px;
  background: linear-gradient(130deg, #e4a276 50%, #7c5fcc 100%);
}
</style>
