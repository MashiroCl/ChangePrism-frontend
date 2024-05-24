<template>
    <div class="timeline">
      <div v-for="(commit, index) in commits" :key="index" class="commit">
        <div class="commit-circle" @click="commitClicked(commit)" :title="commit.message"></div>
      </div>
    </div>
  </template>
  
  <script>
  export default {
    name: "TimeLine",
    props: {
      commits: Array
    },
    methods: {
      commitClicked(commit) {
        this.$emit('commitClicked', commit);
      }
    }
  };
  </script>
  
  <style scoped>
  .timeline {
    display: flex;
    justify-content: space-between;
    align-items: center;
    height: 50px;
    background-color: #f0f0f0;
    border: 1px solid #ccc;
    padding: 0 10px;
    overflow-x: scroll;
  }
  .commit {
    position: relative;
  }
  .commit-circle {
    width: 10px;
    height: 10px;
    background-color: #007bff;
    border-radius: 50%;
    cursor: pointer;
  }
  .commit-circle:hover {
    background-color: #0056b3;
  }
  </style>
  