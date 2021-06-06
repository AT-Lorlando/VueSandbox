<template>
  <div class="box">
    <Stellar>
      
    </Stellar>
  </div>
</template>

<script>
import Stellar from './components/Stellar'

export default {
  name: 'App',
  components: { Stellar },
  data() {
    return {
      title: 'My First Vue App!',
    }
  }
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
h1 {
  border-bottom: 1px solid #ddd;
  display: inline-block;
  padding-bottom: 10px;
}
</style>