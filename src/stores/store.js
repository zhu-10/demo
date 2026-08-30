import { createStore } from 'vuex'

export default createStore({
  state: {
    user: {
      id: null,
      name: '',
      token: '',
    },
    search: {
      keyword: '',
      visible: false,
      results: [],
    },
  }, // 定义全局状态
  mutations: {
    //更新user信息方法
    setUser(state, userdata) {
      console.warn('🔴 setUser 被调用，userdata:', userdata);
      console.warn('🔴 token 内容:', userdata.token);
      console.warn('🔴 token 长度:', userdata.token?.length);
      state.user.id = userdata.id
      state.user.username = userdata.username
      state.user.token = userdata.token
      localStorage.setItem('access_token', userdata.token) // 将 token 存储到 localStorage
    },
    setSearchKeyword(state, keyword) {
      state.search.keyword = keyword
    },
    setSearchVisible(state, visible) {
      state.search.visible = visible
    },
    setSearchResults(state, results) {
      state.search.results = results
    },
    clearSearch(state) {
      state.search.keyword = ''
      state.search.visible = false
      state.search.results = []
    },
    logout(state) {
      state.access = { id: null, name: '', token: '' }
      localStorage.removeItem('access_token') // 从 localStorage 中移除 token
    },
  }, // 定义同步修改状态的方法
  actions: {}, // 定义异步修改状态的方法
  modules: {}, // 定义模块化的状态管理
})
