<template>
    <div id="app">
      <router-view/> <!-- Vue Router outlet where components are rendered based on the route -->
    </div>
  </template>


<script>
export default {
  name: 'App'
}
</script>

<style>
#app {
  font-family: monospace, Tahoma, Geneva, Verdana, sans-serif;
  padding: 20px;
  margin: 0;
}
</style>