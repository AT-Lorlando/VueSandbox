<template>
  <div class="box">
    <Stellar />
    <Star :x="x" :y="y" />
  </div>
</template>

<script>
import Stellar from './components/Stellar'
import Star from './components/Star'

export default {
  name: 'App',
  components: { Stellar, Star },
  data() { 
    return {
      x: false,
      y: "Allo",
    }
  },
  methods: {
    changeX() {
      x=!x;
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
}
h1 {
  border-bottom: 1px solid #ddd;
  display: inline-block;
  padding-bottom: 10px;
}
</style>