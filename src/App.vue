<template>
  <div class="box">
  <Flag />    
  </div>
</template>

<script>
import Flag from './components/Flag'
// import Particles from './components/Particles'

// import Particles from './components/Particles.vue'

// import Flag from './components/Flag'


export default {
  name: 'App',
  components: { Flag },
  data() { 
    return {
    }
  },
  methods: {
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
}
h1 {
  border-bottom: 1px solid #ddd;
  display: inline-block;
  padding-bottom: 10px;
}
</style>